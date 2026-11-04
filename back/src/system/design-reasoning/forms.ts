/**
 * **Stage 1, Step 2: relational Game Form selection** — review pathway only (Christian's reply to the development proposal, received
 * 3 November 2026, item 8: *"Use declared context and Game Problem relationships, relevant structural compatibility and approved strengths.
 * Where the evidence cannot distinguish compatible forms, return insufficient evidence."*; item 6, E6: *"It should not resolve ties through
 * word matching, listing order or an arbitrary numerical preference."*).
 *
 * Candidates are the forms the routed context relates (its ACTIVE GAME_FORM rows). Each is put through the compatibility gate of
 * `selection-basis.json` (context row not CONTRADICTORY; form ACTIVE; archetype one the context relates; archetype not CONTRADICTORY to the
 * primary Game Problem; the form declares the primary Game Problem), and every condition's result is kept, so an excluded form says why.
 *
 * Compatible forms are compared on four dimensions, each an ordering of approved knowledge stated in `selection-basis.json` with its basis:
 * the context row's type and strength, and the form's declared relationship to the primary and to each secondary Game Problem. A form is
 * preferred over another only if it is at least as strong on every dimension and stronger on one. No dimension is weighted or summed. If
 * more than one compatible form is undominated, the result is INSUFFICIENT_EVIDENCE: the forms, what separates each pair (nothing, or a
 * tradeoff between dimensions), and the basis that is missing.
 *
 * Not used, and said so in the output: the Affordance Requirement Profile (the forms declare the sport's affordance labels, whose relation to
 * the four CAR requirements is E3, held for his review); player ranges (declared on no form); every narrative field (objective, role
 * structure, representative requirements, setup guidance). No goal id appears in this file.
 */
import {
    activeContextRelationships,
    archetypeGameProblemRole,
    Cite,
    DesignKnowledge,
    gameFormDeclaration,
    Ordering,
    RelationshipRow,
    SOURCE,
} from './knowledge'
import { DesignResolution, MissingKnowledge } from './resolve'

export type CheckResult = 'PASS' | 'FAIL' | 'NOT_DECLARED'

export interface StructuralCheck {
    check: string
    result: CheckResult
    detail: string
    cites: Cite[]
}

export interface DimensionValue {
    dimension: string
    value: string
}

export interface FormCandidate {
    gameFormId: string
    contextRelationship: RelationshipRow
    declaration: {
        status: string
        archetypeId: string
        primaryGameProblemIds: string[]
        secondaryGameProblemIds: string[]
        moduleStatus: string
        cite: Cite
    } | null
    checks: StructuralCheck[]
    compatible: boolean
    excludedBecause: string[]
    dimensions: DimensionValue[]
}

export interface PairComparison {
    a: string
    b: string
    outcome: 'A_DOMINATES' | 'B_DOMINATES' | 'SAME_ON_EVERY_DIMENSION' | 'TRADEOFF' | 'INCOMPARABLE'
    aStronger: string[]
    bStronger: string[]
    incomparable: string[]
}

export interface DimensionDefinition {
    id: string
    reads: string
    order: string[]
    basis: string
    cites: Cite[]
}

export interface GameFormSelection {
    learningGoalId: string
    status: 'SELECTED' | 'INSUFFICIENT_EVIDENCE' | 'NO_COMPATIBLE_FORM' | 'NOT_EVALUATED'
    selected: string | null
    rpcId: string | null
    candidates: FormCandidate[]
    compatible: string[]
    dimensionDefinitions: DimensionDefinition[]
    comparisons: PairComparison[]
    undominated: string[]
    missingBasis: string[]
    notUsed: string[]
    rules: { compatibilityGate: string; dominanceRule: string; standing: string; cite: Cite }
    missing: MissingKnowledge[]
}

const NOT_USED = [
    'The Affordance Requirement Profile: forms declare the sport module\'s affordance labels, and how those relate to the four CAR requirements is E3, held for his review.',
    'Player ranges: minimum_players and maximum_players are declared on no Game Form, and Stage 1 receives no coaching context.',
    'Narrative fields (objective, role_structure, representative_requirements, setup_guidance, notes): carried for people, never parsed.',
    'The sport module\'s Coverage rows: derived from the keyword pools, not from approved relationships.',
]

