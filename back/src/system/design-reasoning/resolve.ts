/**
 * **Step 1: knowledge-grounded resolution, with the primary-led composite profile** — review pathway only. Stage 1 (Christian's reply to
 * the development proposal, received 3 November 2026, item 8: *"Use approved Game Problem relationships, performance context and the CAR
 * merge process to establish the Affordance Requirement Profile."*), amended for Stage 2 by his reply to the Stage 2 decision package,
 * received 4 November 2026, D1: *"I support your proposed primary-led interpretation for the review pathway."*
 *
 * The input is a Learning Goal's canonical id. Everything after it is read from relationship rows by id:
 *   1. the Game Problems: the Session Planning Model's approved Engine Translation; where that row is unpopulated, a scoped ruling of his in
 *      `stage1-rulings.json` (today only E1, which his D1 continues); otherwise UNRESOLVED, with the row's state named. A ruling never
 *      overrides a populated translation: that is reported as a conflict and nothing is resolved. So the unpopulated row is among what
 *      decided a ruling's Game Problems, and the trace records it there; the role itself is set by the ruling (`roleSetBy`), which the
 *      unpopulated row permits (`permittedBy`).
 *   2. the context: the goal's RPC routing row, checked against the context library's own LEARNING_GOAL relationship row for the goal, and
 *      the context's relationship rows to each resolved Game Problem. Where the routed context has no row for the resolved primary Game
 *      Problem, the status is RESOLVED_NOT_RELATED_TO_CONTEXT, not RESOLVED (the defect we reported in the decision package, item 6).
 *   3. the composite profile, as D1 directs:
 *        - `rows`: each Game Problem's CAR row, unchanged, with its role and provenance (*"Preserve each Game Problem's original CAR
 *          profile, role and provenance."*);
 *        - `unionView`: the strongest rating on each requirement under the CAR metadata's own `merge_precedence`, with every Game Problem
 *          that supplies it (*"Retain the strongest-necessity merge as a union view showing all requirements and their sources."*). It is
 *          labelled a union view and never used as the effective profile;
 *        - `effectiveProfile`: primary-led, each requirement taking the primary's rating (*"Do not automatically promote the stronger
 *          secondary requirement into the effective primary-led profile."*);
 *        - `findings`: one per requirement the secondary rates more strongly than the primary, outcome INSUFFICIENT_EVIDENCE, because no
 *          approved relationship establishes how to reconcile the difference (*"Where no approved relationship establishes how to
 *          reconcile the difference, report insufficient evidence."*). The four outcomes we proposed are typed; only this one is reachable.
 *      Stage 1's "primary wins" profile and its open merge-rule question are gone: 'Primary wins conflicts' was our paraphrase. D1 is
 *      scoped to the isolated review pathway and is not an amendment of the canonical Composite specification, which is cited, not
 *      amended. The CAR Matrix is unchanged.
 *   4. the requirements and open decisions his rulings record, attached where their stated conditions hold (by ids, never by wording). A
 *      decision a later ruling supersedes is no longer attached.
 *
 * Every decision carries its influence trace (`./trace.ts`). No goal id appears in this file. Nothing here reads a goal's name,
 * definition, entry language or any note; a static test pins both. Never served, never a selection input of the live route, never coach
 * text.
 */
import {
    activeContextRelationships,
    approvedTranslation,
    CAR_REQUIREMENTS,
    carMergePrecedence,
    carRequirementNames,
    CarRequirement,
    carRow,
    Cite,
    contextRegistryRow,
    DesignKnowledge,
    gameProblemExists,
    gameProblemRelationshipsAmong,
    learningGoalExists,
    OpenDecision,
    RelationshipRow,
    routedContext,
    ruling,
    SOURCE,
    sourceStanding,
    translationRowExists,
} from './knowledge'
import { citeRef, EstablishedBy, InfluenceTrace, item, roleWord } from './trace'

export type GameProblemRole = 'PRIMARY' | 'SECONDARY'

export interface MissingKnowledge {
    kind: string
    detail: string
    cites: Cite[]
}

