/**
 * **The paired, test-only width comparison** — Stage 2, review pathway only (Christian's reply to the Stage 2 decision package, received
 * 4 November 2026, D5, which authorizes the two width hypotheses "as a paired, test-only comparison of conditional hypotheses" (his
 * sentence, with the entries' ids, is in `stage2-rulings.json`) / *"The deciding circumstances must be explicitly supplied as test
 * assumptions."* / *"The engine should not claim to infer
 * actual defensive organization or functional available space from pitch dimensions and player numbers alone."* / *"Please do not
 * represent either hypothesis as empirically established or eligible for production selection."* / *"For the widening experiment, I approve
 * using a proposed configuration of the activity's playing width on the isolated review pathway, provided it remains within the coach's
 * available-space limits and any proposed adjustment is explicit."* / *"Where the conditions cannot be evaluated, return insufficient
 * evidence rather than invent a numerical threshold."*).
 *
 * The pair is named in `conditions-of-use.stage2.json` (`widthComparison.hypotheses`), one hypothesis inviting the primary Game Problem's
 * problem and one inviting the secondary's, each with its deciding circumstances as data. A scenario is a test fixture: the configured
 * area, the coach's available space (the limits), the players per team, and the two deciding circumstances, each true, false or
 * NOT_SUPPLIED, labelled TEST ASSUMPTION. For each scenario:
 *   - the comparison applies only where the resolved primary and secondary Game Problems are the ones the two entries name;
 *   - any NOT_SUPPLIED circumstance gives INSUFFICIENT_EVIDENCE for both, naming what is missing and where it could come from in future
 *     (coach observation or future feedback; never geometry);
 *   - a structural assumption (equal numbers) that cannot be evaluated gives INSUFFICIENT_EVIDENCE for both ('roughly balanced' has no
 *     approved threshold, and the numerical hypothesis is deferred);
 *   - otherwise a hypothesis's deciding conditions are met only when every circumstance it names has the value it requires; exactly one
 *     met decides, none (or both) decides neither;
 *   - the proposed configuration widens to the coach's available width, length unchanged, never beyond the available space, stated
 *     explicitly as "from X m to Y m", and is offered only where the primary-inviting hypothesis's conditions are met. Where the
 *     secondary-inviting hypothesis's conditions are met it is not offered for the primary; the primary stays as resolved. Under
 *     insufficient evidence there is no proposal and the configured width is kept;
 *   - structural facts (area and area per player, before and after; numbers) are reported as structural facts with no threshold and are
 *     never used to infer defensive organization or available space;
 *   - representative risks of an offered widening are reported as risks, never verdicts.
 * Both hypotheses are always reported together. Nothing here is empirically established, eligible for production, served or coach text.
 * No goal, Game Problem, context, Game Form, archetype or row id, and no entry id, appears in this file.
 */
import {
    archetypeIntegrityConditions,
    carMergePrecedence,
    CarRequirement,
    conditionOfUse,
    ConditionOfUse,
    contextProperty,
    DesignKnowledge,
    ruling,
    SOURCE,
    sourceStanding,
    Standing,
} from './knowledge'
import { GameFormSelection } from './forms'
import { DesignResolution, MissingKnowledge } from './resolve'
import { Conclusion, EstablishedBy, InfluenceTrace, item, TraceItem } from './trace'

export type CircumstanceValue = boolean | 'NOT_SUPPLIED'

export interface WidthScenario {
    id: string
    label: string
    configuredArea: { lengthM: number; widthM: number; standing: string }
    availableSpace: { lengthM: number; widthM: number; standing: string }
    playersPerTeam: { value: number[]; standing: string }
    decidingCircumstances: Record<string, { value: CircumstanceValue; label: string }>
}

export interface WidthFixture {
    standing: string
    learningGoalId: string
    dimensions: string
    structuralActivity: { label: string; configuredArea: { lengthM: number; widthM: number; standing: string }; playersPerTeam: { value: number[]; standing: string } }
    scenarios: WidthScenario[]
}

export type HypothesisStatus = 'CONDITIONS_MET_UNDER_TEST_ASSUMPTIONS' | 'CONDITIONS_NOT_MET' | 'INSUFFICIENT_EVIDENCE'