/** Rank of a value in an ordering, or null where the ordering leaves it unordered or does not name it. */
function rank(ordering: Ordering, value: string): number | null {
    const index = ordering.order.indexOf(value)
    return index === -1 ? null : index
}

/** The form's declared relationship to one Game Problem: PRIMARY, SECONDARY or NONE. */
function declared(primaryIds: string[], secondaryIds: string[], gameProblemId: string): string {
    if (primaryIds.includes(gameProblemId)) return 'PRIMARY'
    if (secondaryIds.includes(gameProblemId)) return 'SECONDARY'
    return 'NONE'
}

function compare(a: FormCandidate, b: FormCandidate, orderings: Record<string, Ordering>): PairComparison {
    const aStronger: string[] = []
    const bStronger: string[] = []
    const incomparable: string[] = []
    for (const valueA of a.dimensions) {
        const valueB = b.dimensions.find((d) => d.dimension === valueA.dimension) as DimensionValue
        const ordering = orderings[valueA.dimension]
        const rankA = rank(ordering, valueA.value)
        const rankB = rank(ordering, valueB.value)
        if (valueA.value === valueB.value) continue
        if (rankA === null || rankB === null) incomparable.push(valueA.dimension)
        else if (rankA < rankB) aStronger.push(valueA.dimension)
        else bStronger.push(valueA.dimension)
    }
    const outcome: PairComparison['outcome'] = incomparable.length
        ? 'INCOMPARABLE'
        : aStronger.length && !bStronger.length
          ? 'A_DOMINATES'
          : bStronger.length && !aStronger.length
            ? 'B_DOMINATES'
            : !aStronger.length && !bStronger.length
              ? 'SAME_ON_EVERY_DIMENSION'
              : 'TRADEOFF'
    return { a: a.gameFormId, b: b.gameFormId, outcome, aStronger, bStronger, incomparable }
}