export interface CompositeRow {
    gameProblemId: string
    role: GameProblemRole
    ratings: Record<CarRequirement, string>
    rowStatus: string
    validationStatus: string
    confidence: string
    evidenceType: string
    /** The CAR row; what set the role (a translation row, or his ruling and its continuation); what permitted that (an unpopulated row). */
    provenance: { carRow: Cite; roleSetBy: Cite[]; permittedBy: Cite[] }
}

export type FindingOutcome = 'INCLUDED' | 'NOT_INCLUDED' | 'CONFLICT_UNRESOLVED' | 'INSUFFICIENT_EVIDENCE'

export interface CompositeFinding {
    requirement: CarRequirement
    requirementName: string
    primary: { gameProblemId: string; rating: string }
    secondary: { gameProblemId: string; rating: string }
    outcome: FindingOutcome
    possibleOutcomes: string[]
    possibleOutcomesStanding: string
    reason: string
    description: string
    promotedIntoEffectiveProfile: false
    establishedBy: EstablishedBy
    trace: InfluenceTrace
}

export interface CompositeProfile {
    requirementNames: Record<CarRequirement, string>
    rows: CompositeRow[]
    unionView: {
        label: string
        rule: string
        perRequirement: Record<CarRequirement, { rating: string; suppliedBy: string[] }>
        usedAsEffectiveProfile: false
        establishedBy: EstablishedBy
        trace: InfluenceTrace
    }
    effectiveProfile: {
        label: string
        rule: string
        ratings: Record<CarRequirement, string>
        scope: string
        canonicalAmendment: boolean
        establishedBy: EstablishedBy
        trace: InfluenceTrace
    }
    findings: CompositeFinding[]
}

export interface ContextResolution {
    rpcId: string
    routing: Cite
    canonicalStatus: string
    runtimeStatus: string
    goalRelationship: RelationshipRow | null
    gameProblemRelationships: Array<{ gameProblemId: string; role: GameProblemRole; relationship: RelationshipRow | null }>
    primaryRelatedToContext: boolean
    establishedBy: EstablishedBy
    trace: InfluenceTrace
}

export type ResolutionStatus = 'RESOLVED' | 'RESOLVED_NOT_RELATED_TO_CONTEXT' | 'UNRESOLVED'

export interface DesignResolution {
    learningGoalId: string
    status: ResolutionStatus
    gameProblems: {
        basis: 'APPROVED_TRANSLATION' | 'SCOPED_RULING' | null
        primary: string[]
        secondary: string[]
        cites: Cite[]
        /** What set the roles: the approved translation row, or his ruling (and the later ruling that continues it). */
        roleSetBy: Cite[]
        /** What permitted a ruling to set them: the Engine Translation row, unpopulated. Empty for an approved translation. */
        permittedBy: Cite[]
        scope: string | null
        qualifier: string | null
        rulingWords: string[]
        continuedBy: { ruling: string; words: string[] } | null
        establishedBy: EstablishedBy
        trace: InfluenceTrace
    }
    context: ContextResolution | null
    profile: CompositeProfile | null
    gameProblemRelationships: Array<{ source: string; relationship: string; target: string; cite: Cite }>
    requirements: Array<{ id: string; status: string; statement: string; words: string[]; whatIsMissing: string; cite: Cite }>
    openDecisions: Array<{ id: string; question: string; words: string[]; handling: string; cite: Cite }>
    missing: MissingKnowledge[]
}

const RULINGS = (row: string): Cite => ({ file: SOURCE.rulings, table: 'rulings', row })
const STAGE2 = (row: string): Cite => ({ file: SOURCE.stage2Rulings, table: 'rulings', row })

/** The strongest code under an explicit precedence (strongest first) and every Game Problem rated with it. Unknown codes are reported. */
function unionByPrecedence(
    rows: CompositeRow[],
    order: string[],
    missing: MissingKnowledge[],
    precedenceCite: Cite
): Record<CarRequirement, { rating: string; suppliedBy: string[] }> {
    const union = {} as Record<CarRequirement, { rating: string; suppliedBy: string[] }>
    for (const requirement of CAR_REQUIREMENTS) {
        let best: string | null = null
        for (const row of rows) {
            const code = row.ratings[requirement]
            const rank = order.indexOf(code)
            if (rank === -1) {
                missing.push({
                    kind: 'CAR_RATING_OUTSIDE_PRECEDENCE',
                    detail: `${row.gameProblemId} ${requirement} is rated "${code}", which merge_precedence does not order.`,
                    cites: [row.provenance.carRow, precedenceCite],
                })
                continue
            }
            if (best === null || rank < order.indexOf(best)) best = code
        }
        union[requirement] = { rating: best ?? '', suppliedBy: rows.filter((r) => best !== null && r.ratings[requirement] === best).map((r) => r.gameProblemId) }
    }
    return union
}

