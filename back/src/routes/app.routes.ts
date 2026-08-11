import { Request, Response, Router } from 'express'
import { Types } from 'mongoose'
import Affordance from 'src/models/affordance.model'
import Constraint from 'src/models/constraint.model'
import Session, { SessionEmphasis, SessionStatus } from 'src/models/session.model'
import { ActivityAssemblyValidationError, assembleActivities } from 'src/services/completion.service'

import Activity, { ActivityStatus } from '../models/activity.model'
import { buildActivityMechanicsFromSkeleton } from '../system/activity/build-activity-mechanics'
import { buildActivitySkeleton } from '../system/activity/build-activity-skeleton'
import ObservationEvent from '../models/observation-event.model'
import { diffActivityEdit } from '../system/activity/activity-edit-evidence'
import {
    COACH_NOTE_MAX_LENGTH,
    OBSERVATION_GROUPS,
    OBSERVATION_LABELS,
    type ObservationCode,
    RUNTIME_INTERFACE_VERSION,
    SESSION_STAGES,
    SESSION_STAGE_LABELS,
    parseObservationCode,
    parseSessionStage,
} from '../system/runtime-interface/observation-vocabulary'
import { buildResolutionNotice, buildUnsupportedGoalGuidance } from '../system/activity/coach-guidance'
import { auditCoachLanguage } from '../system/activity/coach-language'
import { compressActivitiesForCoach } from '../system/activity/compress-activity-output'
import { getSlotMechanicalVariations } from '../system/activity/slot-mechanics-variations'
import User from '../models/user.model'
import Logger from '../logger'
import LoggingService from '../services/logging.service'
import { deriveInputConstraints } from '../system/input-constraints/deriveInputConstraints'
import { describeUnsupportedGoal, isKnownUnsupportedGoal } from '../system/session-planning/goal-support'
import { allClarifications } from '../system/session-planning/guided-clarification'
import {
    sessionPlanningModel,
    translationStatus,
    validateSessionPlanningModel,
} from '../system/session-planning/session-planning-model'
import { emCanonical } from '../system/knowledge-core/em-canonical'
import { reasonEnvironmentalManipulations } from '../system/knowledge-core/em-selection-metadata'
import { recordUsageEvent, summarizeUsage } from '../services/usage-telemetry.service'
import { generateSelection, getTestLibraryV0LoadDebug, systemAssemblyInputFromTestLibrarySelection } from '../system/test-library'
import { ENDPOINTS } from './_endpoints'
import BaseRoutes from './helper'
import { ActivityAssemblyRequest, SystemAssemblyInput, SystemPipelineError } from '../system/types'
import { validateConstraintPackage } from '../system/validate-constraint-package'
import { validateGeneratedActivities } from '../system/validate-generated-activity'

/** Structured selections from the guided planning conversation. Evidence today, routing later. */
interface PlanningSelectionInput {
    learningGoalId?: string
    practiceSituationId?: string | null
    learningStage?: string
}

/**
 * Resolve a Practice Situation id to its authored name and definition.
 *
 * Returns undefined for an absent id — several Learning Goals have no situations and the
 * conversation skips the step, so "none selected" is a normal state rather than an error. An id that
 * does not resolve is different: that means the client and the workbook disagree, so it is logged
 * rather than silently treated as absent.
 */
function resolvePracticeSituation(
    id: string | null | undefined
): { id: string; name: string; definition: string } | undefined {
    if (!id) return undefined

    for (const goal of sessionPlanningModel.learningGoals()) {
        const match = sessionPlanningModel
            .practiceSituationsFor(String(goal['ID']))
            .find((situation) => String(situation['ID']) === id)
        if (match) {
            return {
                id,
                name: String(match['Practice Situation'] ?? ''),
                definition: String(match['Definition'] ?? ''),
            }
        }
    }

    Logger.warn(`[Activity Generation] Practice Situation "${id}" is not in the Session Planning Model.`)
    return undefined
}

const router = Router()
const ROUTES = ENDPOINTS.app
const ACTIVITY_ASSEMBLY_TIMEOUT_MS = Number.parseInt(process.env.ACTIVITY_ASSEMBLY_TIMEOUT_MS ?? '', 10) || 90000

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(message)), timeoutMs)
        promise
            .then(resolve)
            .catch(reject)
            .finally(() => clearTimeout(timeout))
    })
}

const REQUIRED_ACTIVITY_CREATE_FIELDS = ['session', 'title', 'constraint', 'intent'] as const

function missingActivityCreateFields(body: Record<string, unknown>): string[] {
    return REQUIRED_ACTIVITY_CREATE_FIELDS.filter((field) => {
        const value = body[field]
        return typeof value !== 'string' || value.trim().length === 0
    })
}

function validObjectIdRefs(value: unknown): string[] {
    if (!Array.isArray(value)) return []
    return value.filter((entry): entry is string => typeof entry === 'string' && Types.ObjectId.isValid(entry))
}

function arrayOfStrings(value: unknown): string[] {
    if (!Array.isArray(value)) return []
    return value.map((entry) => String(entry ?? '').trim()).filter(Boolean)
}

function isSessionEmphasis(value: unknown): value is SessionEmphasis {
    return typeof value === 'string' && Object.values(SessionEmphasis).includes(value as SessionEmphasis)
}

