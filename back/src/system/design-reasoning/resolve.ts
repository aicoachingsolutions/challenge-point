/**
 * **Stage 1, Step 1: knowledge-grounded resolution** — review pathway only (Christian's reply to the development proposal, received
 * 3 November 2026, item 8: *"Use approved Game Problem relationships, performance context and the CAR merge process to establish the
 * Affordance Requirement Profile."* *"Please ensure the reasoning is not dependent on the wording of the selected Learning Goal once its
 * approved identity and context have been resolved."*).
 *
 * The input is a Learning Goal's canonical id. Everything after it is read from relationship rows by id:
 *   1. the Game Problems: the Session Planning Model's approved Engine Translation; where that row is unpopulated, a scoped ruling of his in
 *      `stage1-rulings.json` (today only E1); otherwise UNRESOLVED, with the row's state named. A ruling never overrides a populated
 *      translation: that is reported as a conflict and nothing is resolved.
 *   2. the context: the goal's RPC routing row, checked against the context library's own LEARNING_GOAL relationship row for the goal, and
 *      the context's relationship rows to each resolved Game Problem (a resolved Game Problem the context does not relate is reported).
 *   3. the Affordance Requirement Profile: each Game Problem's CAR row, kept separately with its role; the merged profile by the CAR
 *      metadata's own `merge_precedence`; the profile under "Primary wins conflicts" beside it; and every requirement on which the primary
 *      and secondary diverge. His E1 concern (*"I don't want the CAR merge to conceal meaningful distinctions between creating and exploiting
 *      space."*) is why the merged profile is never returned alone.
 *   4. the requirements and open decisions his rulings record, attached where their stated conditions hold (by ids, never by wording).
 *
 * No goal id appears in this file. Nothing here reads a goal's name, definition, entry language or any note; a static test pins both.
 * Never served, never a selection input of the live route, never coach text.
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
    RelationshipRow,
    routedContext,
    SOURCE,
    translationRowExists,
} from './knowledge'

export type GameProblemRole = 'PRIMARY' | 'SECONDARY'

export interface MissingKnowledge {
    kind: string
    detail: string
    cites: Cite[]
}

export interface ProfileEntry {
    gameProblemId: string
    role: GameProblemRole
    ratings: Record<CarRequirement, string>
    rowStatus: string
    validationStatus: string
    confidence: string
    evidenceType: string
    cite: Cite
}

export interface AffordanceRequirementProfile {
    requirementNames: Record<CarRequirement, string>
    perGameProblem: ProfileEntry[]
    /** The merged profile by the CAR metadata's merge_precedence (what the code's Composite Runtime implements). */
    merged: { rule: string; ratings: Record<CarRequirement, string>; cite: Cite }
    /** The profile under the documented "Primary wins conflicts" rule; null when there is no secondary to conflict with. */
    underPrimaryWins: { rule: string; ratings: Record<CarRequirement, string>; cites: Cite[] } | null
    /** Requirements on which the primary and the secondary Game Problem are rated differently. */
    divergent: Array<{ requirement: CarRequirement; primary: string; secondary: string; merged: string }>
}

export interface ContextResolution {
    rpcId: string
    routing: Cite
    canonicalStatus: string
    runtimeStatus: string
    goalRelationship: RelationshipRow | null
    gameProblemRelationships: Array<{ gameProblemId: string; role: GameProblemRole; relationship: RelationshipRow | null }>
}

export interface DesignResolution {
    learningGoalId: string
    status: 'RESOLVED' | 'UNRESOLVED'
    gameProblems: {
        basis: 'APPROVED_TRANSLATION' | 'SCOPED_RULING' | null
        primary: string[]
        secondary: string[]
        cites: Cite[]
        scope: string | null
        qualifier: string | null
        rulingWords: string[]
    }
    context: ContextResolution | null
    profile: AffordanceRequirementProfile | null
    gameProblemRelationships: Array<{ source: string; relationship: string; target: string; cite: Cite }>
    requirements: Array<{ id: string; status: string; statement: string; words: string[]; whatIsMissing: string; cite: Cite }>
    openDecisions: Array<{ id: string; question: string; words: string[]; handling: string; cite: Cite }>
    missing: MissingKnowledge[]
}

const RULINGS = (row: string): Cite => ({ file: SOURCE.rulings, table: 'rulings', row })

/** Merge per requirement by an explicit precedence (strongest first). An unknown code is reported, never guessed. */
function mergeByPrecedence(
    entries: ProfileEntry[],
    order: string[],
    missing: MissingKnowledge[],
    precedenceCite: Cite
): Record<CarRequirement, string> {
    const merged = {} as Record<CarRequirement, string>
    for (const requirement of CAR_REQUIREMENTS) {
        let best: string | null = null
        for (const entry of entries) {
            const code = entry.ratings[requirement]
            const rank = order.indexOf(code)
            if (rank === -1) {
                missing.push({
                    kind: 'CAR_RATING_OUTSIDE_PRECEDENCE',
                    detail: `${entry.gameProblemId} ${requirement} is rated "${code}", which merge_precedence does not order.`,
                    cites: [entry.cite, precedenceCite],
                })
                continue
            }
            if (best === null || rank < order.indexOf(best)) best = code
        }
        merged[requirement] = best ?? ''
    }
    return merged
}

