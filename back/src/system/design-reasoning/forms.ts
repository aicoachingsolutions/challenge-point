/**
 * **Step 2: relational Game Form selection, compatibility only** — review pathway only. Stage 1 (Christian's reply to the development
 * proposal, received 3 November 2026, item 8: *"Where the evidence cannot distinguish compatible forms, return insufficient evidence."*),
 * amended for Stage 2 by his reply to the Stage 2 decision package, received 4 November 2026, D3: *"I agree with your recommendation to treat
 * the current context strengths and Game Form primary/secondary declarations as compatibility information unless approved knowledge
 * explicitly establishes a preference."* / *"Please withdraw the developer-authored orderings that imply otherwise."*
 *
 * WHAT IS WITHDRAWN. Stage 1's three orderings (context relationship strength, context relationship type, form declaration) and its Pareto
 * dominance rule are gone, with `selection-basis.json`. Nothing orders the candidates; they are listed in form-id order only so the output
 * never carries the workbook's listing order, and that order carries no preference.
 *
 * WHAT IS KEPT. Candidates are the forms the routed context relates (its ACTIVE GAME_FORM rows). Each goes through Stage 1's gate, which his
 * D3 now supports (*"Where a Game Form has no governed relationship with the resolved primary Game Problem, I agree that it should remain
 * excluded from automatic selection for now."*): the context's row is not of an excluded type; the form is ACTIVE; its archetype is one the
 * context relates; the archetype workbook does not mark the primary Game Problem with an excluded role; the form declares the primary Game
 * Problem in either column. The excluded values are read from `stage2-rulings.json`. A form failing the declaration test is excluded with
 * the reason NO_GOVERNED_RELATIONSHIP_ESTABLISHED, worded as not evidence that the form is ecologically unsuitable; every other gate failure
 * keeps its own reason.
 *
 * OUTCOMES. Exactly one candidate passes: SELECTED, worded as the only Game Form with a governed relationship (compatibility, not
 * demonstrated suitability). More than one: COMPATIBLE_ALTERNATIVES, with `preference.status` INSUFFICIENT_EVIDENCE and the knowledge that
 * could distinguish them, each marked absent. None: NO_GOVERNED_RELATIONSHIP_ESTABLISHED. A context row of a governed preference type
 * (the vocabulary's PREFERRED, "Preferred relationship.") is approved knowledge explicitly naming a preference, so it is still honoured: the
 * forms stay alternatives and the preference is reported as unconditional, needing conditions and a learning-problem justification under
 * D3. No such row exists; none is created.
 *
 * Every candidate shows its context strength and declarations labelled as compatibility information, and the archetype's relationship to
 * the primary Game Problem labelled as non-contradiction only. Not used, and said so: the composite profile, player ranges (declared on no
 * form), and every narrative field. No goal id appears in this file.
 */
import { activeContextRelationships, archetypeGameProblemRole, Cite, contextVocabularyHas, DesignKnowledge, gameFormDeclaration, RelationshipRow, ruling, SOURCE, sourceStanding } from './knowledge'
import { DesignResolution, MissingKnowledge } from './resolve'
import { citeRef, EstablishedBy, InfluenceTrace, item, roleWord, TraceItem } from './trace'

export type CheckResult = 'PASS' | 'FAIL' | 'NOT_DECLARED' | 'NOT_CHECKED'

export type ExclusionReason = 'NO_GOVERNED_RELATIONSHIP_ESTABLISHED' | 'CONTEXT_RELATIONSHIP_EXCLUDED' | 'FORM_NOT_DECLARED' | 'FORM_NOT_ACTIVE' | 'ARCHETYPE_NOT_RELATED_TO_CONTEXT' | 'ARCHETYPE_MARKS_PRIMARY_EXCLUDED'