router.post(ROUTES.testSelection, async (req: Request, res: Response) => {
    try {
        const { learningGoals, sport, sessionDescription, challengeLevel } = req.body as Record<string, unknown>
        Logger.info(
            `[Test Library Selection] coach input (original): ${JSON.stringify({
                learningGoals,
                sport,
                sessionDescription,
                challengeLevel,
            })}`
        )
        const goalsList = learningGoals as string[]
        const inputConstraints = deriveInputConstraints(goalsList.join(' '))
        const result = generateSelection(
            {
                learningGoals: goalsList,
                sport: typeof sport === 'string' ? sport : undefined,
                sessionDescription: typeof sessionDescription === 'string' ? sessionDescription : undefined,
                challengeLevel: typeof challengeLevel === 'string' ? challengeLevel : undefined,
            },
            inputConstraints
        )

        Logger.info(
            `[Test Library Selection] selected archetype: ${result.archetype.game_form_name} (${result.archetype.id})`
        )
        Logger.info(
            `[Test Library Selection] selected lenses: ${result.affordanceLenses.map((l) => l.title).join(' | ')}`
        )
        Logger.info(
            `[Test Library Selection] selected constraints: ${result.constraints.map((c) => c.title).join(' | ')}`
        )

        const libraryLoad = getTestLibraryV0LoadDebug()
        Logger.info(
            `[Test Library V0] total archetypes loaded: ${libraryLoad.counts.totalArchetypesLoaded} ` +
                `(runtime arrays: ${libraryLoad.runtimeArrayLengths.archetypes})`
        )
        Logger.info(
            `[Test Library V0] total affordance lenses loaded: ${libraryLoad.counts.totalAffordanceLensesLoaded} ` +
                `(runtime arrays: ${libraryLoad.runtimeArrayLengths.affordanceLenses})`
        )
        Logger.info(
            `[Test Library V0] total constraints loaded: ${libraryLoad.counts.totalConstraintsLoaded} ` +
                `(runtime arrays: ${libraryLoad.runtimeArrayLengths.constraints})`
        )
        if (libraryLoad.skippedRows.length > 0) {
            Logger.warn(`[Test Library V0] CSV conversion skipped rows: ${JSON.stringify(libraryLoad.skippedRows)}`)
        }
        if (libraryLoad.validationErrors.length > 0) {
            Logger.warn(`[Test Library V0] CSV conversion validation errors: ${JSON.stringify(libraryLoad.validationErrors)}`)
        }
        if (libraryLoad.runtimeCountsMismatch) {
            Logger.warn(
                `[Test Library V0] counts in libraryConversionReport.ts do not match runtime array lengths (regenerate CSV output).`
            )
        }

        return res.status(200).json({
            selection: {
                archetype: result.archetype,
                affordanceLenses: result.affordanceLenses,
                constraints: result.constraints,
            },
            selectionTrace: result.selectionTrace,
            libraryLoad,
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        Logger.warn(`[Test Library Selection] POST /test-selection failed: ${message}`)
        return res.status(400).json({ error: message })
    }
})

/**
 * Developer / testing debug view (Christian's request). Exposes the internal generation
 * decisions for a single learning goal so findings can be diagnosed at the stage they
 * originate — resolution vs game-problem vs affordance vs archetype vs constraint vs
 * validation — instead of reverse-engineering from the final activity.
 *
 * Runs the FULL DETERMINISTIC pipeline only (resolution -> selection -> constraint-package
 * validation -> skeleton -> mechanics). It does NOT call OpenAI, so it is free, instant, and
 * safe to hammer during testing. The AI-output validators (prescriptive language, missing
 * mechanic, opponent consequence) run only on live generation and are noted as out of scope here.
 *
 * Usage (GET, browser-friendly while logged in):
 *   /api/app/debug-selection?goal=protecting+central+space&challengeLevel=medium&players=14
 */
router.get('/debug-selection', async (req: Request, res: Response) => {
    try {
        const goal = String(req.query.goal ?? '').trim()
        const challengeLevel = String(req.query.challengeLevel ?? 'medium')
        const players = Number.parseInt(String(req.query.players ?? ''), 10) || 14
        if (!goal) {
            return res.status(400).json({ error: 'Provide a learning goal: ?goal=...' })
        }

        // Stage 1 — Learning-goal resolution.
        const inputConstraints = deriveInputConstraints(goal)
        const signalGroups = inputConstraints.matchedSignals
            .filter((s) => s.startsWith('signalGroup:'))
            .map((s) => s.replace('signalGroup:', ''))
        const defensiveSignal = signalGroups.find((s) => s.startsWith('I_defensive'))
        const roleContext = defensiveSignal
            ? `defensive (${defensiveSignal.replace('I_defensive_', '') || 'unspecified'})`
            : signalGroups.length > 0
              ? 'attacking / neutral'
              : 'unresolved'

        const resolution = {
            resolvedGameProblem: signalGroups.length > 0 ? signalGroups : ['(none — would be REJECTED)'],
            roleContextDetected: roleContext,
            allMatchedSignals: inputConstraints.matchedSignals,
            candidateArchetypeIds: inputConstraints.candidateArchetypeIds,
            candidateAffordanceLensIds: inputConstraints.candidateAffordanceLensIds,
            candidateConstraintIds: inputConstraints.candidateConstraintIds,
        }

        if (inputConstraints.candidateArchetypeIds.length === 0) {
            return res.status(200).json({
                learningGoal: goal,
                resolution,
                selection: null,
                validation: {
                    deterministicPass: false,
                    failureStage: 'resolution',
                    failureReason: 'No supported soccer training signals were found in the learning goal.',
                },
                note: 'Deterministic pipeline only (no AI).',
            })
        }

        // Stage 2 — Selection (archetype / affordances / constraints).
        let selection
        try {
            selection = generateSelection({ learningGoals: [goal], challengeLevel }, inputConstraints)
        } catch (selErr) {
            return res.status(200).json({
                learningGoal: goal,
                resolution,
                selection: null,
                validation: {
                    deterministicPass: false,
                    failureStage: 'selection',
                    failureReason: selErr instanceof Error ? selErr.message : String(selErr),
                },
                note: 'Deterministic pipeline only (no AI).',
            })
        }

        const selectionSummary = {
            selectedArchetype: { id: selection.archetype.game_form_id, name: selection.archetype.game_form_name },
            selectedAffordances: selection.affordanceLenses.map((l) => l.title),
            selectedConstraints: selection.constraints.map((c) => c.title),
            // Developer instrumentation — full candidate "why it won" rankings (see selectionTrace.ranking).
            ranking: selection.selectionTrace.ranking,
            selectionTrace: selection.selectionTrace,
        }

        // Stage 3 — Deterministic validation (constraint package -> skeleton -> mechanics).
        let validation: { deterministicPass: boolean; failureStage: string | null; failureReason: string | null } = {
            deterministicPass: true,
            failureStage: null,
            failureReason: null,
        }
        try {
            const debugSession = {
                _id: 'debug',
                name: 'debug',
                sessionStatus: SessionStatus['In Progress'],
                playerCount: players,
                fieldType: 'grass',
                createdBy: 'debug',
                createdAt: new Date(),
                updatedAt: new Date(),
            } as unknown as Parameters<typeof systemAssemblyInputFromTestLibrarySelection>[0]['session']
            const assemblyInput = systemAssemblyInputFromTestLibrarySelection({
                selection,
                session: debugSession,
                previousActivities: [],
                coachInput: { challengeLevel, duration: 60, learningGoals: [goal] },
            })
            validateConstraintPackage(assemblyInput.affordances, assemblyInput.archetype, assemblyInput.constraintPackage)
            const skeleton = buildActivitySkeleton(assemblyInput)
            buildActivityMechanicsFromSkeleton(skeleton)
        } catch (valErr) {
            validation = {
                deterministicPass: false,
                failureStage: 'deterministic-validation (constraint-package / skeleton / mechanics)',
                failureReason: valErr instanceof Error ? valErr.message : String(valErr),
            }
        }

        return res.status(200).json({
            learningGoal: goal,
            resolution,
            selection: selectionSummary,
            validation,
            note: 'Deterministic pipeline only — no AI call. AI-output validation (prescriptive language, missing mechanic, opponent consequence) runs only during live generation and is not reflected here.',
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return res.status(500).json({ error: message })
    }
})

/**
 * Knowledge Core debug — canonical Environmental Manipulation reasoning (Package 1.1 experiment).
 *
 * Shows the three-layer suitability model working against the canonical schema, END TO END from a
 * coach goal: (1) the existing deterministic selection resolves the goal and selects lenses; (2) the
 * selected lens categories (+ perception when the information signal fires) become the target
 * affordances; (3) reasonEnvironmentalManipulations reaches canonical Knowledge Objects and returns
 * traceable candidates with their canonical Engineering Dimensions, Parameters, and Ecological
 * Guidance attached. No AI. Nothing here changes live generation — read-only reasoning view.
 *
 * Usage: GET /api/debug-em-reasoning?goal=...            (JSON)
 *        GET /api/debug-em-reasoning?goal=...&format=html (readable view)
 */
router.get('/debug-em-reasoning', async (req: Request, res: Response) => {
    try {
        const goal = String(req.query.goal ?? '').trim()
        const format = String(req.query.format ?? 'json').toLowerCase()
        if (!goal) {
            return res.status(400).json({ error: 'Provide a learning goal: ?goal=...' })
        }

        // Stage 1 — existing deterministic resolution + selection (unchanged engine path).
        const inputConstraints = deriveInputConstraints(goal)
        let targetAffordances: string[] = []
        let selectedLenses: string[] = []
        let selectionNote = ''
        if (inputConstraints.candidateArchetypeIds.length > 0) {
            try {
                const selection = generateSelection({ learningGoals: [goal], challengeLevel: 'medium' }, inputConstraints)
                selectedLenses = selection.affordanceLenses.map((l) => l.title)
                targetAffordances = selection.affordanceLenses.map((l) =>
                    l.category.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
                )
            } catch (e) {
                selectionNote = `Selection unavailable (${e instanceof Error ? e.message : String(e)}); reasoning ran on vocabulary only.`
            }
        } else {
            selectionNote = 'Goal did not resolve to a game problem; EM reasoning ran on vocabulary only.'
        }
        if (inputConstraints.matchedSignals.includes('signalGroup:K_information') && !targetAffordances.includes('perception')) {
            targetAffordances.push('perception')
        }

        // Stage 2 — canonical reachability + guidance + preference (the Package 1.1 experiment).
        const candidates = reasonEnvironmentalManipulations(goal, targetAffordances as never).map((c) => ({
            ...c,
            // Attach canonical parameters per dimension so the full design-lever chain is visible.
            dimensions: c.dimensions.map((d) => ({
                ...d,
                parameters: emCanonical.parametersForDimension(d.dimId).map((p) => `${p.Category}: ${p.Value_Type}`),
            })),
        }))

        const payload = {
            learningGoal: goal,
            knowledgeCore: {
                schema: String(emCanonical.schema.metadata['Schema_Name'] ?? ''),
                version: emCanonical.version,
            },
            derivedTargetAffordances: targetAffordances,
            selectedLenses,
            ...(selectionNote ? { selectionNote } : {}),
            canonicalCandidates: candidates,
            note: 'Read-only canonical reasoning view (Knowledge Core Package 1.1). Deterministic, no AI; does not affect live generation.',
        }

        if (format !== 'html') return res.status(200).json(payload)

        const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        const rows = candidates
            .map(
                (c, i) => `
    <div style="border:1px solid #ccc;border-radius:8px;padding:12px 16px;margin:12px 0;background:${i === 0 ? '#f2f9f2' : '#fafafa'}">
      <h3 style="margin:0 0 4px">${i + 1}. ${esc(c.koName)} <span style="color:#777;font-weight:normal">(${c.koId} — ${esc(c.familyName)}, score ${c.score})</span></h3>
      <p style="margin:4px 0"><b>Reached via:</b> ${c.matchedTerms.length ? c.matchedTerms.map(esc).join(', ') : '—'}${
          c.affinityHits.length ? ` &nbsp;|&nbsp; <b>affordance affinity:</b> ${c.affinityHits.map((h) => `${esc(h.affordance)} (+${h.weight})`).join(', ')}` : ''
      }</p>
      <p style="margin:4px 0"><b>Design levers (canonical):</b></p>
      <ul style="margin:2px 0 8px">${c.dimensions.map((d) => `<li><b>${esc(d.name)}</b> <span style="color:#777">(${d.dimId})</span> — ${d.parameters.map(esc).join('; ')}</li>`).join('')}</ul>
      <p style="margin:4px 0"><b>Ecological guidance:</b></p>
      <ul style="margin:2px 0">${c.guidance.map((g) => `<li>${esc(g)}</li>`).join('') || '<li>—</li>'}</ul>
    </div>`
            )
            .join('')
        const html = `<!doctype html><html><head><meta charset="utf-8"><title>EM Reasoning — ${esc(goal)}</title></head>
<body style="font-family:Arial,sans-serif;max-width:860px;margin:24px auto;padding:0 16px;color:#222">
  <h2 style="margin-bottom:2px">Canonical Environmental Manipulation Reasoning</h2>
  <p style="color:#666;margin-top:0">${esc(String(emCanonical.schema.metadata['Schema_Name'] ?? ''))} ${esc(emCanonical.version)} — read-only, deterministic, no AI.</p>
  <p><b>Coach goal:</b> ${esc(goal)}</p>
  <p><b>Selected lenses (engine):</b> ${selectedLenses.map(esc).join(', ') || '—'}<br>
     <b>Derived target affordances:</b> ${targetAffordances.map(esc).join(', ') || '—'}</p>
  ${selectionNote ? `<p style="color:#a60">${esc(selectionNote)}</p>` : ''}
  <h3 style="margin-bottom:0">Canonical Knowledge Objects reached (${candidates.length})</h3>
  ${rows || '<p>No canonical Knowledge Objects reached for this goal.</p>'}
</body></html>`
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        return res.status(200).send(html)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return res.status(500).json({ error: message })
    }
})

/**
 * MVP field evidence — in-app coach feedback on a generated activity (thumbs + optional comment).
 * Fire-and-forget storage in usage_events; never blocks the coach's flow.
 */
router.post('/activity-feedback', async (req: Request, res: Response) => {
    const { activityId, sessionId, rating, comment } = req.body as Record<string, unknown>
    if (rating !== 'up' && rating !== 'down') {
        return res.status(400).json({ error: 'rating must be "up" or "down"' })
    }
    recordUsageEvent({
        eventType: 'coach_feedback',
        activityId: typeof activityId === 'string' ? activityId : undefined,
        sessionId: typeof sessionId === 'string' ? sessionId : undefined,
        payload: {
            rating,
            comment: typeof comment === 'string' ? comment.slice(0, 2000) : undefined,
        },
    })
    return res.status(200).json({ ok: true })
})

/**
 * MVP field evidence — aggregated usage view for Joe/Christian: what coaches ask for, how goals
 * resolve, what gets selected, what was rejected verbatim (the vocabulary-gap list), success rate,
 * and feedback tallies. GET /api/app/debug-usage?days=30
 */
/**
 * The observation vocabulary, served rather than duplicated in the client.
 *
 * §50 Semantic Stability separates stored values (immutable) from display labels (freely
 * changeable). If the front end carried its own copy of both, a label reworded on one side would
 * drift from the other, and a code added on one side would silently never be offered — which is the
 * precise failure this specification exists to prevent. Serving it keeps one source of truth and
 * lets coach-facing wording change without a client release.
 */
router.get('/observation-vocabulary', (_req: Request, res: Response) => {
    return res.status(200).json({
        interfaceVersion: RUNTIME_INTERFACE_VERSION,
        groups: OBSERVATION_GROUPS.map((g) => ({
            heading: g.heading,
            options: g.codes.map((code) => ({ code, label: OBSERVATION_LABELS[code] })),
        })),
        sessionStages: SESSION_STAGES.map((stage) => ({ stage, label: SESSION_STAGE_LABELS[stage] })),
    })
})

/**
 * Post-use observation capture — Runtime Interface RC1.2 §42 (Pilot 1 flow).
 *
 * The coach records one or more canonical observations after using an activity. Stored as ordered
 * Observation Events (§25) against the session. NO interpretation happens here: Experience
 * Intelligence is not invoked, no recommendation is produced, and INTENDED_PROBLEM_NOT_EMERGING is
 * stored rather than routed — Pilot 1 explicitly requires no live recommendation, and routing it to
 * Representative Validation is Pilot 2 work (§28 / §55).
 *
 * §52 Failure Behavior: invalid codes are rejected with the failed field named. We never coerce a
 * near-miss into a canonical value — §12 forbids local synonyms becoming stored values, and a
 * silently-corrected observation would corrupt the very evidence this exists to collect.
 */
router.post('/observations', async (req: Request, res: Response) => {
    try {
        const { observationCodes, sessionStage, activityId, sessionId, coachNote } = req.body as Record<string, unknown>

        if (!Array.isArray(observationCodes) || observationCodes.length === 0) {
            return res.status(400).json({ error: 'observationCodes must be a non-empty array.', field: 'observationCodes' })
        }

        const parsedCodes: ObservationCode[] = []
        for (const raw of observationCodes) {
            const code = parseObservationCode(raw)
            if (!code) {
                return res.status(400).json({
                    error: `Unrecognised observation code: ${String(raw)}`,
                    field: 'observationCodes',
                })
            }
            if (!parsedCodes.includes(code)) parsedCodes.push(code)
        }

        const stage = parseSessionStage(sessionStage)
        if (!stage) {
            return res.status(400).json({ error: `Unrecognised session stage: ${String(sessionStage)}`, field: 'sessionStage' })
        }

        const sessionKey = typeof sessionId === 'string' ? sessionId : undefined
        // Ordered session state (§9). Count-based sequencing is sufficient for Pilot 1's
        // single-coach form submission; observedAt remains the authoritative tiebreak.
        const existing = sessionKey ? await ObservationEvent.countDocuments({ sessionId: sessionKey }) : 0
        const observedAt = new Date()
        const note = typeof coachNote === 'string' ? coachNote.trim().slice(0, COACH_NOTE_MAX_LENGTH) : undefined

        const events = parsedCodes.map((observationCode, i) => ({
            observationCode,
            sessionStage: stage,
            captureMethod: 'POST_USE',
            sequenceNumber: existing + i,
            observedAt,
            activityId: typeof activityId === 'string' ? activityId : undefined,
            sessionId: sessionKey,
            coachNote: note || undefined,
            interfaceVersion: RUNTIME_INTERFACE_VERSION,
        }))

        await ObservationEvent.insertMany(events)
        return res.status(201).json({ recorded: events.length })
    } catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : String(error) })
    }
})

router.get('/debug-usage', async (req: Request, res: Response) => {
    try {
        const days = Math.min(365, Math.max(1, Number.parseInt(String(req.query.days ?? '30'), 10) || 30))
        const summary = await summarizeUsage(days)
        return res.status(200).json(summary)
    } catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : String(error) })
    }
})