export function resolveDesignContext(k: DesignKnowledge, learningGoalId: string): DesignResolution {
    const missing: MissingKnowledge[] = []
    const result: DesignResolution = {
        learningGoalId,
        status: 'UNRESOLVED',
        gameProblems: { basis: null, primary: [], secondary: [], cites: [], scope: null, qualifier: null, rulingWords: [] },
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
    const translation = approvedTranslation(k, learningGoalId)
    const rulings = k.rulings.scopedTranslations.filter((r) => r.learningGoalId === learningGoalId)
    if (rulings.length > 1) {
        missing.push({
            kind: 'RULINGS_CONFLICT',
            detail: `More than one scoped ruling names this goal (${rulings.map((r) => r.id).join(', ')}); none is applied.`,
            cites: rulings.map((r) => RULINGS(r.id)),
        })
    } else if (translation && rulings.length === 1) {
        missing.push({
            kind: 'RULING_WOULD_OVERRIDE_TRANSLATION',
            detail: `Scoped ruling ${rulings[0].id} names a goal whose Engine Translation is populated; a ruling never overrides an approved translation, so neither is applied.`,
            cites: [translation.cite, RULINGS(rulings[0].id)],
        })
    } else if (translation) {
        result.gameProblems = { ...result.gameProblems, basis: 'APPROVED_TRANSLATION', primary: translation.primary, secondary: translation.secondary, cites: [translation.cite] }
    } else if (rulings.length === 1) {
        const ruling = rulings[0]
        result.gameProblems = {
            basis: 'SCOPED_RULING',
            primary: [...ruling.primaryGameProblemIds],
            secondary: [...ruling.secondaryGameProblemIds],
            cites: [RULINGS(ruling.id), { file: SOURCE.planning, table: 'engine_translation', row: learningGoalId }],
            scope: ruling.scope,
            qualifier: ruling.qualifier,
            rulingWords: [...ruling.words],
        }
    } else {
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
            result.context = {
                rpcId: routing.rpcId,
                routing: routing.cite,
                canonicalStatus: registry.canonicalStatus,
                runtimeStatus: registry.runtimeStatus,
                goalRelationship: goalRows.length === 1 ? goalRows[0] : null,
                gameProblemRelationships: roles.map(([gameProblemId, role]) => ({
                    gameProblemId,
                    role,
                    relationship: gpRows.find((r) => r.relatedId === gameProblemId) ?? null,
                })),
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
            for (const entry of result.context.gameProblemRelationships) {
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

    // 3. The Affordance Requirement Profile: each Game Problem's row with its role, the merge, the alternative, the divergences.
    if (result.gameProblems.basis && primary.length === 1 && secondary.length <= 1) {
        const entries: ProfileEntry[] = []
        for (const [id, role] of [[primary[0], 'PRIMARY'], ...secondary.map((s) => [s, 'SECONDARY'])] as Array<[string, GameProblemRole]>) {
            const row = carRow(k, id)
            if (!row) {
                missing.push({ kind: 'CAR_ROW_MISSING', detail: `The CAR Matrix has no row for ${id}.`, cites: [{ file: SOURCE.car, table: 'ratings', row: id }] })
                continue
            }
            entries.push({ gameProblemId: id, role, ratings: row.ratings, rowStatus: row.rowStatus, validationStatus: row.validationStatus, confidence: row.confidence, evidenceType: row.evidenceType, cite: row.cite })
        }
        if (entries.length === 1 + secondary.length) {
            const precedence = carMergePrecedence(k)
            const merged = mergeByPrecedence(entries, precedence.order, missing, precedence.cite)
            const primaryEntry = entries.find((e) => e.role === 'PRIMARY') as ProfileEntry
            const secondaryEntry = entries.find((e) => e.role === 'SECONDARY')
            result.profile = {
                requirementNames: carRequirementNames(k),
                perGameProblem: entries,
                merged: { rule: `strongest necessity, merge_precedence ${precedence.asWritten} (CAR metadata)`, ratings: merged, cite: precedence.cite },
                underPrimaryWins: secondaryEntry
                    ? {
                          rule: 'Primary wins conflicts (documented in docs/HANDOFF.md and the gp-library.ts header; the Composite Runtime specification is not in the repository)',
                          ratings: { ...primaryEntry.ratings },
                          cites: [primaryEntry.cite],
                      }
                    : null,
                divergent: secondaryEntry
                    ? CAR_REQUIREMENTS.filter((req) => primaryEntry.ratings[req] !== secondaryEntry.ratings[req]).map((requirement) => ({
                          requirement,
                          primary: primaryEntry.ratings[requirement],
                          secondary: secondaryEntry.ratings[requirement],
                          merged: merged[requirement],
                      }))
                    : [],
            }
        }
        result.gameProblemRelationships = gameProblemRelationshipsAmong(k, [...primary, ...secondary])
    }

    // 4. Requirements and open decisions his rulings record, attached by their stated conditions (ids only).
    const resolvedIds = [...primary, ...secondary]
    for (const requirement of k.rulings.requirements) {
        if (requirement.appliesWhenGameProblemsInclude.length && requirement.appliesWhenGameProblemsInclude.every((id) => resolvedIds.includes(id))) {
            result.requirements.push({ id: requirement.id, status: requirement.status, statement: requirement.statement, words: [...requirement.words], whatIsMissing: requirement.whatIsMissing, cite: RULINGS(requirement.id) })
        }
    }
    for (const decision of k.rulings.openDecisions) {
        const applies =
            decision.appliesWhen === 'SECONDARY_DIVERGES'
                ? Boolean(result.profile && result.profile.divergent.length > 0)
                : decision.learningGoalId === learningGoalId && (!decision.rpcId || decision.rpcId === result.context?.rpcId)
        if (applies) result.openDecisions.push({ id: decision.id, question: decision.question, words: [...decision.words], handling: decision.handling, cite: RULINGS(decision.id) })
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
    result.status = result.gameProblems.basis && result.context && result.profile && !missing.some((m) => blocking.has(m.kind)) ? 'RESOLVED' : 'UNRESOLVED'
    return result
}