export interface StructuralCheck {
    check: string
    result: CheckResult
    detail: string
    cites: Cite[]
    /** Set on a failing check: why the form is excluded. */
    reason?: ExclusionReason
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
    excludedBecause: Array<{ check: string; reason: ExclusionReason; detail: string }>
    /** Shown, never compared: the context row's type and strength and the form's declared relationship to each resolved Game Problem. */
    compatibilityInformation: { label: string; contextRelationshipType: string; contextRelationshipStrength: string; declares: Array<{ gameProblemId: string; role: string; declared: string }> }
}

export type FormStatus = 'SELECTED' | 'COMPATIBLE_ALTERNATIVES' | 'NO_GOVERNED_RELATIONSHIP_ESTABLISHED' | 'NOT_EVALUATED'

export interface GameFormSelection {
    learningGoalId: string
    status: FormStatus
    selected: string | null
    statement: string
    rpcId: string | null
    candidates: FormCandidate[]
    compatible: string[]
    preference: {
        status: 'NOT_APPLICABLE' | 'INSUFFICIENT_EVIDENCE' | 'UNCONDITIONAL_GOVERNED_PREFERENCE'
        preferred: string[]
        statement: string
        whatCouldDistinguish: Array<{ id: string; what: string; present: boolean; how: string; limitation: string }>
        conditionalPreferenceWords: string | null
    }
    gate: { standing: string; ruling: string; excludedContextRelationshipTypes: string[]; excludedArchetypeGameProblemRoles: string[]; governedPreferenceTypes: string[] }
    withdrawn: string
    notUsed: string[]
    establishedBy: EstablishedBy
    trace: InfluenceTrace
    missing: MissingKnowledge[]
}

const NOT_USED = [
    'The composite profile: forms declare the sport module\'s affordance labels, and his D4 classifies only what five labels mean; no element-to-affordance relevance join is approved.',
    'Player ranges: minimum_players and maximum_players are declared on no Game Form, and the stage receives no coaching context.',
    'Narrative fields (objective, role_structure, representative_requirements, setup_guidance, known_limitations, notes): carried for people, never parsed.',
    'The sport module\'s Coverage rows: derived from the keyword pools, not from approved relationships.',
    'Context relationship strength and the forms\' primary and secondary columns as preferences: withdrawn by his D3; shown as compatibility information only.',
]

/** The form's declared relationship to one Game Problem: PRIMARY, SECONDARY or NONE. */
function declared(primaryIds: string[], secondaryIds: string[], gameProblemId: string): string {
    if (primaryIds.includes(gameProblemId)) return 'PRIMARY'
    if (secondaryIds.includes(gameProblemId)) return 'SECONDARY'
    return 'NONE'
}