export interface HypothesisResult {
    entryId: string
    invites: 'PRIMARY' | 'SECONDARY'
    gameProblemId: string
    evidenceClass: string
    permittedEngineUse: string
    decidingConditions: Array<{ circumstance: string; requires: boolean; supplied: CircumstanceValue; label: string; matches: boolean | null }>
    decidingConditionsMet: boolean | null
    structuralAssumptions: Array<{ id: string; statement: string; check: string; status: 'SATISFIED' | 'NOT_EVALUABLE'; detail: string }>
    /** Assumptions the deciding circumstances stand for: supplied as test assumptions, never inferred. */
    circumstanceAssumptions: Array<{ id: string; statement: string; circumstance: string; status: 'SUPPLIED AS A TEST ASSUMPTION' | 'NOT SUPPLIED' }>
    backgroundAssumptions: Array<{ id: string; statement: string; status: 'UNVERIFIED BACKGROUND ASSUMPTION' }>
    status: HypothesisStatus
    detail: string
    empiricallyEstablished: false
    productionEligible: false
}

export type WidthOutcome = 'PRIMARY_INVITATION_CONDITIONS_MET' | 'SECONDARY_EXPLOITATION_CONDITIONS_MET' | 'NO_ROOM_WITHIN_AVAILABLE_SPACE' | 'INSUFFICIENT_EVIDENCE' | 'NOT_APPLICABLE'

export type ProposalStatus = 'OFFERED_TEST_ONLY' | 'NOT_OFFERED_FOR_PRIMARY' | 'NONE_INSUFFICIENT_EVIDENCE' | 'NO_ROOM_WITHIN_AVAILABLE_SPACE' | 'NOT_APPLICABLE'

export interface AreaFacts {
    lengthM: number
    widthM: number
    areaM2: number
    areaPerPlayerM2: number | null
}

export interface WidthScenarioResult {
    scenarioId: string
    label: string
    learningGoalId: string
    inputs: { configuredArea: WidthScenario['configuredArea']; availableSpace: WidthScenario['availableSpace']; playersPerTeam: WidthScenario['playersPerTeam']; decidingCircumstances: WidthScenario['decidingCircumstances'] }
    primaryGameProblem: { gameProblemId: string; unchanged: true; basis: string }
    secondaryGameProblem: string | null
    hypotheses: HypothesisResult[]
    outcome: WidthOutcome
    statement: string
    proposal: {
        status: ProposalStatus
        fromWidthM: number | null
        toWidthM: number | null
        lengthM: number | null
        statement: string
        basis: string
        label: string
        productionEligible: false
        establishedBy: EstablishedBy
    }
    configuredWidthKept: boolean
    structuralFacts: { label: string; playersPerTeam: number[]; totalPlayers: number; equalNumbers: boolean; configured: AreaFacts; widened: AreaFacts | null; testOnly: true }
    structuralChecks: Array<{ entryId: string; check: string; status: 'STRUCTURALLY_CERTAIN' | 'NOT_STRUCTURALLY_CERTAIN' | 'UNCERTAINTY_REPORTED'; detail: string; establishedBy: EstablishedBy }>
    risks: Array<{ kind: string; ref: string; status: 'REPORTED_RISK' | 'NOT_APPLICABLE_TO_THIS_DESIGN' | 'ROW_NOT_FOUND'; quote: string | null; quoteSource: string | null; detail: string; standing: Standing }>
    missingCircumstances: Array<{ circumstance: string; label: string; futureSource: string }>
    empiricallyEstablished: false
    productionEligible: false
    establishedBy: EstablishedBy
    trace: InfluenceTrace
    conclusions: Conclusion[]
    missing: MissingKnowledge[]
}

const round1 = (n: number) => Math.round(n * 10) / 10

function areaFacts(lengthM: number, widthM: number, players: number): AreaFacts {
    const areaM2 = lengthM * widthM
    return { lengthM, widthM, areaM2, areaPerPlayerM2: players > 0 ? round1(areaM2 / players) : null }
}