router.post(`${ROUTES.generateActivities}/:id`, async (req: Request, res: Response) => {
    // Developer/testing flag (Christian's debug system). When true, the response carries a
    // debugTrace alongside the real generated activities — the SAME resolution/selection chain
    // the /debug page shows, PLUS the AI-stage validation result for this actual run (which the
    // no-AI /debug page cannot show). Non-debug requests are completely unchanged (array response).
    const debug = req.body?.debug === true
    let debugTrace: Record<string, unknown> | null = null
    try {
        const { challengeLevel, duration, learningGoals } = req.body as ActivityAssemblyRequest
        // Structured planning selections from the guided Session Creation conversation. Present only
        // when the coach used it, absent from the free-text form — so every read must tolerate null.
        const planning = (req.body as { planning?: PlanningSelectionInput }).planning

        if (!challengeLevel || !duration) {
            return res.status(400).json({ error: 'Challenge level and duration are required' })
        }

        if (!Array.isArray(learningGoals) || learningGoals.length === 0) {
            return res.status(400).json({ error: 'At least one learning goal is required' })
        }

        const session = await Session.findById(req.params.id)
        if (!session) {
            return res.status(404).json({ error: 'Session not found' })
        }

        const previousActivities = await Activity.find({ session: req.params.id })

        const generationStart = Date.now()
        const goalText = learningGoals.join(' ')
        const inputConstraints = deriveInputConstraints(goalText)

        // A KNOWN gap is answered differently from an unrecognised phrase, even when the parser DID
        // match something. A Learning Goal like "Play Out from the Back" reaches only the general
        // fallback, so it would otherwise proceed and produce a generic activity that does not
        // address what was asked — worse than a refusal, because the coach cannot tell it went wrong.
        const reachedOnlyFallback = inputConstraints.matchedSignals.every(
            (signal) => !signal.startsWith('signalGroup:') || signal === 'signalGroup:Z_soccer_general'
        )
        const knownGap = reachedOnlyFallback && isKnownUnsupportedGoal(goalText)

        if (inputConstraints.matchedSignals.length === 0 || knownGap) {
            // MVP field evidence: rejected goals ARE the vocabulary-gap dataset. A known gap is
            // recorded distinctly — it needs content or routing, not more coach vocabulary, so
            // lumping the two together would corrupt exactly the dataset this exists to build.
            recordUsageEvent({
                eventType: 'goal_rejected',
                sessionId: req.params.id,
                goalText: learningGoals.join(' | '),
                payload: { knownGap },
            })

            // Graceful unsupported-goal response. The coach gets one message in one register plus
            // concrete goals they can use as-is. The internal stage name and validator string stay
            // debug-only — concatenated onto the friendly text they read as three voices in one error.
            const guidance = knownGap ? describeUnsupportedGoal(goalText) : buildUnsupportedGoalGuidance()
            return res.status(400).json({
                error: 'error' in guidance ? guidance.error : guidance.message,
                suggestions: guidance.suggestions,
                resolutionStatus: 'unresolved',
                ...(debug
                    ? {
                          stage: 'input-selection',
                          details: [
                              knownGap
                                  ? 'Goal recognised as a known unsupported planning intention.'
                                  : 'No supported soccer training signals were found in the learning goals.',
                          ],
                      }
                    : {}),
            })
        }

        const usageSignalGroups = inputConstraints.matchedSignals
            .filter((s) => s.startsWith('signalGroup:'))
            .map((s) => s.replace('signalGroup:', ''))
        recordUsageEvent({
            eventType: 'goal_submitted',
            sessionId: req.params.id,
            goalText: learningGoals.join(' | '),
            payload: {
                resolutionStatus: usageSignalGroups.some((s) => s !== 'Z_soccer_general') ? 'matched' : 'fallback',
                signalGroups: usageSignalGroups,
                challengeLevel,
                duration,
                // EVIDENCE ONLY — none of these influence generation today.
                //
                // learningStage is the important one. It is asked in the conversation because
                // Christian's MVP scope includes it, but nothing consumes it: his spec says it
                // calibrates challenge rather than football content, and how it combines with
                // Challenge is a coaching judgement that belongs to him. Recording what coaches
                // actually pick means that decision can be made against a real distribution rather
                // than in the abstract — and it means the question is not entirely wasted while it
                // waits. Recorded as a KNOWN no-op, not quietly dropped.
                ...(planning
                    ? {
                          learningGoalId: planning.learningGoalId,
                          practiceSituationId: planning.practiceSituationId ?? null,
                          learningStage: planning.learningStage,
                          learningStageInfluencesGeneration: false,
                          planningEntryPoint: 'guided',
                      }
                    : { planningEntryPoint: 'free_text' }),
            },
        })

        let selection
        try {
            Logger.info(`[Activity Generation] coach learning goals (original): ${JSON.stringify(learningGoals)}`)
            selection = generateSelection(
                {
                    learningGoals,
                    challengeLevel,
                },
                inputConstraints
            )
        } catch (selErr) {
            const message = selErr instanceof Error ? selErr.message : String(selErr)
            Logger.warn(`[Activity Generation] Test Library selection failed: ${message}`)
            recordUsageEvent({
                eventType: 'generation_failed',
                sessionId: req.params.id,
                payload: { stage: 'selection', reason: message.slice(0, 300) },
            })
            return res.status(400).json({ error: message })
        }

        {
            const atp = selection.selectionTrace.affordanceTargetProfile as
                | { primaryGameProblem?: string | null; matrixVersion?: string }
                | undefined
            recordUsageEvent({
                eventType: 'selection_resolved',
                sessionId: req.params.id,
                payload: {
                    archetype: selection.archetype.game_form_name,
                    affordanceLenses: selection.affordanceLenses.map((l) => l.title),
                    constraints: selection.constraints.map((c) => c.title),
                    shadowAtpPrimary: atp?.primaryGameProblem ?? null,
                    versions: selection.selectionTrace.versions ?? null,
                },
            })
        }

        if (debug) {
            const sg = inputConstraints.matchedSignals
                .filter((s) => s.startsWith('signalGroup:'))
                .map((s) => s.replace('signalGroup:', ''))
            const dsig = sg.find((s) => s.startsWith('I_defensive'))
            debugTrace = {
                resolution: {
                    resolvedGameProblem: sg,
                    roleContextDetected: dsig
                        ? `defensive (${dsig.replace('I_defensive_', '') || 'unspecified'})`
                        : sg.length > 0
                          ? 'attacking / neutral'
                          : 'unresolved',
                    candidateArchetypeIds: inputConstraints.candidateArchetypeIds,
                    candidateAffordanceLensIds: inputConstraints.candidateAffordanceLensIds,
                    candidateConstraintIds: inputConstraints.candidateConstraintIds,
                },
                selection: {
                    selectedArchetype: {
                        id: selection.archetype.game_form_id,
                        name: selection.archetype.game_form_name,
                    },
                    selectedAffordances: selection.affordanceLenses.map((l) => l.title),
                    selectedConstraints: selection.constraints.map((c) => c.title),
                },
            }
        }

        const assemblyInput: SystemAssemblyInput = systemAssemblyInputFromTestLibrarySelection({
            selection,
            session,
            previousActivities,
            coachInput: {
                challengeLevel,
                duration,
                learningGoals,
                // IC-001. Realization input only — it reaches assembly, never selection, which is
                // what makes "changing Learning Stage MUST NOT change the selected Learning Goal"
                // structurally true rather than merely tested.
                learningStage: planning?.learningStage,
                // IC-002. Resolved from the id against the workbook rather than trusting names sent
                // by the client — the authored definition is the knowledge, and it should come from
                // the canonical source on every request.
                practiceSituation: resolvePracticeSituation(planning?.practiceSituationId),
                learningGoalId: planning?.learningGoalId,
            },
        })

        validateConstraintPackage(assemblyInput.affordances, assemblyInput.archetype, assemblyInput.constraintPackage)

        const assembledActivities = await withTimeout(
            assembleActivities(assemblyInput),
            ACTIVITY_ASSEMBLY_TIMEOUT_MS,
            'Activity generation timed out. Please try again with a more specific soccer training goal.'
        )
        let validatedActivities

        try {
            validatedActivities = validateGeneratedActivities(assembledActivities, assemblyInput)
        } catch (error) {
            if (error instanceof SystemPipelineError && error.stage === 'output-validation') {
                await LoggingService.log(
                    {
                        level: 'warn',
                        service: 'Activity Generation',
                        message: 'Generated activities failed output validation.',
                        data: {
                            sessionId: req.params.id,
                            coachInput: assemblyInput.coachInput,
                            archetype: {
                                id: assemblyInput.archetype.id,
                                name: assemblyInput.archetype.name,
                                consequenceCues: assemblyInput.archetype.consequenceCues,
                            },
                            archetypeSelection: {
                                selectionKey: assemblyInput.archetypeSelection.selectionKey,
                                selectedReason: assemblyInput.archetypeSelection.selectedReason,
                                candidates: assemblyInput.archetypeSelection.candidates.map((candidate) => ({
                                    id: candidate.archetype.id,
                                    name: candidate.archetype.name,
                                    score: candidate.score,
                                    band: candidate.band,
                                    reasons: candidate.reasons,
                                })),
                            },
                            selectedConstraints: {
                                foundation: {
                                    id: assemblyInput.constraintPackage.foundation.constraint._id,
                                    title: assemblyInput.constraintPackage.foundation.constraint.title,
                                },
                                shaping: {
                                    id: assemblyInput.constraintPackage.shaping.constraint._id,
                                    title: assemblyInput.constraintPackage.shaping.constraint.title,
                                },
                                consequence: assemblyInput.constraintPackage.consequence
                                    ? {
                                          id: assemblyInput.constraintPackage.consequence.constraint._id,
                                          title: assemblyInput.constraintPackage.consequence.constraint.title,
                                          description: assemblyInput.constraintPackage.consequence.constraint.description,
                                          designIntent: assemblyInput.constraintPackage.consequence.constraint.designIntent,
                                          notes: assemblyInput.constraintPackage.consequence.constraint.notes,
                                          suggestedConstraintPrompt:
                                              assemblyInput.constraintPackage.consequence.constraint.suggestedConstraintPrompt,
                                          gameTemplateAnchor: assemblyInput.constraintPackage.consequence.constraint.gameTemplateAnchor,
                                      }
                                    : null,
                            },
                            assemblyGuardrails: assemblyInput.constraintPackage.assemblyGuardrails,
                            assembledActivities,
                            error: {
                                stage: error.stage,
                                message: error.message,
                                details: error.details,
                            },
                        },
                    },
                    {
                        writeLogFile: true,
                    }
                )
            }

            throw error
        }

        if (
            assembledActivities?.generatedActivities &&
            Array.isArray(assembledActivities.generatedActivities) &&
            validatedActivities.length < assembledActivities.generatedActivities.length
        ) {
            await LoggingService.log(
                {
                    level: 'warn',
                    service: 'Activity Generation',
                    message: 'Filtered invalid generated activities after output validation.',
                    data: {
                        sessionId: req.params.id,
                        totalGeneratedActivities: assembledActivities.generatedActivities.length,
                        returnedActivities: validatedActivities.length,
                        droppedActivities: assembledActivities.generatedActivities.length - validatedActivities.length,
                        coachInput: assemblyInput.coachInput,
                        archetype: {
                            id: assemblyInput.archetype.id,
                            name: assemblyInput.archetype.name,
                        },
                        archetypeSelection: {
                            selectionKey: assemblyInput.archetypeSelection.selectionKey,
                            selectedReason: assemblyInput.archetypeSelection.selectedReason,
                            candidates: assemblyInput.archetypeSelection.candidates.map((candidate) => ({
                                id: candidate.archetype.id,
                                name: candidate.archetype.name,
                                score: candidate.score,
                                band: candidate.band,
                            })),
                        },
                        selectedConstraints: {
                            foundation: {
                                id: assemblyInput.constraintPackage.foundation.constraint._id,
                                title: assemblyInput.constraintPackage.foundation.constraint.title,
                            },
                            shaping: {
                                id: assemblyInput.constraintPackage.shaping.constraint._id,
                                title: assemblyInput.constraintPackage.shaping.constraint.title,
                            },
                            consequence: assemblyInput.constraintPackage.consequence
                                ? {
                                      id: assemblyInput.constraintPackage.consequence.constraint._id,
                                      title: assemblyInput.constraintPackage.consequence.constraint.title,
                                      description: assemblyInput.constraintPackage.consequence.constraint.description,
                                      designIntent: assemblyInput.constraintPackage.consequence.constraint.designIntent,
                                      notes: assemblyInput.constraintPackage.consequence.constraint.notes,
                                      suggestedConstraintPrompt:
                                          assemblyInput.constraintPackage.consequence.constraint.suggestedConstraintPrompt,
                                      gameTemplateAnchor: assemblyInput.constraintPackage.consequence.constraint.gameTemplateAnchor,
                                  }
                                : null,
                        },
                        assemblyGuardrails: assemblyInput.constraintPackage.assemblyGuardrails,
                        assembledActivities,
                    },
                },
                {
                    writeLogFile: true,
                }
            )
        }

        // Phase 4A: compress coach-facing output. The skeleton mechanics have already been
        // validated; this pass deduplicates across fields, strips Players-read narration
        // from scoring and rules (kept implicit there, surfaced once in coachingFocus),
        // removes the guardrail closing line where it would otherwise echo winCondition,
        // and caps section lengths. Phase 3.5 slot-modifier text is must-keep through the
        // cap so the per-slot environmental differentiation survives compression.
        const perSlotModifierLines = ([1, 2, 3] as const).map((idx) =>
            getSlotMechanicalVariations(assemblyInput.session.sessionEmphasis, idx).map((m) => m.mechanicLine)
        )
        const compressedActivities = compressActivitiesForCoach(validatedActivities, perSlotModifierLines)

        // Coach-language audit (Coach Vocabulary & Translation Dictionary sec.9). Anything still
        // carrying an internal ontology term AFTER translation is a genuine gap in dictionary
        // coverage. We record it rather than throwing: Representative Validation classifies
        // coach-language problems as correctable, not constitutive, and its correction hierarchy
        // puts output-language at the lowest layer — a coach should never lose an activity because
        // a word leaked. The leak becomes evidence for the next vocabulary revision instead.
        compressedActivities.forEach((activity, slotIndex) => {
            const violations = auditCoachLanguage(activity as unknown as Record<string, unknown>)
            if (violations.length === 0) return
            recordUsageEvent({
                eventType: 'coach_language_leak',
                sessionId: req.params.id,
                payload: {
                    slotIndex,
                    // Terms and field names only — never the surrounding coach-facing prose.
                    terms: [...new Set(violations.flatMap((v) => v.terms))],
                    fields: violations.map((v) => v.field),
                },
            })
        })

        recordUsageEvent({
            eventType: 'generation_succeeded',
            sessionId: req.params.id,
            payload: {
                activityCount: compressedActivities.length,
                durationMs: Date.now() - generationStart,
            },
        })

        // Transparent Failure: when the engine read the goal broadly rather than precisely, say so
        // once. `buildResolutionNotice` returns null for a confident match, so a good generation
        // stays silent — Quiet Assistance means a notice must be able to change the coach's next
        // decision, and "I understood you exactly" cannot.
        const resolutionNotice = buildResolutionNotice(selection.resolution.status)

        if (debug && debugTrace) {
            debugTrace.validation = { aiStagePass: true, failureStage: null, failureReason: null }
            return res.status(200).json({
                activities: compressedActivities,
                debugTrace,
                resolutionStatus: selection.resolution.status,
                ...(resolutionNotice ? { notice: resolutionNotice } : {}),
            })
        }
        // Wrapped object rather than a bare array so the notice has somewhere to live. The client
        // accepts both shapes, so an older client keeps working against this endpoint.
        return res.status(200).json({
            activities: compressedActivities,
            resolutionStatus: selection.resolution.status,
            ...(resolutionNotice ? { notice: resolutionNotice } : {}),
        })
    } catch (error) {
        recordUsageEvent({
            eventType: 'generation_failed',
            sessionId: req.params.id,
            payload: {
                stage: error instanceof SystemPipelineError ? error.stage : 'ai-assembly',
                reason: (error instanceof Error ? error.message : String(error)).slice(0, 300),
            },
        })
        console.error('=== CREATE ACTIVITY ERROR ===')
        console.error(error)

        if (error instanceof Error) {
            console.error('MESSAGE:', error.message)
            console.error('STACK:', error.stack)
        }

        // Attach the AI-stage validation failure to the debug trace (debug requests only). This is
        // the piece the no-AI /debug page can't show: WHY a real generation failed after the AI ran.
        if (debug && debugTrace) {
            debugTrace.validation = {
                aiStagePass: false,
                failureStage: error instanceof SystemPipelineError ? error.stage : 'ai-assembly',
                failureReason: error instanceof Error ? error.message : String(error),
            }
        }
        const debugEnvelope = debug && debugTrace ? { debugTrace } : {}

        if (error instanceof ActivityAssemblyValidationError) {
            return res.status(422).json({
                success: false,
                error: 'Activity could not be generated cleanly. Please try again.',
                details: error.validationFailureReasons ?? [error.message],
                assemblyAttempts: error.assemblyAttempts,
                retriedAfterValidationFailure: error.retriedAfterValidationFailure,
                ...debugEnvelope,
            })
        }

        if (error instanceof SystemPipelineError) {
            return res.status(422).json({
                error: `${error.stage}: ${error.message}`,
                stage: error.stage,
                details: error.details,
                ...debugEnvelope,
            })
        }

        if (error instanceof Error && error.message.includes('timed out')) {
            return res.status(504).json({
                error: error.message,
                stage: 'ai-assembly',
                details: ['The activity generation request took too long to complete.'],
            })
        }

        // OpenAI quota/billing exhaustion (HTTP 429). Distinct from a code failure: the request
        // parsed and assembled fine, but the AI provider rejected the call for usage limits.
        // Return a clear coach-facing message + an operator-facing detail so a field tester can
        // tell "the app is broken" apart from "the OpenAI plan needs more credits".
        if (error instanceof Error && /quota exceeded/i.test(error.message)) {
            return res.status(503).json({
                error: 'The activity service is temporarily unavailable. Please try again shortly.',
                stage: 'ai-assembly',
                details: ['OpenAI usage quota exceeded — check the OpenAI plan/billing for this deployment.'],
            })
        }

        return res.status(500).json({
            error: 'Activity generation failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            ...debugEnvelope,
        })
    }
})
/**
 * Session Planning Model registry — the conversation the front end renders.
 *
 * Serves the workbook's own registry data, shaped for display and nothing more. Deliberately thin:
 * per Christian's Governance Standard the planning model owns coach decisions and the engine owns
 * sport knowledge, so this endpoint must not resolve, rank, or map anything. If a decision is being
 * made here, it is in the wrong place.
 *
 * Practice Situations are nested under their goal rather than served as a flat list, because the
 * conditional step is driven by whether a goal HAS any — nesting makes "none, so continue
 * automatically" (Implementation Guide Rule 3) a property of the data instead of a lookup the
 * client has to remember to perform.
 *
 * Internal identifiers are included because the client sends them back on generate; the Guide's
 * "never expose internal identifiers" is about what a COACH sees, which is a rendering concern.
 */