export function selectGameForm(k: DesignKnowledge, resolution: DesignResolution): GameFormSelection {
    const missing: MissingKnowledge[] = []
    const d3 = k.stage2Rulings.gameFormStep
    const d3Ruling = ruling(k, d3.ruling)
    const gate = d3.gate
    const d3Cite: Cite = { file: SOURCE.stage2Rulings, table: 'rulings', row: d3Ruling.id }
    const d3Item = item(`stage2-rulings.json ${d3Ruling.id}`, sourceStanding(k, 'stage2Rulings'), `his ${d3Ruling.decision}: compatibility only; the declaration gate kept`, d3Cite)
    const result: GameFormSelection = {
        learningGoalId: resolution.learningGoalId,
        status: 'NOT_EVALUATED',
        selected: null,
        statement: '',
        rpcId: resolution.context?.rpcId ?? null,
        candidates: [],
        compatible: [],
        preference: { status: 'NOT_APPLICABLE', preferred: [], statement: '', whatCouldDistinguish: [], conditionalPreferenceWords: null },
        gate: {
            standing: gate.standing,
            ruling: d3Ruling.id,
            excludedContextRelationshipTypes: [...gate.excludedContextRelationshipTypes],
            excludedArchetypeGameProblemRoles: [...gate.excludedArchetypeGameProblemRoles],
            governedPreferenceTypes: [...gate.governedPreferenceTypes],
        },
        withdrawn: 'selection-basis.json (three orderings and the dominance rule), withdrawn by his D3; the repository history keeps it.',
        notUsed: [...NOT_USED],
        establishedBy: 'INSUFFICIENT EVIDENCE',
        trace: { influencedBy: [], consulted: [], citedOnly: [] },
        missing,
    }
    if (resolution.status === 'UNRESOLVED' || !resolution.context) {
        result.statement = 'Step 1 did not resolve a Game Problem and context, so no Game Form is evaluated.'
        missing.push({ kind: 'RESOLUTION_UNRESOLVED', detail: result.statement, cites: [] })
        return result
    }
    for (const value of [...gate.excludedContextRelationshipTypes, ...gate.governedPreferenceTypes]) {
        if (!contextVocabularyHas(k, 'relationship_type', value)) {
            missing.push({ kind: 'GATE_VALUE_NOT_IN_VOCABULARY', detail: `"${value}" is not a relationship_type in the context library's controlled vocabulary.`, cites: [gate.vocabularyCite] })
        }
    }

    const contextStanding = sourceStanding(k, 'contexts')
    const moduleStanding = sourceStanding(k, 'sportModule')
    const archetypeStanding = sourceStanding(k, 'archetypes')
    const rpcId = resolution.context.rpcId
    const primaryId = resolution.gameProblems.primary[0]
    const resolvedRoles: Array<[string, string]> = [[primaryId, 'PRIMARY'], ...resolution.gameProblems.secondary.map((id): [string, string] => [id, 'SECONDARY'])]
    const archetypeRows = activeContextRelationships(k, rpcId, 'GAME_ARCHETYPE').filter((r) => !gate.excludedContextRelationshipTypes.includes(r.type))
    const contextArchetypes = archetypeRows.map((r) => r.relatedId)
    const influencedBy: TraceItem[] = [d3Item]
    const consulted: TraceItem[] = []

    for (const relationship of activeContextRelationships(k, rpcId, 'GAME_FORM')) {
        const form = gameFormDeclaration(k, relationship.relatedId)
        const checks: StructuralCheck[] = []
        const fail = (check: string, reason: ExclusionReason, detail: string, cites: Cite[]) => checks.push({ check, result: 'FAIL', detail, cites, reason })
        const pass = (check: string, detail: string, cites: Cite[]) => checks.push({ check, result: 'PASS', detail, cites })

        influencedBy.push(item(citeRef(relationship.cite), contextStanding, `${rpcId} relates ${relationship.relatedId} (${relationship.type}); the form is a candidate`, relationship.cite))
        consulted.push(item(citeRef(relationship.cite), contextStanding, `strength ${relationship.strength}: ${d3.compatibilityLabel}`, relationship.cite))

        if (gate.excludedContextRelationshipTypes.includes(relationship.type)) fail('CONTEXT_RELATIONSHIP', 'CONTEXT_RELATIONSHIP_EXCLUDED', `${rpcId} relates the form ${relationship.type}.`, [relationship.cite])
        else pass('CONTEXT_RELATIONSHIP', `${rpcId} relates the form ${relationship.type} ${relationship.strength} (${d3.compatibilityLabel}).`, [relationship.cite])

        if (!form) {
            fail('FORM_DECLARED', 'FORM_NOT_DECLARED', `The sport module holds no Game Form ${relationship.relatedId}.`, [{ file: SOURCE.sportModule, table: 'game_forms', row: relationship.relatedId }])
        } else {
            if (form.status === 'ACTIVE') pass('FORM_STATUS', 'status ACTIVE.', [form.cite])
            else fail('FORM_STATUS', 'FORM_NOT_ACTIVE', `status "${form.status}".`, [form.cite])

            if (contextArchetypes.includes(form.archetypeId)) pass('ARCHETYPE', `The form's archetype ${form.archetypeId} is one ${rpcId} relates.`, [form.cite, ...archetypeRows.filter((r) => r.relatedId === form.archetypeId).map((r) => r.cite)])
            else fail('ARCHETYPE', 'ARCHETYPE_NOT_RELATED_TO_CONTEXT', `The form's archetype "${form.archetypeId}" is not one ${rpcId} relates (${contextArchetypes.join(', ') || 'none'}).`, [form.cite, ...archetypeRows.map((r) => r.cite)])

            const archetypeRole = archetypeGameProblemRole(k, form.archetypeId, primaryId)
            if (!archetypeRole) {
                checks.push({ check: 'ARCHETYPE_GAME_PROBLEM', result: 'NOT_DECLARED', detail: `The archetype workbook holds no row relating ${form.archetypeId} to ${primaryId}.`, cites: [{ file: SOURCE.archetypes, table: 'knowledge', row: `${form.archetypeId} GAME_PROBLEM_RELATIONSHIP ${primaryId}` }] })
            } else if (gate.excludedArchetypeGameProblemRoles.includes(archetypeRole.role)) {
                fail('ARCHETYPE_GAME_PROBLEM', 'ARCHETYPE_MARKS_PRIMARY_EXCLUDED', `${form.archetypeId} relates ${primaryId} ${archetypeRole.role}.`, [archetypeRole.cite])
            } else {
                pass('ARCHETYPE_GAME_PROBLEM', `${form.archetypeId} relates ${primaryId} ${archetypeRole.role}: ${d3.archetypeLabel}.`, [archetypeRole.cite])
                consulted.push(item(citeRef(archetypeRole.cite), archetypeStanding, `${form.archetypeId} relates ${primaryId} ${archetypeRole.role}: ${d3.archetypeLabel}`, archetypeRole.cite))
            }

            const primaryDeclared = declared(form.primaryGameProblemIds, form.secondaryGameProblemIds, primaryId)
            if (primaryDeclared === 'NONE') {
                fail(
                    'DECLARES_PRIMARY_GAME_PROBLEM',
                    'NO_GOVERNED_RELATIONSHIP_ESTABLISHED',
                    `The form declares no relationship to the primary Game Problem ${primaryId} (primary: ${form.primaryGameProblemIds.join(', ') || 'none'}; secondary: ${form.secondaryGameProblemIds.join(', ') || 'none'}): ${d3.exclusionWording}.`,
                    [form.cite]
                )
            } else {
                pass('DECLARES_PRIMARY_GAME_PROBLEM', `The form declares ${primaryId} in its ${roleWord(primaryDeclared)} column (${d3.compatibilityLabel}).`, [form.cite])
            }
            influencedBy.push(item(citeRef(form.cite), moduleStanding, `the form's declared Game Problems and status (declares the primary: ${primaryDeclared})`, form.cite))

            checks.push({
                check: 'PLAYER_RANGE',
                result: form.minimumPlayers || form.maximumPlayers ? 'NOT_CHECKED' : 'NOT_DECLARED',
                detail: form.minimumPlayers || form.maximumPlayers ? `Declared ${form.minimumPlayers || '?'} to ${form.maximumPlayers || '?'}; the stage receives no coaching context, so it is not checked.` : 'minimum_players and maximum_players are empty; not checked.',
                cites: [form.cite],
            })
        }

        const excludedBecause = checks.filter((c) => c.result === 'FAIL').map((c) => ({ check: c.check, reason: c.reason as ExclusionReason, detail: c.detail }))
        result.candidates.push({
            gameFormId: relationship.relatedId,
            contextRelationship: relationship,
            declaration: form
                ? { status: form.status, archetypeId: form.archetypeId, primaryGameProblemIds: form.primaryGameProblemIds, secondaryGameProblemIds: form.secondaryGameProblemIds, moduleStatus: form.moduleStatus, cite: form.cite }
                : null,
            checks,
            compatible: excludedBecause.length === 0,
            excludedBecause,
            compatibilityInformation: {
                label: d3.compatibilityLabel,
                contextRelationshipType: relationship.type,
                contextRelationshipStrength: relationship.strength,
                declares: resolvedRoles.map(([gameProblemId, role]) => ({ gameProblemId, role, declared: form ? declared(form.primaryGameProblemIds, form.secondaryGameProblemIds, gameProblemId) : 'NONE' })),
            },
        })
    }

    // Listed in form-id order so the workbook's listing order never reaches a reader; the order carries no preference.
    const byId = (x: { gameFormId: string }, y: { gameFormId: string }) => x.gameFormId.localeCompare(y.gameFormId, 'en', { numeric: true })
    result.candidates.sort(byId)
    const sortItems = (items: TraceItem[]) => items.sort((a, b) => a.ref.localeCompare(b.ref, 'en', { numeric: true }) || a.role.localeCompare(b.role))
    result.trace = { influencedBy: sortItems(influencedBy), consulted: sortItems(consulted), citedOnly: [] }
    const compatible = result.candidates.filter((c) => c.compatible)
    result.compatible = compatible.map((c) => c.gameFormId)

    if (!result.candidates.length) {
        missing.push({ kind: 'CONTEXT_RELATES_NO_FORM', detail: `${rpcId} has no ACTIVE GAME_FORM relationship row.`, cites: [{ file: SOURCE.contexts, table: 'relationships', row: `${rpcId} GAME_FORM` }] })
    }
    if (!compatible.length) {
        result.status = 'NO_GOVERNED_RELATIONSHIP_ESTABLISHED'
        result.establishedBy = 'INSUFFICIENT EVIDENCE'
        result.statement = result.candidates.length
            ? `None of the forms ${rpcId} relates (${result.candidates.map((c) => c.gameFormId).join(', ')}) passes the gate; ${d3.exclusionWording}. See each candidate's excludedBecause.`
            : `${rpcId} relates no Game Form.`
        if (result.candidates.length) missing.push({ kind: 'NO_GOVERNED_RELATIONSHIP_ESTABLISHED', detail: result.statement, cites: result.candidates.map((c) => c.contextRelationship.cite) })
        return result
    }

    if (compatible.length === 1) {
        result.status = 'SELECTED'
        result.selected = compatible[0].gameFormId
        result.statement = `${compatible[0].gameFormId}: ${d3.selectedWording}.`
        // His D3 governs the reading (compatibility only, the gate kept); the rows it reads include the sport module's CANDIDATE declarations.
        result.establishedBy = 'RULING'
        return result
    }

    // More than one compatible form: alternatives. Only a governed preference row may name one; nothing else orders them.
    result.status = 'COMPATIBLE_ALTERNATIVES'
    result.establishedBy = 'RULING'
    result.statement = `${result.compatible.join(', ')}: ${d3.alternativesWording}.`
    const preferred = compatible.filter((c) => gate.governedPreferenceTypes.includes(c.contextRelationship.type)).map((c) => c.gameFormId)
    result.preference.whatCouldDistinguish = d3.whatCouldDistinguish.items.map((knowledge) =>
        knowledge.check === 'GOVERNED_PREFERENCE_ROW'
            ? { id: knowledge.id, what: knowledge.what, present: preferred.length > 0, how: `checked: ${preferred.length ? `${preferred.join(', ')} related ${gate.governedPreferenceTypes.join(' or ')}` : `no compatible form is related ${gate.governedPreferenceTypes.join(' or ')}`}`, limitation: knowledge.limitation }
            : { id: knowledge.id, what: knowledge.what, present: false, how: 'recorded absent (decision package, item 6); not read by the stage', limitation: knowledge.limitation }
    )
    if (preferred.length === 1) {
        result.preference.status = 'UNCONDITIONAL_GOVERNED_PREFERENCE'
        result.preference.preferred = preferred
        result.preference.statement = `${preferred[0]}: ${d3.governedPreferenceWording}.`
    } else {
        result.preference.status = 'INSUFFICIENT_EVIDENCE'
        result.preference.preferred = []
        result.preference.statement = preferred.length
            ? `${preferred.join(', ')} are each related ${gate.governedPreferenceTypes.join(' or ')}; nothing approved distinguishes them.`
            : `Insufficient evidence to prefer one of ${result.compatible.join(', ')}: no approved knowledge establishes a preference, and none is authored to resolve the tie.`
        result.preference.conditionalPreferenceWords = d3.conditionalPreferenceWords
    }
    return result
}