/** The pair, one hypothesis per role, read from the data; anything else is a broken data file and throws. */
function pair(k: DesignKnowledge): { primary: ConditionOfUse; secondary: ConditionOfUse } {
    const entries = k.conditionsOfUse.widthComparison.hypotheses.map((id) => conditionOfUse(k, id))
    const primary = entries.filter((e) => e.comparison?.invites === 'PRIMARY')
    const secondary = entries.filter((e) => e.comparison?.invites === 'SECONDARY')
    if (entries.length !== 2 || primary.length !== 1 || secondary.length !== 1) throw new Error('conditions-of-use.stage2.json must pair exactly one primary-inviting and one secondary-inviting hypothesis')
    return { primary: primary[0], secondary: secondary[0] }
}

export function compareWidth(k: DesignKnowledge, resolution: DesignResolution, forms: GameFormSelection, scenario: WidthScenario, fixtureRef: string): WidthScenarioResult {
    const wc = k.conditionsOfUse.widthComparison
    const wcRulings = k.stage2Rulings.widthComparison
    const d5 = ruling(k, wcRulings.ruling)
    const { primary: invitesPrimary, secondary: invitesSecondary } = pair(k)
    const missing: MissingKnowledge[] = []
    const primaryId = resolution.gameProblems.primary[0] ?? ''
    const secondaryId = resolution.gameProblems.secondary[0] ?? null
    const players = scenario.playersPerTeam.value
    const totalPlayers = players.reduce((a, b) => a + b, 0)
    const equalNumbers = players.length === 2 && players[0] === players[1]
    const entryItem = (e: ConditionOfUse, role: string): TraceItem => item(`conditions-of-use.stage2.json ${e.id}`, 'OURS', `${e.evidenceClass}, ${e.permittedEngineUse}: ${role}`, { file: SOURCE.conditionsOfUse, table: 'entries', row: e.id })
    const d5Item = item(`stage2-rulings.json ${d5.id}`, sourceStanding(k, 'stage2Rulings'), `his ${d5.decision}: the paired comparison is test-only; widening within the coach's available space`, { file: SOURCE.stage2Rulings, table: 'rulings', row: d5.id })
    const inputItem = (what: string, value: string) => item(`${fixtureRef} ${scenario.id}.${what}`, 'TEST INPUT', value)
    const assumptionItem = (key: string) => item(`${fixtureRef} ${scenario.id}.decidingCircumstances.${key}`, 'TEST ASSUMPTION', `${key} = ${String(scenario.decidingCircumstances[key]?.value ?? 'NOT_SUPPLIED')}`)
    const structuralEntryItems = wc.structuralEntries.map((id) => entryItem(conditionOfUse(k, id), 'structural facts are reported, never used to infer organization or usable space'))
    const configured = areaFacts(scenario.configuredArea.lengthM, scenario.configuredArea.widthM, totalPlayers)
    const circumstanceKeys = [...new Set([...Object.keys(invitesPrimary.comparison?.decidingCircumstances ?? {}), ...Object.keys(invitesSecondary.comparison?.decidingCircumstances ?? {})])].sort()

    const base: WidthScenarioResult = {
        scenarioId: scenario.id,
        label: scenario.label,
        learningGoalId: resolution.learningGoalId,
        inputs: { configuredArea: scenario.configuredArea, availableSpace: scenario.availableSpace, playersPerTeam: scenario.playersPerTeam, decidingCircumstances: scenario.decidingCircumstances },
        primaryGameProblem: { gameProblemId: primaryId, unchanged: true, basis: `as resolved in Step 1 (${resolution.gameProblems.basis ?? 'unresolved'}); no hypothesis switches the primary Game Problem` },
        secondaryGameProblem: secondaryId,
        hypotheses: [],
        outcome: 'NOT_APPLICABLE',
        statement: '',
        proposal: { status: 'NOT_APPLICABLE', fromWidthM: null, toWidthM: null, lengthM: null, statement: '', basis: wc.proposalBasis, label: wc.proposalLabel, productionEligible: false, establishedBy: 'INSUFFICIENT EVIDENCE' },
        configuredWidthKept: true,
        structuralFacts: { label: wc.structuralFactLabel, playersPerTeam: [...players], totalPlayers, equalNumbers, configured, widened: null, testOnly: true },
        structuralChecks: [],
        risks: [],
        missingCircumstances: [],
        empiricallyEstablished: false,
        productionEligible: false,
        establishedBy: 'INSUFFICIENT EVIDENCE',
        trace: { influencedBy: [], consulted: [], citedOnly: [] },
        conclusions: [],
        missing,
    }

    // Applicability: the resolved Game Problems are the ones the two entries name, and Step 2 left at least one compatible form.
    const applies = resolution.status !== 'UNRESOLVED' && invitesPrimary.appliesToGameProblemIds.includes(primaryId) && secondaryId !== null && invitesSecondary.appliesToGameProblemIds.includes(secondaryId) && forms.compatible.length > 0
    if (!applies) {
        base.statement = `The paired comparison applies where the primary Game Problem is one ${invitesPrimary.id} names (${invitesPrimary.appliesToGameProblemIds.join(', ')}) and the secondary one ${invitesSecondary.id} names (${invitesSecondary.appliesToGameProblemIds.join(', ')}), with a compatible Game Form; this goal resolves to ${primaryId || 'nothing'}${secondaryId ? ` and ${secondaryId}` : ''} with ${forms.compatible.length} compatible form(s).`
        base.trace = { influencedBy: [entryItem(invitesPrimary, 'names the Game Problem it applies to'), entryItem(invitesSecondary, 'names the Game Problem it applies to')], consulted: [], citedOnly: [] }
        base.conclusions.push({ id: `${scenario.id} width comparison`, step: 'width comparison', statement: base.statement, establishedBy: 'INSUFFICIENT EVIDENCE', testOnly: true, trace: base.trace })
        return base
    }

    // The two deciding circumstances, as supplied (TEST ASSUMPTION), and what is missing.
    const supplied = (key: string): CircumstanceValue => {
        const value = scenario.decidingCircumstances[key]?.value
        return value === true || value === false ? value : 'NOT_SUPPLIED'
    }
    const notSupplied = circumstanceKeys.filter((key) => supplied(key) === 'NOT_SUPPLIED')
    base.missingCircumstances = notSupplied.map((key) => {
        const known = wc.circumstances.find((c) => c.key === key)
        return { circumstance: key, label: known?.label ?? key, futureSource: known?.futureSource ?? 'coach observation or future feedback; never geometry or player numbers' }
    })

    // Structural assumptions (equal numbers) and background assumptions.
    const evaluate = (entry: ConditionOfUse, gameProblemId: string): HypothesisResult => {
        const required = entry.comparison?.decidingCircumstances ?? {}
        const decidingConditions = Object.keys(required)
            .sort()
            .map((circumstance) => {
                const value = supplied(circumstance)
                return { circumstance, requires: required[circumstance], supplied: value, label: scenario.decidingCircumstances[circumstance]?.label ?? 'TEST ASSUMPTION', matches: value === 'NOT_SUPPLIED' ? null : value === required[circumstance] }
            })
        const structuralAssumptions = entry.assumptions
            .filter((a) => a.handling === 'STRUCTURAL_CHECK')
            .map((a) => {
                const satisfied = a.check === 'EQUAL_NUMBERS' && equalNumbers
                return {
                    id: a.id,
                    statement: a.statement,
                    check: a.check ?? '',
                    status: satisfied ? ('SATISFIED' as const) : ('NOT_EVALUABLE' as const),
                    detail: satisfied ? `Equal numbers (${players.join(' v ')}) satisfy it.` : `${a.id} is not evaluable with ${players.join(' v ')} (unequal numbers): ${a.rule ?? 'no approved threshold'}`,
                }
            })
        const circumstanceAssumptions = entry.assumptions
            .filter((a) => a.handling === 'DECIDING_CIRCUMSTANCE')
            .map((a) => ({ id: a.id, statement: a.statement, circumstance: a.circumstance ?? '', status: supplied(a.circumstance ?? '') === 'NOT_SUPPLIED' ? ('NOT SUPPLIED' as const) : ('SUPPLIED AS A TEST ASSUMPTION' as const) }))
        const backgroundAssumptions = entry.assumptions.filter((a) => a.handling === 'BACKGROUND_UNVERIFIED').map((a) => ({ id: a.id, statement: a.statement, status: 'UNVERIFIED BACKGROUND ASSUMPTION' as const }))
        const met = decidingConditions.some((c) => c.matches === null) ? null : decidingConditions.every((c) => c.matches === true)
        return {
            entryId: entry.id,
            invites: entry.comparison?.invites as 'PRIMARY' | 'SECONDARY',
            gameProblemId,
            evidenceClass: entry.evidenceClass,
            permittedEngineUse: entry.permittedEngineUse,
            decidingConditions,
            decidingConditionsMet: met,
            structuralAssumptions,
            circumstanceAssumptions,
            backgroundAssumptions,
            status: 'INSUFFICIENT_EVIDENCE',
            detail: '',
            empiricallyEstablished: false,
            productionEligible: false,
        }
    }
    const hp = evaluate(invitesPrimary, primaryId)
    const hs = evaluate(invitesSecondary, secondaryId)
    base.hypotheses = [hp, hs]
    const unevaluable = [...hp.structuralAssumptions, ...hs.structuralAssumptions].filter((a) => a.status === 'NOT_EVALUABLE')

    let decided: HypothesisResult | null = null
    let why: string
    if (notSupplied.length) {
        why = `Not supplied: ${base.missingCircumstances.map((m) => `${m.label} (could come from ${m.futureSource})`).join('; ')}. The engine does not infer them from the dimensions or the player numbers.`
    } else if (unevaluable.length) {
        why = `The paired comparison cannot be made: ${unevaluable.map((a) => a.detail).join(' ')}`
    } else if (hp.decidingConditionsMet && !hs.decidingConditionsMet) {
        decided = hp
        why = `${hp.entryId}'s deciding conditions hold under the test assumptions; ${hs.entryId}'s do not.`
    } else if (hs.decidingConditionsMet && !hp.decidingConditionsMet) {
        decided = hs
        why = `${hs.entryId}'s deciding conditions hold under the test assumptions; ${hp.entryId}'s do not.`
    } else {
        why = hp.decidingConditionsMet
            ? 'The supplied circumstances meet both hypotheses\' deciding conditions; they decide neither.'
            : `The supplied circumstances meet neither hypothesis's deciding conditions; they decide neither (${invitesSecondary.id}'s failure modes include an organized defence that concedes width deliberately).`
    }
    for (const h of [hp, hs]) {
        if (decided === null) {
            h.status = 'INSUFFICIENT_EVIDENCE'
            h.detail = why
        } else {
            h.status = h === decided ? 'CONDITIONS_MET_UNDER_TEST_ASSUMPTIONS' : 'CONDITIONS_NOT_MET'
            h.detail = h === decided ? `Deciding conditions hold under the test assumptions. A test-only hypothesis; not empirically established; not eligible for production.` : 'Deciding conditions do not hold under the test assumptions.'
        }
    }

    // The proposed configuration: widen to the available width, length unchanged, never beyond the available space.
    const room = scenario.availableSpace.widthM > scenario.configuredArea.widthM && scenario.configuredArea.lengthM <= scenario.availableSpace.lengthM
    if (scenario.configuredArea.widthM > scenario.availableSpace.widthM || scenario.configuredArea.lengthM > scenario.availableSpace.lengthM) {
        missing.push({ kind: 'CONFIGURED_AREA_OUTSIDE_AVAILABLE_SPACE', detail: `The configured area (${scenario.configuredArea.lengthM} x ${scenario.configuredArea.widthM} m) exceeds the coach's available space (${scenario.availableSpace.lengthM} x ${scenario.availableSpace.widthM} m); no widening is proposed.`, cites: [] })
    }
    const fromTo = `from ${scenario.configuredArea.widthM} m to ${scenario.availableSpace.widthM} m`
    const widenedFacts = areaFacts(scenario.configuredArea.lengthM, scenario.availableSpace.widthM, totalPlayers)
    const longTerm = resolution.requirements.find((r) => r.id === wc.longTermRequirementId)
    const d1 = ruling(k, wcRulings.longTermRequirementRuling)
    const longTermItems: TraceItem[] = [
        ...(longTerm ? [item(`stage1-rulings.json ${longTerm.id}`, sourceStanding(k, 'stage1Rulings'), `${longTerm.status}: the dominant Game Problem must ultimately respond to the interaction circumstances`, longTerm.cite)] : []),
        item(`stage2-rulings.json ${d1.id}`, sourceStanding(k, 'stage2Rulings'), 'his longer-term requirement, restated in D1; cited, not implemented', { file: SOURCE.stage2Rulings, table: 'rulings', row: d1.id }),
    ]
    const referenceItems = wc.referenceEntries.map((id) => {
        const e = conditionOfUse(k, id)
        return item(`conditions-of-use.stage2.json ${e.id}`, 'REFERENCE ONLY', `${e.evidenceClass}, ${e.permittedEngineUse}: shown with its status; decides nothing`, { file: SOURCE.conditionsOfUse, table: 'entries', row: e.id })
    })
    const boundary = conditionOfUse(k, wc.boundaryEntry)
    const circumstanceItems = circumstanceKeys.map(assumptionItem)
    const geometryItems = [inputItem('configuredArea', `${scenario.configuredArea.lengthM} x ${scenario.configuredArea.widthM} m`), inputItem('availableSpace', `${scenario.availableSpace.lengthM} x ${scenario.availableSpace.widthM} m (the limits)`)]
    const hypothesisItems = [entryItem(invitesPrimary, `invites the primary Game Problem's problem`), entryItem(invitesSecondary, `invites the secondary Game Problem's problem`)]
    const influencedBy: TraceItem[] = [...circumstanceItems, ...hypothesisItems, d5Item]
    const consulted: TraceItem[] = [...structuralEntryItems]
    const citedOnly: TraceItem[] = []
    if (unevaluable.length) influencedBy.push(inputItem('playersPerTeam', players.join(' v ')))
    else consulted.push(inputItem('playersPerTeam', players.join(' v ')))

    if (decided === hp) {
        influencedBy.push(...geometryItems)
        if (room) {
            base.outcome = 'PRIMARY_INVITATION_CONDITIONS_MET'
            base.proposal = {
                ...base.proposal,
                status: 'OFFERED_TEST_ONLY',
                fromWidthM: scenario.configuredArea.widthM,
                toWidthM: scenario.availableSpace.widthM,
                lengthM: scenario.configuredArea.lengthM,
                statement: `Proposed configuration (test-only): widen the playing area ${fromTo}; length unchanged at ${scenario.configuredArea.lengthM} m. A test-only hypothesis that widening might invite the primary problem (${primaryId}); not empirically established; not eligible for production.`,
                establishedBy: 'TEST-ONLY HYPOTHESIS UNDER TEST ASSUMPTIONS',
            }
            base.configuredWidthKept = false
            base.structuralFacts.widened = widenedFacts
            base.statement = `${why} Test-only hypothesis (${hp.entryId}): widening ${fromTo} might invite the primary problem (${primaryId}). Offered as the proposed configuration on the review pathway only; not empirically established; not eligible for production.`
        } else {
            base.outcome = 'NO_ROOM_WITHIN_AVAILABLE_SPACE'
            base.proposal = {
                ...base.proposal,
                status: 'NO_ROOM_WITHIN_AVAILABLE_SPACE',
                statement: `No widening can be proposed: the coach's available space (${scenario.availableSpace.lengthM} x ${scenario.availableSpace.widthM} m) leaves no room beyond the configured ${scenario.configuredArea.lengthM} x ${scenario.configuredArea.widthM} m. The configured width is kept.`,
                establishedBy: 'LOGICAL INFERENCE',
            }
            base.statement = `${why} But no widening fits within the coach's available space, so nothing is proposed and the configured width (${scenario.configuredArea.widthM} m) is kept.`
        }
        base.establishedBy = 'TEST-ONLY HYPOTHESIS UNDER TEST ASSUMPTIONS'
    } else if (decided === hs) {
        influencedBy.push(...geometryItems)
        base.outcome = 'SECONDARY_EXPLOITATION_CONDITIONS_MET'
        base.proposal = {
            ...base.proposal,
            status: 'NOT_OFFERED_FOR_PRIMARY',
            statement: room
                ? `Widening ${fromTo} is not offered for the primary Game Problem (${primaryId}). The configured width is kept.`
                : `No widening is offered for the primary Game Problem (${primaryId}); there is also no room within the available space. The configured width is kept.`,
            establishedBy: 'TEST-ONLY HYPOTHESIS UNDER TEST ASSUMPTIONS',
        }
        base.structuralFacts.widened = room ? widenedFacts : null
        base.statement = `${why} Test-only hypothesis (${hs.entryId}): widening might make exploitation (${secondaryId}, the secondary Game Problem's problem) the more immediate one, a way the manipulation could undermine the primary learning intention. The widening is not offered for the primary. The primary stays ${primaryId}, as resolved. The longer-term requirement that the dominant Game Problem respond to the interaction circumstances is cited, not implemented; the boundary statement is cited as reference knowledge only.`
        base.establishedBy = 'TEST-ONLY HYPOTHESIS UNDER TEST ASSUMPTIONS'
        consulted.push(entryItem(boundary, 'under the test assumption that usable space already exists, Create Space would not be the problem posed; consulted, not decisive'))
        citedOnly.push(...referenceItems, ...longTermItems)
    } else {
        base.outcome = 'INSUFFICIENT_EVIDENCE'
        base.proposal = { ...base.proposal, status: 'NONE_INSUFFICIENT_EVIDENCE', statement: `No proposal. The configured width (${scenario.configuredArea.widthM} m) is kept.`, establishedBy: 'INSUFFICIENT EVIDENCE' }
        base.statement = `${why} Insufficient evidence for both ${hp.entryId} and ${hs.entryId}: no proposal, and the configured width (${scenario.configuredArea.widthM} m) is kept.`
        base.establishedBy = 'INSUFFICIENT EVIDENCE'
        consulted.push(...geometryItems)
    }

    // Structural checks on every scenario: decide only where structurally certain (a team with no players).
    const precedence = carMergePrecedence(k)
    const strongest = precedence.order[0]
    const teamWithoutPlayers = players.length !== 2 || players.some((n) => !(n > 0))
    for (const check of wc.structuralChecks) {
        const entry = conditionOfUse(k, check.entryId)
        const requirement = entry.requirement ?? ''
        const essential = resolution.profile?.effectiveProfile.ratings[requirement as CarRequirement] === strongest
        const reqText = `${requirement}${essential ? ' (Essential in the effective profile)' : ''}`
        if (teamWithoutPlayers) {
            base.structuralChecks.push({ entryId: entry.id, check: check.check, status: 'STRUCTURALLY_CERTAIN', detail: `A team has no players (${players.join(' v ')}): no competitor can influence the interaction, so ${reqText} cannot be met.`, establishedBy: 'LOGICAL INFERENCE' })
        } else if (check.check === 'NUMBERS' && !equalNumbers) {
            base.structuralChecks.push({ entryId: entry.id, check: check.check, status: 'UNCERTAINTY_REPORTED', detail: `Unequal numbers (${players.join(' v ')}): whether the outnumbered team can still rebalance, constrain or disrupt is not evaluable; no approved ratio exists.`, establishedBy: 'INSUFFICIENT EVIDENCE' })
        } else {
            base.structuralChecks.push({
                entryId: entry.id,
                check: check.check,
                status: 'NOT_STRUCTURALLY_CERTAIN',
                detail: check.check === 'AREA' ? `Not structurally certain: both teams have players. ${base.proposal.status === 'OFFERED_TEST_ONLY' ? 'The offered widening carries it as a reported risk.' : 'No widening is offered.'}` : `Equal numbers (${players.join(' v ')}): nothing to report.`,
                establishedBy: 'LOGICAL INFERENCE',
            })
        }
    }

    // Representative risks of an offered widening, each a risk, never a verdict.
    if (base.proposal.status === 'OFFERED_TEST_ONLY') {
        const archetypes = [...new Set(forms.candidates.filter((c) => c.compatible && c.declaration).map((c) => (c.declaration as { archetypeId: string }).archetypeId))]
        for (const risk of wc.risksOfWidening) {
            if (risk.kind === 'ENTRY' && risk.entryId) {
                const entry = conditionOfUse(k, risk.entryId)
                const reference = entry.sources.find((s) => s.standing === 'REFERENCE ONLY')
                base.risks.push({ kind: risk.kind, ref: `conditions-of-use.stage2.json ${entry.id}`, status: 'REPORTED_RISK', quote: reference?.quote ?? null, quoteSource: reference ? `${reference.ref} (${reference.standing})` : null, standing: 'OURS', detail: `A risk, not a verdict: ${entry.statement} ${risk.link}` })
            } else if (risk.kind === 'CONTEXT_PROPERTY' && risk.propertyId) {
                const row = contextProperty(k, risk.propertyId)
                if (!row) {
                    base.risks.push({ kind: risk.kind, ref: risk.propertyId, status: 'ROW_NOT_FOUND', quote: null, quoteSource: null, standing: sourceStanding(k, 'contexts'), detail: 'The context library holds no such property row.' })
                    missing.push({ kind: 'RISK_ROW_NOT_FOUND', detail: `${risk.propertyId} is not in the context library.`, cites: [{ file: SOURCE.contexts, table: 'properties', row: risk.propertyId }] })
                } else if (row.rpcId !== resolution.context?.rpcId || row.category !== risk.expectedCategory || row.status !== 'ACTIVE') {
                    base.risks.push({ kind: risk.kind, ref: `rpc-library.rc1.json properties ${row.propertyId}`, status: 'NOT_APPLICABLE_TO_THIS_DESIGN', quote: null, quoteSource: null, standing: sourceStanding(k, 'contexts'), detail: `The row belongs to ${row.rpcId} (${row.category}, ${row.status}), not to the routed context ${resolution.context?.rpcId ?? '(none)'} as ${risk.expectedCategory}.` })
                } else {
                    base.risks.push({ kind: risk.kind, ref: `rpc-library.rc1.json properties ${row.propertyId}`, status: 'REPORTED_RISK', quote: risk.quote ?? null, quoteSource: `rpc-library.rc1.json properties ${row.propertyId}`, standing: sourceStanding(k, 'contexts'), detail: `A risk, not a verdict: the routed context's approved ${row.category} (${row.importance}). ${risk.link}` })
                }
            } else if (risk.kind === 'INTEGRITY_CONDITION' && risk.conditionId) {
                const row = archetypes.flatMap((a) => archetypeIntegrityConditions(k, a)).find((c) => c.conditionId === risk.conditionId)
                const cls = k.stage2Rulings.relevance.integrityConditions.classification.find((c) => c.conditionId === risk.conditionId)
                if (!row || cls?.class !== 'BREACH DESCRIPTION') {
                    base.risks.push({ kind: risk.kind, ref: risk.conditionId, status: 'NOT_APPLICABLE_TO_THIS_DESIGN', quote: null, quoteSource: null, standing: sourceStanding(k, 'archetypes'), detail: 'Not a breach description of a compatible form\'s archetype.' })
                } else {
                    base.risks.push({ kind: risk.kind, ref: `game-archetype-workbook.rc1.1.json knowledge ${row.recordId} (${row.conditionId})`, status: 'REPORTED_RISK', quote: risk.quote ?? null, quoteSource: `game-archetype-workbook.rc1.1.json knowledge ${row.recordId}`, standing: sourceStanding(k, 'archetypes'), detail: `A risk, not a verdict: a breach description under his D6. ${risk.link}` })
                }
            }
        }
        consulted.push(...base.risks.map((r) => item(r.ref, r.standing, `representative risk of the widening: ${r.status}`)))
    }

    base.trace = { influencedBy, consulted, citedOnly }
    base.conclusions.push({ id: `${scenario.id} width comparison`, step: 'width comparison', statement: `${scenario.id}: ${base.outcome}. ${base.statement}`, establishedBy: base.establishedBy, testOnly: true, trace: base.trace })
    base.conclusions.push({ id: `${scenario.id} proposal`, step: 'width comparison', statement: `${scenario.id} proposal: ${base.proposal.status}. ${base.proposal.statement}`, establishedBy: base.proposal.establishedBy, testOnly: true, trace: base.trace })
    for (const check of base.structuralChecks) {
        base.conclusions.push({ id: `${scenario.id} ${check.entryId}`, step: 'width comparison', statement: `${scenario.id} ${check.entryId}: ${check.status}. ${check.detail}`, establishedBy: check.establishedBy, testOnly: true, trace: { influencedBy: [entryItem(conditionOfUse(k, check.entryId), 'structural check'), inputItem('playersPerTeam', players.join(' v '))], consulted: [], citedOnly: [] } })
    }
    return base
}