export function selectGameForm(k: DesignKnowledge, resolution: DesignResolution): GameFormSelection {
    const missing: MissingKnowledge[] = []
    const basisCite: Cite = { file: SOURCE.basis, table: 'selection-basis', row: 'compatibilityGate; dominanceRule' }
    const result: GameFormSelection = {
        learningGoalId: resolution.learningGoalId,
        status: 'NOT_EVALUATED',
        selected: null,
        rpcId: resolution.context?.rpcId ?? null,
        candidates: [],
        compatible: [],
        dimensionDefinitions: [],
        comparisons: [],
        undominated: [],
        missingBasis: [],
        notUsed: [...NOT_USED],
        rules: { compatibilityGate: k.basis.compatibilityGate, dominanceRule: k.basis.dominanceRule, standing: k.basis.standing, cite: basisCite },
        missing,
    }
    if (resolution.status !== 'RESOLVED' || !resolution.context) {
        missing.push({ kind: 'RESOLUTION_UNRESOLVED', detail: 'Step 1 did not resolve a Game Problem and context, so no Game Form is evaluated.', cites: [] })
        return result
    }

    const rpcId = resolution.context.rpcId
    const primaryId = resolution.gameProblems.primary[0]
    const secondaryIds = resolution.gameProblems.secondary
    const archetypeRows = activeContextRelationships(k, rpcId, 'GAME_ARCHETYPE').filter((r) => !(k.basis.contextRelationshipType.excludes ?? []).includes(r.type))
    const contextArchetypes = archetypeRows.map((r) => r.relatedId)

    const orderings: Record<string, Ordering> = {
        CONTEXT_RELATIONSHIP_TYPE: k.basis.contextRelationshipType,
        CONTEXT_RELATIONSHIP_STRENGTH: k.basis.contextRelationshipStrength,
        [`FORM_DECLARES_PRIMARY ${primaryId}`]: k.basis.formGameProblemDeclaration,
        ...Object.fromEntries(secondaryIds.map((id) => [`FORM_DECLARES_SECONDARY ${id}`, k.basis.formGameProblemDeclaration])),
    }
    result.dimensionDefinitions = [
        { id: 'CONTEXT_RELATIONSHIP_TYPE', reads: `${rpcId}'s GAME_FORM relationship_type`, order: k.basis.contextRelationshipType.order, basis: k.basis.contextRelationshipType.basis, cites: k.basis.contextRelationshipType.cites },
        { id: 'CONTEXT_RELATIONSHIP_STRENGTH', reads: `${rpcId}'s GAME_FORM relationship_strength`, order: k.basis.contextRelationshipStrength.order, basis: k.basis.contextRelationshipStrength.basis, cites: k.basis.contextRelationshipStrength.cites },
        { id: `FORM_DECLARES_PRIMARY ${primaryId}`, reads: `the form's declared relationship to the primary Game Problem ${primaryId}`, order: k.basis.formGameProblemDeclaration.order, basis: k.basis.formGameProblemDeclaration.basis, cites: k.basis.formGameProblemDeclaration.cites },
        ...secondaryIds.map((id) => ({ id: `FORM_DECLARES_SECONDARY ${id}`, reads: `the form's declared relationship to the secondary Game Problem ${id}`, order: k.basis.formGameProblemDeclaration.order, basis: k.basis.formGameProblemDeclaration.basis, cites: k.basis.formGameProblemDeclaration.cites })),
    ]

    for (const relationship of activeContextRelationships(k, rpcId, 'GAME_FORM')) {
        const form = gameFormDeclaration(k, relationship.relatedId)
        const checks: StructuralCheck[] = []
        const fail = (check: string, detail: string, cites: Cite[]) => checks.push({ check, result: 'FAIL', detail, cites })
        const pass = (check: string, detail: string, cites: Cite[]) => checks.push({ check, result: 'PASS', detail, cites })

        if ((k.basis.contextRelationshipType.excludes ?? []).includes(relationship.type)) fail('CONTEXT_RELATIONSHIP', `${rpcId} relates the form ${relationship.type}.`, [relationship.cite])
        else pass('CONTEXT_RELATIONSHIP', `${rpcId} relates the form ${relationship.type} ${relationship.strength}.`, [relationship.cite])

        if (!form) {
            fail('FORM_DECLARED', `The sport module holds no Game Form ${relationship.relatedId}.`, [{ file: SOURCE.sportModule, table: 'game_forms', row: relationship.relatedId }])
        } else {
            if (form.status === 'ACTIVE') pass('FORM_STATUS', 'status ACTIVE.', [form.cite])
            else fail('FORM_STATUS', `status "${form.status}".`, [form.cite])

            if (contextArchetypes.includes(form.archetypeId)) pass('ARCHETYPE', `The form's archetype ${form.archetypeId} is one ${rpcId} relates.`, [form.cite, ...archetypeRows.filter((r) => r.relatedId === form.archetypeId).map((r) => r.cite)])
            else fail('ARCHETYPE', `The form's archetype "${form.archetypeId}" is not one ${rpcId} relates (${contextArchetypes.join(', ') || 'none'}).`, [form.cite, ...archetypeRows.map((r) => r.cite)])

            const archetypeRole = archetypeGameProblemRole(k, form.archetypeId, primaryId)
            if (!archetypeRole) checks.push({ check: 'ARCHETYPE_GAME_PROBLEM', result: 'NOT_DECLARED', detail: `The archetype workbook holds no row relating ${form.archetypeId} to ${primaryId}.`, cites: [{ file: SOURCE.archetypes, table: 'knowledge', row: `${form.archetypeId} GAME_PROBLEM_RELATIONSHIP ${primaryId}` }] })
            else if (archetypeRole.role === 'CONTRADICTORY') fail('ARCHETYPE_GAME_PROBLEM', `${form.archetypeId} relates ${primaryId} CONTRADICTORY.`, [archetypeRole.cite])
            else pass('ARCHETYPE_GAME_PROBLEM', `${form.archetypeId} relates ${primaryId} ${archetypeRole.role}.`, [archetypeRole.cite])

            const primaryDeclared = declared(form.primaryGameProblemIds, form.secondaryGameProblemIds, primaryId)
            if (primaryDeclared === 'NONE') fail('DECLARES_PRIMARY_GAME_PROBLEM', `The form declares no relationship to the primary Game Problem ${primaryId} (primary: ${form.primaryGameProblemIds.join(', ') || 'none'}; secondary: ${form.secondaryGameProblemIds.join(', ') || 'none'}).`, [form.cite])
            else pass('DECLARES_PRIMARY_GAME_PROBLEM', `The form declares ${primaryId} as ${primaryDeclared}.`, [form.cite])

            checks.push({
                check: 'PLAYER_RANGE',
                result: form.minimumPlayers || form.maximumPlayers ? 'PASS' : 'NOT_DECLARED',
                detail: form.minimumPlayers || form.maximumPlayers ? `Declared ${form.minimumPlayers || '?'} to ${form.maximumPlayers || '?'}; no coaching context is given in Stage 1, so it is not checked against one.` : 'minimum_players and maximum_players are empty; not checked.',
                cites: [form.cite],
            })
        }

        const excludedBecause = checks.filter((c) => c.result === 'FAIL').map((c) => `${c.check}: ${c.detail}`)
        const candidate: FormCandidate = {
            gameFormId: relationship.relatedId,
            contextRelationship: relationship,
            declaration: form
                ? { status: form.status, archetypeId: form.archetypeId, primaryGameProblemIds: form.primaryGameProblemIds, secondaryGameProblemIds: form.secondaryGameProblemIds, moduleStatus: form.moduleStatus, cite: form.cite }
                : null,
            checks,
            compatible: excludedBecause.length === 0,
            excludedBecause,
            dimensions: [
                { dimension: 'CONTEXT_RELATIONSHIP_TYPE', value: relationship.type },
                { dimension: 'CONTEXT_RELATIONSHIP_STRENGTH', value: relationship.strength },
                { dimension: `FORM_DECLARES_PRIMARY ${primaryId}`, value: form ? declared(form.primaryGameProblemIds, form.secondaryGameProblemIds, primaryId) : 'NONE' },
                ...secondaryIds.map((id) => ({ dimension: `FORM_DECLARES_SECONDARY ${id}`, value: form ? declared(form.primaryGameProblemIds, form.secondaryGameProblemIds, id) : 'NONE' })),
            ],
        }
        result.candidates.push(candidate)
    }

    // Candidates are reported in form-id order so the output never carries the workbook's listing order into a reader's impression.
    result.candidates.sort((x, y) => x.gameFormId.localeCompare(y.gameFormId, 'en', { numeric: true }))
    const compatible = result.candidates.filter((c) => c.compatible)
    result.compatible = compatible.map((c) => c.gameFormId)

    if (!result.candidates.length) {
        missing.push({ kind: 'CONTEXT_RELATES_NO_FORM', detail: `${rpcId} has no ACTIVE GAME_FORM relationship row.`, cites: [{ file: SOURCE.contexts, table: 'relationships', row: `${rpcId} GAME_FORM` }] })
    }
    if (!compatible.length) {
        result.status = 'NO_COMPATIBLE_FORM'
        if (result.candidates.length) {
            missing.push({
                kind: 'NO_FORM_DECLARES_GAME_PROBLEM',
                detail: `None of the forms ${rpcId} relates (${result.candidates.map((c) => c.gameFormId).join(', ')}) passes the compatibility gate; see each candidate's excludedBecause.`,
                cites: result.candidates.map((c) => c.contextRelationship.cite),
            })
        }
        return result
    }

    for (let i = 0; i < compatible.length; i++) {
        for (let j = i + 1; j < compatible.length; j++) result.comparisons.push(compare(compatible[i], compatible[j], orderings))
    }
    const dominated = new Set<string>()
    for (const c of result.comparisons) {
        if (c.outcome === 'A_DOMINATES') dominated.add(c.b)
        if (c.outcome === 'B_DOMINATES') dominated.add(c.a)
    }
    result.undominated = compatible.map((c) => c.gameFormId).filter((id) => !dominated.has(id))

    if (result.undominated.length === 1) {
        result.status = 'SELECTED'
        result.selected = result.undominated[0]
        return result
    }

    result.status = 'INSUFFICIENT_EVIDENCE'
    const between = result.comparisons.filter((c) => result.undominated.includes(c.a) && result.undominated.includes(c.b))
    for (const c of between) {
        if (c.outcome === 'SAME_ON_EVERY_DIMENSION') {
            result.missingBasis.push(`${c.a} and ${c.b} are related identically on every dimension; no approved knowledge distinguishes them.`)
        } else if (c.outcome === 'TRADEOFF') {
            result.missingBasis.push(
                `${c.a} is stronger on ${c.aStronger.join(', ')}; ${c.b} is stronger on ${c.bStronger.join(', ')}. No approved knowledge says which of these relationships should weigh more.`
            )
        } else if (c.outcome === 'INCOMPARABLE') {
            result.missingBasis.push(`${c.a} and ${c.b} differ on ${c.incomparable.join(', ')}, where the ordering in selection-basis.json does not rank the values.`)
        }
    }
    return result
}