router.get(ROUTES.sessionPlanning, async (_req: Request, res: Response) => {
    try {
        const integrity = validateSessionPlanningModel()
        if (!integrity.valid) {
            // Fail loudly with the reference that is broken, per the Implementation Guide's error
            // handling: knowledge errors get corrected in the workbook, never patched in code.
            return res.status(500).send({
                error: 'Session Planning Model failed its integrity gate.',
                reasons: integrity.errors,
            })
        }

        const phases = sessionPlanningModel.phases().map((phase) => ({
            phase,
            learningGoals: sessionPlanningModel.learningGoalsForPhase(phase).map((goal) => {
                const id = String(goal['ID'])
                return {
                    id,
                    name: String(goal['Learning Goal'] ?? ''),
                    coachDefinition: String(goal['Coach Definition'] ?? ''),
                    chooseThisWhen: String(goal['Choose This When...'] ?? ''),
                    practiceSituations: sessionPlanningModel.practiceSituationsFor(id).map((situation) => ({
                        id: String(situation['ID']),
                        name: String(situation['Practice Situation'] ?? ''),
                        definition: String(situation['Definition'] ?? ''),
                    })),
                }
            }),
        }))

        return res.status(200).send({
            phases,
            // Entry language powers search. It is a navigation HINT and must never override an
            // explicit coach selection — the client treats it as a filter, not a router.
            entryLanguage: sessionPlanningModel.entryLanguage().map((entry) => ({
                phrase: String(entry['Coach Phrase'] ?? ''),
                learningGoalId: String(entry['Learning Goal ID'] ?? ''),
            })),
            // Guided clarification for broad coach terms ("defending", "passing"). Precomputed
            // because the term list is fixed and the registry is static, so the client can recognise
            // a broad term without a round trip while the knowledge still comes from the workbook.
            clarifications: allClarifications(),
            // Surfaced so the unpopulated coach-to-knowledge bridge stays visible while it is filled
            // in, rather than being discovered when a coach reaches the end of the conversation.
            translation: translationStatus(),
        })
    } catch (error) {
        return res.status(500).send({ error })
    }
})

