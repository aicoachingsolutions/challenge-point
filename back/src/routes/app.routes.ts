import { Request, Response, Router } from 'express'
import { Types } from 'mongoose'
import Affordance from 'src/models/affordance.model'
import Constraint from 'src/models/constraint.model'
import Session, { SessionEmphasis, SessionStatus } from 'src/models/session.model'
import { ActivityAssemblyValidationError, assembleActivities } from 'src/services/completion.service'

import Activity, { ActivityStatus } from '../models/activity.model'
import { buildActivityMechanicsFromSkeleton } from '../system/activity/build-activity-mechanics'
import { buildActivitySkeleton } from '../system/activity/build-activity-skeleton'
import { compressActivitiesForCoach } from '../system/activity/compress-activity-output'
import { getSlotMechanicalVariations } from '../system/activity/slot-mechanics-variations'
import User from '../models/user.model'
import Logger from '../logger'
import LoggingService from '../services/logging.service'
import { deriveInputConstraints } from '../system/input-constraints/deriveInputConstraints'
import { emCanonical } from '../system/knowledge-core/em-canonical'
import { reasonEnvironmentalManipulations } from '../system/knowledge-core/em-selection-metadata'
import { recordUsageEvent, summarizeUsage } from '../services/usage-telemetry.service'
import { generateSelection, getTestLibraryV0LoadDebug, systemAssemblyInputFromTestLibrarySelection } from '../system/test-library'
import { ENDPOINTS } from './_endpoints'
import BaseRoutes from './helper'
import { ActivityAssemblyRequest, SystemAssemblyInput, SystemPipelineError } from '../system/types'
import { validateConstraintPackage } from '../system/validate-constraint-package'
import { validateGeneratedActivities } from '../system/validate-generated-activity'

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
        const inputConstraints = deriveInputConstraints(learningGoals.join(' '))
        if (inputConstraints.matchedSignals.length === 0) {
            // MVP field evidence: rejected goals ARE the vocabulary-gap dataset.
            recordUsageEvent({
                eventType: 'goal_rejected',
                sessionId: req.params.id,
                goalText: learningGoals.join(' | '),
            })
            return res.status(400).json({
                error:
                    'I need a soccer training goal to build an activity. Try something like: create better shots, keep possession, break lines, defend in transition, or improve first touch.',
                stage: 'input-selection',
                details: ['No supported soccer training signals were found in the learning goals.'],
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

        recordUsageEvent({
            eventType: 'generation_succeeded',
            sessionId: req.params.id,
            payload: {
                activityCount: compressedActivities.length,
                durationMs: Date.now() - generationStart,
            },
        })

        if (debug && debugTrace) {
            debugTrace.validation = { aiStagePass: true, failureStage: null, failureReason: null }
            return res.status(200).json({ activities: compressedActivities, debugTrace })
        }
        return res.status(200).json(compressedActivities)
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