export function resolveDesignContext(k: DesignKnowledge, learningGoalId: string): DesignResolution {
    const missing: MissingKnowledge[] = []
    const result: DesignResolution = {
        learningGoalId,
        status: 'UNRESOLVED',
        gameProblems: {
            basis: null,
            primary: [],
            secondary: [],
            cites: [],
            roleSetBy: [],
            permittedBy: [],
            scope: null,
            qualifier: null,
            rulingWords: [],
            continuedBy: null,
            establishedBy: 'INSUFFICIENT EVIDENCE',
            trace: { influencedBy: [], consulted: [], citedOnly: [] },
        },
        context: null,
        profile: null,
        gameProblemRelationships: [],
        requirements: [],
        openDecisions: [],
        missing,
    }

    const goal = learningGoalExists(k, learningGoalId)
    if (!goal.exists) {
        missing.push({ kind: 'UNKNOWN_LEARNING_GOAL', detail: `No Learning Goal ${learningGoalId} in the registry.`, cites: [goal.cite] })
        return result
    }

    // 1. Game Problems: the approved translation, else a scoped ruling, else unresolved.
    const planningStanding = sourceStanding(k, 'planning')
    const translation = approvedTranslation(k, learningGoalId)
    const rulings = k.rulings.scopedTranslations.filter((r) => r.learningGoalId === learningGoalId)
    const rulingItem = (id: string, role: string) => item(`stage1-rulings.json ${id}`, sourceStanding(k, 'stage1Rulings'), role, RULINGS(id))
    if (rulings.length > 1) {
        missing.push({
            kind: 'RULINGS_CONFLICT',
            detail: `More than one scoped ruling names this goal (${rulings.map((r) => r.id).join(', ')}); none is applied.`,
            cites: rulings.map((r) => RULINGS(r.id)),
        })
        result.gameProblems.trace = { influencedBy: rulings.map((r) => rulingItem(r.id, 'one of several scoped rulings naming the goal; none is applied')), consulted: [], citedOnly: [] }
    } else if (translation && rulings.length === 1) {
        missing.push({
            kind: 'RULING_WOULD_OVERRIDE_TRANSLATION',
            detail: `Scoped ruling ${rulings[0].id} names a goal whose Engine Translation is populated; a ruling never overrides an approved translation, so neither is applied.`,
            cites: [translation.cite, RULINGS(rulings[0].id)],
        })
        result.gameProblems.trace = {
            influencedBy: [item(citeRef(translation.cite), planningStanding, 'the Engine Translation row is populated', translation.cite), rulingItem(rulings[0].id, 'a scoped ruling naming the same goal; neither is applied')],
            consulted: [],
            citedOnly: [],
        }
    } else if (translation) {
        result.gameProblems = {
            ...result.gameProblems,
            basis: 'APPROVED_TRANSLATION',
            primary: translation.primary,
            secondary: translation.secondary,
            cites: [translation.cite],
            roleSetBy: [translation.cite],
            permittedBy: [],
            establishedBy: 'APPROVED KNOWLEDGE',
            trace: { influencedBy: [item(citeRef(translation.cite), planningStanding, 'the approved Engine Translation names the Game Problems and their roles', translation.cite)], consulted: [], citedOnly: [] },
        }
    } else if (rulings.length === 1) {
        const scoped = rulings[0]
        const rowCite: Cite = { file: SOURCE.planning, table: 'engine_translation', row: learningGoalId }
        const influencedBy = [rulingItem(scoped.id, 'his scoped ruling names the Game Problems and their roles')]
        const roleSetBy = [RULINGS(scoped.id)]
        if (scoped.continuedBy) {
            influencedBy.push(item(`stage2-rulings.json ${scoped.continuedBy.ruling}`, sourceStanding(k, 'stage2Rulings'), 'his later ruling retains the designation for this demonstration', STAGE2(scoped.continuedBy.ruling)))
            roleSetBy.push(STAGE2(scoped.continuedBy.ruling))
        }
        // The unpopulated row decides too: populated, it would block the ruling (a ruling never overrides an approved translation).
        influencedBy.push(item(citeRef(rowCite), planningStanding, 'the Engine Translation row is unpopulated, which permits a ruling to supply the Game Problems; populated, it would block the ruling', rowCite))
        result.gameProblems = {
            basis: 'SCOPED_RULING',
            primary: [...scoped.primaryGameProblemIds],
            secondary: [...scoped.secondaryGameProblemIds],
            cites: [RULINGS(scoped.id), rowCite],
            roleSetBy,
            permittedBy: [rowCite],
            scope: scoped.scope,
            qualifier: scoped.qualifier,
            rulingWords: [...scoped.words],
            continuedBy: scoped.continuedBy ? { ruling: scoped.continuedBy.ruling, words: [...scoped.continuedBy.words] } : null,
            establishedBy: 'RULING',
            trace: { influencedBy, consulted: [], citedOnly: [] },
        }
    } else {
        const rowCite: Cite = { file: SOURCE.planning, table: 'engine_translation', row: learningGoalId }
        result.gameProblems.trace = {
            influencedBy: [item(citeRef(rowCite), planningStanding, translationRowExists(k, learningGoalId) ? 'the Engine Translation row holds no Game Problem, and no ruling of his supplies one' : 'the Session Planning Model has no Engine Translation row for this goal', rowCite)],
            consulted: [],
            citedOnly: [],
        }
        missing.push({
            kind: translationRowExists(k, learningGoalId) ? 'TRANSLATION_UNPOPULATED' : 'TRANSLATION_ROW_MISSING',
            detail: translationRowExists(k, learningGoalId)
                ? 'The Engine Translation row holds no Game Problem, and no ruling of his supplies one.'
                : 'The Session Planning Model has no Engine Translation row for this goal.',
            cites: [{ file: SOURCE.planning, table: 'engine_translation', row: learningGoalId }],
        })
    }

    const { primary, secondary } = result.gameProblems
    if (result.gameProblems.basis) {
        // Composite Runtime RC1, as the CAR metadata declares it: one primary required, a secondary supported (at most one).
        if (primary.length !== 1 || secondary.length > 1) {
            missing.push({
                kind: 'COMPOSITE_SHAPE',
                detail: `The Composite Runtime takes exactly one primary and at most one secondary Game Problem; this goal names ${primary.length} and ${secondary.length}.`,
                cites: [...result.gameProblems.cites, { file: SOURCE.car, table: 'metadata', row: 'primary_problem_required; secondary_problem_supported' }],
            })
        }
        for (const id of [...primary, ...secondary]) {
            if (!gameProblemExists(k, id)) {
                missing.push({ kind: 'UNKNOWN_GAME_PROBLEM', detail: `${id} is not in the Game Problem register.`, cites: [{ file: SOURCE.gameProblems, table: 'gameProblems', row: id }] })
            }
        }
    }

    // 2. Context: routing, the library's own relationship row for the goal, and its rows to each resolved Game Problem.
    const contextStanding = sourceStanding(k, 'contexts')
    const routing = routedContext(k, learningGoalId)
    if (!routing) {
        missing.push({ kind: 'ROUTING_MISSING', detail: 'The goal has no single RPC routing row.', cites: [{ file: SOURCE.planning, table: 'rpc_routing', row: learningGoalId }] })
    } else {
        const registry = contextRegistryRow(k, routing.rpcId)
        if (!registry) {
            missing.push({ kind: 'UNKNOWN_CONTEXT', detail: `${routing.rpcId} is not in the context registry.`, cites: [routing.cite] })
        } else {
            const goalRows = activeContextRelationships(k, routing.rpcId, 'LEARNING_GOAL').filter((r) => r.relatedId === learningGoalId)
            const roles: Array<[string, GameProblemRole]> = [...primary.map((id): [string, GameProblemRole] => [id, 'PRIMARY']), ...secondary.map((id): [string, GameProblemRole] => [id, 'SECONDARY'])]
            const gpRows = activeContextRelationships(k, routing.rpcId, 'GAME_PROBLEM')
            const gameProblemRelationships = roles.map(([gameProblemId, role]) => ({ gameProblemId, role, relationship: gpRows.find((r) => r.relatedId === gameProblemId) ?? null }))
            const primaryRelated = gameProblemRelationships.some((g) => g.role === 'PRIMARY' && g.relationship !== null)
            const libraryStatusCite: Cite = { file: SOURCE.contexts, table: 'metadata', row: 'runtime_status' }
            const influencedBy = [
                item(citeRef(routing.cite), planningStanding, `the routing row names ${routing.rpcId}`, routing.cite),
                item(citeRef(registry.cite), contextStanding, `the context registry holds ${routing.rpcId} (canonical ${registry.canonicalStatus}; runtime ${registry.runtimeStatus})`, registry.cite),
                item(citeRef(libraryStatusCite), contextStanding, `the context library's runtime_status reads ${registry.libraryRuntimeStatus}`, libraryStatusCite),
                ...goalRows.map((r) => item(citeRef(r.cite), contextStanding, `the context library relates the goal to ${routing.rpcId} (${r.type} ${r.strength})`, r.cite)),
                ...gameProblemRelationships.map((g) =>
                    g.relationship
                        ? item(citeRef(g.relationship.cite), contextStanding, `${routing.rpcId} relates the ${roleWord(g.role)} Game Problem ${g.gameProblemId} (${g.relationship.type} ${g.relationship.strength})`, g.relationship.cite)
                        : item(`${citeRef({ file: SOURCE.contexts, table: 'relationships', row: `${routing.rpcId} GAME_PROBLEM ${g.gameProblemId}` })} (absent)`, contextStanding, `no ACTIVE row relates the ${roleWord(g.role)} Game Problem ${g.gameProblemId} to ${routing.rpcId}`)
                ),
            ]
            result.context = {
                rpcId: routing.rpcId,
                routing: routing.cite,
                canonicalStatus: registry.canonicalStatus,
                runtimeStatus: registry.runtimeStatus,
                goalRelationship: goalRows.length === 1 ? goalRows[0] : null,
                gameProblemRelationships,
                primaryRelatedToContext: primaryRelated,
                establishedBy: 'APPROVED KNOWLEDGE',
                trace: { influencedBy, consulted: [], citedOnly: [] },
            }
            if (goalRows.length !== 1) {
                missing.push({
                    kind: 'ROUTING_NOT_IN_CONTEXT_LIBRARY',
                    detail: `The routing names ${routing.rpcId}, but the context library holds ${goalRows.length} ACTIVE LEARNING_GOAL rows for this goal there.`,
                    cites: [routing.cite, { file: SOURCE.contexts, table: 'relationships', row: `${routing.rpcId} LEARNING_GOAL` }],
                })
            }
            if (registry.libraryRuntimeStatus !== 'ACTIVE') {
                missing.push({ kind: 'CONTEXT_LIBRARY_NOT_ACTIVE', detail: `The context library's runtime_status reads "${registry.libraryRuntimeStatus}".`, cites: [{ file: SOURCE.contexts, table: 'metadata', row: 'runtime_status' }] })
            }
            for (const entry of gameProblemRelationships) {
                if (!entry.relationship) {
                    missing.push({
                        kind: 'GAME_PROBLEM_NOT_RELATED_TO_CONTEXT',
                        detail: `${routing.rpcId} has no ACTIVE GAME_PROBLEM row for ${entry.gameProblemId} (${entry.role}).`,
                        cites: [{ file: SOURCE.contexts, table: 'relationships', row: `${routing.rpcId} GAME_PROBLEM ${entry.gameProblemId}` }],
                    })
                }
            }
        }
    }

    // 3. The composite profile (D1): rows with role and provenance, the union view, the primary-led effective profile, the findings.
    if (result.gameProblems.basis && primary.length === 1 && secondary.length <= 1) {
        const carStanding = sourceStanding(k, 'car')
        const rows: CompositeRow[] = []
        for (const [id, role] of [[primary[0], 'PRIMARY'], ...secondary.map((s) => [s, 'SECONDARY'])] as Array<[string, GameProblemRole]>) {
            const row = carRow(k, id)
            if (!row) {
                missing.push({ kind: 'CAR_ROW_MISSING', detail: `The CAR Matrix has no row for ${id}.`, cites: [{ file: SOURCE.car, table: 'ratings', row: id }] })
                continue
            }
            rows.push({
                gameProblemId: id,
                role,
                ratings: row.ratings,
                rowStatus: row.rowStatus,
                validationStatus: row.validationStatus,
                confidence: row.confidence,
                evidenceType: row.evidenceType,
                provenance: { carRow: row.cite, roleSetBy: [...result.gameProblems.roleSetBy], permittedBy: [...result.gameProblems.permittedBy] },
            })
        }
        if (rows.length === 1 + secondary.length) {
            const d1 = k.stage2Rulings.compositeProfile
            const d1Ruling = ruling(k, d1.ruling)
            const precedence = carMergePrecedence(k)
            const names = carRequirementNames(k)
            const union = unionByPrecedence(rows, precedence.order, missing, precedence.cite)
            const primaryRow = rows.find((r) => r.role === 'PRIMARY') as CompositeRow
            const secondaryRow = rows.find((r) => r.role === 'SECONDARY')
            const rowItem = (r: CompositeRow, role: string) => item(citeRef(r.provenance.carRow), carStanding, role, r.provenance.carRow)
            const precedenceItem = item(citeRef(precedence.cite), carStanding, `merge_precedence ${precedence.asWritten}`, precedence.cite)
            const d1Item = item(`stage2-rulings.json ${d1Ruling.id}`, sourceStanding(k, 'stage2Rulings'), `his ${d1Ruling.decision}: primary-led profile; a stronger secondary rating is kept as a finding, not promoted`, STAGE2(d1Ruling.id))
            const citedOnly = d1.citedOnly.map((c) => item(c.ref, c.standing, `cited with its own status (${c.documentStatus}); decides nothing${c.tension ? '; a possible tension with D1 is noted for his reconciliation' : ''}`))
            // Which Game Problems are merged, and in which role, is decided in part 1: by an approved translation, or by his ruling.
            const basisItems = result.gameProblems.trace.influencedBy.map((i) => ({ ...i, role: `sets which Game Problems are merged, and their roles: ${i.role}` }))
            const rank = (code: string) => precedence.order.indexOf(code)
            if (d1.reconciliationRelationships.length) {
                // No reconciliation relationship exists in his knowledge, and the shape of one is not his yet: fail closed rather than guess.
                throw new Error('stage2-rulings.json lists reconciliation relationships, which the stage does not yet know how to apply')
            }
            result.profile = {
                requirementNames: names,
                rows,
                unionView: {
                    label: d1.unionViewWording,
                    rule: `strongest necessity, merge_precedence ${precedence.asWritten} (CAR metadata)`,
                    perRequirement: union,
                    usedAsEffectiveProfile: false,
                    establishedBy: 'APPROVED KNOWLEDGE',
                    trace: {
                        influencedBy: [...rows.map((r) => rowItem(r, `${roleWord(r.role)} Game Problem's ratings`)), precedenceItem, ...basisItems],
                        consulted: [d1Item, item(citeRef(precedence.cite), d1.carMergeNote.standing, `its note: ${d1.carMergeNote.ourReading}`, precedence.cite)],
                        citedOnly: [],
                    },
                },
                effectiveProfile: {
                    label: d1.effectiveProfileWording,
                    rule: d1.effectiveProfileRule,
                    ratings: { ...primaryRow.ratings },
                    scope: d1Ruling.scope ?? 'NOT STATED IN HIS WORDS',
                    canonicalAmendment: d1Ruling.canonicalAmendment,
                    establishedBy: 'RULING',
                    trace: {
                        influencedBy: [rowItem(primaryRow, 'the primary Game Problem\'s ratings, each taken unchanged'), d1Item, ...basisItems],
                        consulted: [...(secondaryRow ? [rowItem(secondaryRow, 'the secondary Game Problem\'s ratings, shown; never promoted')] : []), precedenceItem],
                        citedOnly,
                    },
                },
                findings: secondaryRow
                    ? CAR_REQUIREMENTS.filter((req) => rank(secondaryRow.ratings[req]) !== -1 && rank(primaryRow.ratings[req]) !== -1 && rank(secondaryRow.ratings[req]) < rank(primaryRow.ratings[req])).map((requirement) => ({
                          requirement,
                          requirementName: names[requirement],
                          primary: { gameProblemId: primaryRow.gameProblemId, rating: primaryRow.ratings[requirement] },
                          secondary: { gameProblemId: secondaryRow.gameProblemId, rating: secondaryRow.ratings[requirement] },
                          outcome: 'INSUFFICIENT_EVIDENCE' as FindingOutcome,
                          possibleOutcomes: [...d1.findingOutcomes],
                          possibleOutcomesStanding: d1.findingOutcomesStanding,
                          reason: d1.findingReason,
                          description: d1.findingDescription,
                          promotedIntoEffectiveProfile: false as const,
                          establishedBy: 'INSUFFICIENT EVIDENCE' as EstablishedBy,
                          trace: {
                              influencedBy: [rowItem(primaryRow, `primary rates ${requirement} ${primaryRow.ratings[requirement]}`), rowItem(secondaryRow, `secondary rates ${requirement} ${secondaryRow.ratings[requirement]}`), precedenceItem, d1Item, ...basisItems],
                              consulted: [],
                              citedOnly,
                          },
                      }))
                    : [],
            }
        }
        result.gameProblemRelationships = gameProblemRelationshipsAmong(k, [...primary, ...secondary])
    }

    // 4. Requirements and open decisions his rulings record, attached by their stated conditions (ids only); superseded ones are not.
    const resolvedIds = [...primary, ...secondary]
    for (const requirement of k.rulings.requirements) {
        if (requirement.appliesWhenGameProblemsInclude.length && requirement.appliesWhenGameProblemsInclude.every((id) => resolvedIds.includes(id))) {
            result.requirements.push({ id: requirement.id, status: requirement.status, statement: requirement.statement, words: [...requirement.words], whatIsMissing: requirement.whatIsMissing, cite: RULINGS(requirement.id) })
        }
    }
    const openDecisions: Array<[OpenDecision, Cite]> = [
        ...k.rulings.openDecisions.map((d): [OpenDecision, Cite] => [d, RULINGS(d.id)]),
        ...k.stage2Rulings.openDecisions.map((d): [OpenDecision, Cite] => [d, { file: SOURCE.stage2Rulings, table: 'openDecisions', row: d.id }]),
    ]
    for (const [decision, cite] of openDecisions) {
        if (decision.supersededBy) continue
        const applies =
            decision.appliesWhen === 'SECONDARY_DIVERGES'
                ? Boolean(result.profile && result.profile.findings.length > 0)
                : decision.learningGoalId === learningGoalId && (!decision.rpcId || decision.rpcId === result.context?.rpcId)
        if (applies) result.openDecisions.push({ id: decision.id, question: decision.question, words: [...decision.words], handling: decision.handling, cite })
    }

    const blocking = new Set([
        'UNKNOWN_LEARNING_GOAL',
        'RULINGS_CONFLICT',
        'RULING_WOULD_OVERRIDE_TRANSLATION',
        'TRANSLATION_UNPOPULATED',
        'TRANSLATION_ROW_MISSING',
        'COMPOSITE_SHAPE',
        'UNKNOWN_GAME_PROBLEM',
        'ROUTING_MISSING',
        'UNKNOWN_CONTEXT',
        'ROUTING_NOT_IN_CONTEXT_LIBRARY',
        'CONTEXT_LIBRARY_NOT_ACTIVE',
        'CAR_ROW_MISSING',
        'CAR_RATING_OUTSIDE_PRECEDENCE',
    ])
    const resolved = result.gameProblems.basis && result.context && result.profile && !missing.some((m) => blocking.has(m.kind))
    result.status = !resolved ? 'UNRESOLVED' : result.context?.primaryRelatedToContext ? 'RESOLVED' : 'RESOLVED_NOT_RELATED_TO_CONTEXT'
    return result
}