router.get(`${ROUTES.activity}/my-activities`, async (req: Request, res: Response) => {
    try {
        const userSessions = await Session.find({ createdBy: res.locals.sessionUser })

        const activities = await Activity.find({
            session: { $in: userSessions.map((session) => session._id) },
        }).populate('session')

        return res.status(200).send(activities)
    } catch (error) {
        return res.status(500).send({ error })
    }
})

router.get(`${ROUTES.activity}/session/:id`, async (req: Request, res: Response) => {
    try {
        const activities = await Activity.find({ session: req.params.id })

        return res.status(200).send(activities)
    } catch (error) {
        return res.status(500).send({ error })
    }
})

// User routes
BaseRoutes(router, {
    model: User,
    route: ROUTES.user,
    excludedRoutes: ['delete'],
    userSpecific: true,
    ownerField: '_id',
})

router.get(`${ROUTES.session}/my-sessions`, async (req: Request, res: Response) => {
    try {
        const sessions = await Session.find({ createdBy: res.locals.sessionUser })
        return res.status(200).send(sessions)
    } catch (error) {
        return res.status(500).send({ error })
    }
})
// Session routes
router.get(`${ROUTES.session}/:id/duplicate`, async (req: Request, res: Response) => {
    try {
        const session = await Session.findById(req.params.id).lean();
        
        if (!session) {
            return res.status(404).send({ error: "Session not found" });
        }
        
        const sessionData = { ...session };
        delete sessionData._id;        
        delete sessionData.createdAt;  
        delete sessionData.updatedAt;
        
        // Create new session with current timestamps
        const newSession = await new Session({
            ...sessionData, 
            sessionStatus: SessionStatus['In Progress']
        }).save();
        
        // Find all activities for the original session
        const activities = await Activity.find({ session: req.params.id }).lean();
        
        // Create new activities with current timestamps
        await Promise.all(
            activities.map(activity => {
                const activityData = { ...activity };
                delete activityData._id;
                delete activityData.createdAt;
                delete activityData.updatedAt;
                
                return new Activity({
                    ...activityData, 
                    session: newSession._id, 
                    activityStatus: ActivityStatus['Ready to Start']
                }).save();
            })
        );

        return res.status(200).send(newSession);
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
});

router.post(ROUTES.session, (req: Request, res: Response, next) => {
    const sessionEmphasis = req.body?.sessionEmphasis
    if (sessionEmphasis !== undefined && !isSessionEmphasis(sessionEmphasis)) {
        return res.status(400).json({
            error: 'Invalid sessionEmphasis',
            validValues: Object.values(SessionEmphasis),
        })
    }

    return next()
})

BaseRoutes(router, {
    model: Session,
    route: ROUTES.session,
    excludedRoutes: ['delete'],
})

// Activity routes
router.post(ROUTES.activity, async (req: Request, res: Response) => {
    try {
        const body = req.body as Record<string, unknown>

        if (!body._id || body._id === 'new') {
            const missing = missingActivityCreateFields(body)
            if (missing.length > 0) {
                return res.status(400).json({
                    error: 'Missing required activity fields',
                    missing,
                })
            }

            if (!Types.ObjectId.isValid(String(body.session))) {
                return res.status(400).json({
                    error: 'Missing required activity fields',
                    missing: ['session'],
                })
            }

            const created = await new Activity({
                activityStatus: body.activityStatus,
                session: body.session,
                title: body.title,
                constraint: body.constraint,
                intent: body.intent,
                setup: typeof body.setup === 'string' ? body.setup : undefined,
                extensions: arrayOfStrings(body.extensions),
                scaffolding: arrayOfStrings(body.scaffolding),
                playerGroupSizes: Number(body.playerGroupSizes) || undefined,
                equipmentNeeded: arrayOfStrings(body.equipmentNeeded),
                affordancesUsed: validObjectIdRefs(body.affordancesUsed),
                constraintsUsed: validObjectIdRefs(body.constraintsUsed),
                challengeLevel: body.challengeLevel,
                duration: Number(body.duration) || undefined,
                learningPriorities: Array.isArray(body.learningPriorities) ? body.learningPriorities : [],
                difficultyLevel: body.difficultyLevel,
                engagementLevel: body.engagementLevel,
                breakthroughMoments: body.breakthroughMoments,
                coachComments: body.coachComments,
                rules: arrayOfStrings(body.rules),
                scoringSystem: body.scoringSystem,
                winCondition: body.winCondition,
                pointsTracking: Array.isArray(body.pointsTracking) ? body.pointsTracking : [],
                systemTrace: body.systemTrace,
            }).save()

            return res.status(201).json({ message: 'successfully created', data: created })
        }

        // Coach edit evidence. Editing is unrestricted — Coach Intelligence §38 records the coach's
        // decision and does not judge it — but we classify what changed. Structural edits are the
        // ones Integration Spec §36 would submit for revalidation; we cannot do that yet, so
        // recording them keeps the seam visible and gives Representative Validation real calibration
        // data for when the six-domain engine lands.
        const existing = await Activity.findById(body._id).lean()
        if (existing) {
            const evidence = diffActivityEdit(existing as unknown as Record<string, unknown>, body)
            if (evidence.changedFields.length > 0) {
                recordUsageEvent({
                    eventType: 'activity_edited',
                    activityId: String(body._id),
                    sessionId: typeof body.session === 'string' ? body.session : undefined,
                    payload: {
                        // Field names only — never the coach's edited prose.
                        changedFields: evidence.changedFields,
                        revalidationTriggerFields: evidence.revalidationTriggerFields,
                        touchesRepresentativeStructure: evidence.touchesRepresentativeStructure,
                    },
                })
            }
        }

        await Activity.findByIdAndUpdate(body._id, body)
        return res.status(200).json({ message: 'successfully updated' })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return res.status(500).json({ error: message })
    }
})

BaseRoutes(router, {
    model: Activity,
    route: ROUTES.activity,
    excludedRoutes: ['delete', 'post'],
    populate: ['session'],
})

// AffordanceConstraint routes
BaseRoutes(router, {
    model: Affordance,
    route: ROUTES.affordance,
    excludedRoutes: ['get-one'],
})

BaseRoutes(router, {
    model: Constraint,
    route: ROUTES.constraint,
    excludedRoutes: ['get-one'],
})

export default router
