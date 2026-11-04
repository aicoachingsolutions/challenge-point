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
 * NOT_SUPPLIED, labelled TEST ASSUMPTION, each stating the area it describes. For each scenario, in this order:
 *   - the comparison applies only where the resolved primary and secondary Game Problems are the ones the two entries name, and Step 2
 *     left a compatible Game Form (so what decided Step 1 and Step 2 is in the trace);
 *   - the dimensions are checked against the limits only: a non-positive dimension is an invalid test input, and a configured area that
 *     already exceeds the available space gets its own outcome, with no proposal and no endorsement of the configured area;
 *   - any NOT_SUPPLIED circumstance gives INSUFFICIENT_EVIDENCE for both, naming what is missing and where it could come from in future
 *     (coach observation or future feedback; never geometry);
 *   - a structural assumption (two equal team sizes, each a positive whole number) that cannot be evaluated gives INSUFFICIENT_EVIDENCE for
 *     both ('roughly balanced' has no approved threshold, and the numerical hypothesis is deferred); a team with no players is named as
 *     such;
 *   - otherwise a hypothesis's deciding conditions are met only when every circumstance it names has the value it requires; exactly one
 *     met decides; none (or both) decides neither, and each hypothesis keeps its own result;
 *   - the proposed configuration widens to the coach's available width, length unchanged, never beyond the available space, stated
 *     explicitly as "from X m to Y m", and is offered only where the primary-inviting hypothesis's conditions are met. Where the
 *     secondary-inviting hypothesis's conditions are met it is not offered for the primary (that hypothesis's intended influence, ours,
 *     named in the trace); the primary stays as resolved. Under insufficient evidence there is no proposal and the configured width is kept;
 *   - structural facts (area and area per player, before and after; numbers) are reported as structural facts with no threshold and are
 *     never used to infer defensive organization or available space; the structural checks report structural certainty and decide nothing;
 *   - representative risks of an offered widening are reported as risks, never verdicts.
 * Every result names the rule that gave its outcome (`basis`). Both hypotheses are always reported together. Nothing here is empirically
 * established, eligible for production, served or coach text. No goal, Game Problem, context, Game Form, archetype or row id, and no entry
 * id, appears in this file.
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
import { citeRef, Conclusion, EstablishedBy, InfluenceTrace, item, TraceItem, weakestStanding } from './trace'

export type CircumstanceValue = boolean | 'NOT_SUPPLIED'

export interface WidthScenario {
    id: string
    label: string
    configuredArea: { lengthM: number; widthM: number; standing: string }
    availableSpace: { lengthM: number; widthM: number; standing: string }
    playersPerTeam: { value: number[]; standing: string }
    /** Each circumstance as supplied, and the area it describes (`appliesTo`). */
    decidingCircumstances: Record<string, { value: CircumstanceValue; label: string; appliesTo?: string }>
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
    decidingConditions: Array<{ circumstance: string; requires: boolean; supplied: CircumstanceValue; label: string; appliesTo: string | null; matches: boolean | null }>
    decidingConditionsMet: boolean | null
    structuralAssumptions: Array<{ id: string; statement: string; check: string; status: 'SATISFIED' | 'NOT_EVALUABLE'; detail: string }>
    /** The deciding circumstances, each stated once with one meaning: supplied as test assumptions, never inferred. */
    circumstanceAssumptions: Array<{ id: string; statement: string; circumstance: string; requires: boolean | null; status: 'SUPPLIED AS A TEST ASSUMPTION' | 'NOT SUPPLIED' }>
    backgroundAssumptions: Array<{ id: string; statement: string; status: 'UNVERIFIED BACKGROUND ASSUMPTION' }>
    status: HypothesisStatus
    detail: string
    empiricallyEstablished: false
    productionEligible: false
}

export type WidthOutcome =
    | 'PRIMARY_INVITATION_CONDITIONS_MET'
    | 'SECONDARY_EXPLOITATION_CONDITIONS_MET'
    | 'NO_ROOM_WITHIN_AVAILABLE_SPACE'
    | 'CONFIGURED_AREA_EXCEEDS_AVAILABLE_SPACE'
    | 'INVALID_TEST_INPUT'
    | 'INSUFFICIENT_EVIDENCE'
    | 'NOT_APPLICABLE'

export type ProposalStatus =
    | 'OFFERED_TEST_ONLY'
    | 'NOT_OFFERED_FOR_PRIMARY'
    | 'NONE_INSUFFICIENT_EVIDENCE'
    | 'NO_ROOM_WITHIN_AVAILABLE_SPACE'
    | 'NONE_CONFIGURED_AREA_EXCEEDS_AVAILABLE_SPACE'
    | 'NONE_INVALID_TEST_INPUT'
    | 'NOT_APPLICABLE'

/** The rule that gave the outcome, in the order the rules are applied. */
export type DecisionBasis =
    | 'NOT_APPLICABLE'
    | 'INVALID_GEOMETRY'
    | 'CONFIGURED_AREA_EXCEEDS_AVAILABLE_SPACE'
    | 'CIRCUMSTANCES_NOT_SUPPLIED'
    | 'STRUCTURAL_ASSUMPTION_NOT_EVALUABLE'
    | 'PRIMARY_INVITING_CONDITIONS_MET'
    | 'SECONDARY_INVITING_CONDITIONS_MET'
    | 'NEITHER_DECIDES'

/** Team sizes as a structural fact: two teams of positive whole numbers, or why not. */
export type TeamSizes = 'TWO_TEAMS_WITH_PLAYERS' | 'A_TEAM_WITHOUT_PLAYERS' | 'NOT_TWO_TEAMS' | 'NOT_WHOLE_NUMBERS'

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
    basis: DecisionBasis
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
    /** True where the configured width is kept; false where a test-only widening is offered; null where neither (outside the limits, or invalid input). */
    configuredWidthKept: boolean | null
    structuralFacts: { label: string; playersPerTeam: number[]; totalPlayers: number; teamSizes: TeamSizes; equalNumbers: boolean; configured: AreaFacts; widened: AreaFacts | null; testOnly: true }
    structuralChecks: Array<{ entryId: string; check: string; status: 'STRUCTURALLY_CERTAIN' | 'NOT_STRUCTURALLY_CERTAIN' | 'UNCERTAINTY_REPORTED'; detail: string; decidesNothing: true; establishedBy: EstablishedBy }>
    risks: Array<{ kind: string; ref: string; status: 'REPORTED_RISK' | 'NOT_APPLICABLE_TO_THIS_DESIGN' | 'ROW_NOT_FOUND'; quote: string | null; quoteSource: string | null; detail: string; standing: Standing }>
    missingCircumstances: Array<{ circumstance: string; label: string; futureSource: string }>
    /** Entries the data marks as deferred: evaluated nowhere. */
    deferredEntries: Array<{ entryId: string; permittedEngineUse: string }>
    empiricallyEstablished: false
    productionEligible: false
    establishedBy: EstablishedBy
    trace: InfluenceTrace
    conclusions: Conclusion[]
    missing: MissingKnowledge[]
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function classifyTeams(players: number[]): TeamSizes {
    if (players.length !== 2) return 'NOT_TWO_TEAMS'
    if (players.some((n) => typeof n !== 'number' || !Number.isInteger(n))) return 'NOT_WHOLE_NUMBERS'
    if (players.some((n) => n <= 0)) return 'A_TEAM_WITHOUT_PLAYERS'
    return 'TWO_TEAMS_WITH_PLAYERS'
}

function areaFacts(lengthM: number, widthM: number, players: number | null): AreaFacts {
    const areaM2 = lengthM * widthM
    return { lengthM, widthM, areaM2, areaPerPlayerM2: players !== null && players > 0 ? round1(areaM2 / players) : null }
}

/** A list of ids as words: "a", "a and b", "a, b and c". */
const listWords = (ids: string[]): string => (ids.length <= 1 ? ids.join('') : `${ids.slice(0, -1).join(', ')} and ${ids[ids.length - 1]}`)

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
    const teamSizes = classifyTeams(players)
    const totalPlayers = players.reduce((a, b) => a + b, 0)
    const equalNumbers = teamSizes === 'TWO_TEAMS_WITH_PLAYERS' && players[0] === players[1]
    const sourceStandings = (e: ConditionOfUse) => [...new Set(e.sources.map((s) => s.standing))].sort().join(', ')
    const entryItem = (e: ConditionOfUse, role: string): TraceItem =>
        item(`conditions-of-use.stage2.json ${e.id}`, 'OURS', `${e.evidenceClass}, ${e.permittedEngineUse} (its sources: ${sourceStandings(e)}): ${role}`, { file: SOURCE.conditionsOfUse, table: 'entries', row: e.id })
    const d5Item = item(`stage2-rulings.json ${d5.id}`, sourceStanding(k, 'stage2Rulings'), `his ${d5.decision}: the paired comparison is test-only; widening within the coach's available space`, { file: SOURCE.stage2Rulings, table: 'rulings', row: d5.id })
    const inputItem = (what: string, value: string) => item(`${fixtureRef} ${scenario.id}.${what}`, 'TEST INPUT', value)
    const assumptionItem = (key: string) => {
        const c = scenario.decidingCircumstances[key]
        return item(`${fixtureRef} ${scenario.id}.decidingCircumstances.${key}`, 'TEST ASSUMPTION', `${key} = ${String(c?.value ?? 'NOT_SUPPLIED')} (describes ${c?.appliesTo ?? 'an area not stated'})`)
    }
    const structuralEntryItems = wc.structuralEntries.map((id) => entryItem(conditionOfUse(k, id), 'structural facts are reported, never used to infer organization or usable space'))
    const geometryValid = [scenario.configuredArea.lengthM, scenario.configuredArea.widthM, scenario.availableSpace.lengthM, scenario.availableSpace.widthM].every((d) => typeof d === 'number' && Number.isFinite(d) && d > 0)
    const configured = areaFacts(scenario.configuredArea.lengthM, scenario.configuredArea.widthM, teamSizes === 'TWO_TEAMS_WITH_PLAYERS' ? totalPlayers : null)
    const circumstanceKeys = [...new Set([...Object.keys(invitesPrimary.comparison?.decidingCircumstances ?? {}), ...Object.keys(invitesSecondary.comparison?.decidingCircumstances ?? {})])].sort()
    // What decided Step 1 (the Game Problems) and Step 2 (a compatible form) decides whether the comparison applies at all.
    const step1Items = resolution.gameProblems.trace.influencedBy.map((i) => ({ ...i, role: `gates whether the comparison applies (Step 1 set the Game Problems): ${i.role}` }))
    const step2Item = item(`Step 2: ${forms.status}${forms.compatible.length ? ` (${forms.compatible.join(', ')})` : ''}`, weakestStanding(forms.trace) ?? 'OURS', 'gates whether the comparison applies: at least one compatible Game Form (standing: the weakest among what decided Step 2)')
    const gateItems = [...step1Items, step2Item]

    const base: WidthScenarioResult = {
        scenarioId: scenario.id,
        label: scenario.label,
        learningGoalId: resolution.learningGoalId,
        inputs: { configuredArea: scenario.configuredArea, availableSpace: scenario.availableSpace, playersPerTeam: scenario.playersPerTeam, decidingCircumstances: scenario.decidingCircumstances },
        primaryGameProblem: { gameProblemId: primaryId, unchanged: true, basis: `as resolved in Step 1 (${resolution.gameProblems.basis ?? 'unresolved'}); no hypothesis switches the primary Game Problem` },
        secondaryGameProblem: secondaryId,
        hypotheses: [],
        outcome: 'NOT_APPLICABLE',
        basis: 'NOT_APPLICABLE',
        statement: '',
        proposal: { status: 'NOT_APPLICABLE', fromWidthM: null, toWidthM: null, lengthM: null, statement: '', basis: wc.proposalBasis, label: wc.proposalLabel, productionEligible: false, establishedBy: 'INSUFFICIENT EVIDENCE' },
        configuredWidthKept: true,
        structuralFacts: { label: wc.structuralFactLabel, playersPerTeam: [...players], totalPlayers, teamSizes, equalNumbers, configured, widened: null, testOnly: true },
        structuralChecks: [],
        risks: [],
        missingCircumstances: [],
        deferredEntries: wc.deferredEntries.map((id) => ({ entryId: id, permittedEngineUse: conditionOfUse(k, id).permittedEngineUse })),
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
        base.trace = { influencedBy: [...gateItems, entryItem(invitesPrimary, 'names the Game Problem it applies to'), entryItem(invitesSecondary, 'names the Game Problem it applies to')], consulted: [], citedOnly: [] }
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

    // The structural assumption (two equal team sizes, each a positive whole number), why it is not evaluable, and the background assumptions.
    const notEvaluableBecause = (): string => {
        if (teamSizes === 'NOT_TWO_TEAMS') return `the comparison takes two teams, and ${players.length} are given`
        if (teamSizes === 'NOT_WHOLE_NUMBERS') return 'the team sizes are not whole numbers'
        if (teamSizes === 'A_TEAM_WITHOUT_PLAYERS') return 'a team has no players, so no competitor can influence the interaction'
        return 'unequal numbers'
    }
    const evaluate = (entry: ConditionOfUse, gameProblemId: string): HypothesisResult => {
        const required = entry.comparison?.decidingCircumstances ?? {}
        const decidingConditions = Object.keys(required)
            .sort()
            .map((circumstance) => {
                const value = supplied(circumstance)
                const given = scenario.decidingCircumstances[circumstance]
                return { circumstance, requires: required[circumstance], supplied: value, label: given?.label ?? 'TEST ASSUMPTION', appliesTo: given?.appliesTo ?? null, matches: value === 'NOT_SUPPLIED' ? null : value === required[circumstance] }
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
                    detail: satisfied ? `Equal numbers (${players.join(' v ')}) satisfy it.` : `${a.id} is not evaluable with ${players.join(' v ')} (${notEvaluableBecause()}): ${a.rule ?? 'no approved threshold'}`,
                }
            })
        const circumstanceAssumptions = entry.assumptions
            .filter((a) => a.handling === 'DECIDING_CIRCUMSTANCE')
            .map((a) => ({
                id: a.id,
                statement: a.statement,
                circumstance: a.circumstance ?? '',
                requires: a.circumstance !== undefined && a.circumstance in required ? required[a.circumstance] : null,
                status: supplied(a.circumstance ?? '') === 'NOT_SUPPLIED' ? ('NOT SUPPLIED' as const) : ('SUPPLIED AS A TEST ASSUMPTION' as const),
            }))
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

    // Each hypothesis's own result, from the circumstances and the structural assumption only.
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
        const everyCircumstanceTrue = circumstanceKeys.every((key) => supplied(key) === true)
        why = hp.decidingConditionsMet
            ? 'The supplied circumstances meet both hypotheses\' deciding conditions; they decide neither.'
            : `The supplied circumstances meet neither hypothesis's deciding conditions; they decide neither${everyCircumstanceTrue ? ` (${invitesSecondary.id}'s failure modes include an organized defence that concedes width deliberately)` : ''}.`
    }
    for (const h of [hp, hs]) {
        if (notSupplied.length || unevaluable.length) {
            h.status = 'INSUFFICIENT_EVIDENCE'
            h.detail = why
        } else if (decided !== null) {
            h.status = h === decided ? 'CONDITIONS_MET_UNDER_TEST_ASSUMPTIONS' : 'CONDITIONS_NOT_MET'
            h.detail = h === decided ? `Deciding conditions hold under the test assumptions. A test-only hypothesis; not empirically established; not eligible for production.` : 'Deciding conditions do not hold under the test assumptions.'
        } else {
            h.status = h.decidingConditionsMet ? 'CONDITIONS_MET_UNDER_TEST_ASSUMPTIONS' : 'CONDITIONS_NOT_MET'
            h.detail = `${h.decidingConditionsMet ? 'Deciding conditions hold under the test assumptions' : 'Deciding conditions do not hold under the test assumptions'}; the pair decides neither.`
        }
    }

    // The rule that gives the outcome: the limits first, then the circumstances, the structural assumption and the hypotheses.
    const exceeds = geometryValid && (scenario.configuredArea.widthM > scenario.availableSpace.widthM || scenario.configuredArea.lengthM > scenario.availableSpace.lengthM)
    const room = geometryValid && !exceeds && scenario.availableSpace.widthM > scenario.configuredArea.widthM
    const basis: DecisionBasis = !geometryValid
        ? 'INVALID_GEOMETRY'
        : exceeds
          ? 'CONFIGURED_AREA_EXCEEDS_AVAILABLE_SPACE'
          : notSupplied.length
            ? 'CIRCUMSTANCES_NOT_SUPPLIED'
            : unevaluable.length
              ? 'STRUCTURAL_ASSUMPTION_NOT_EVALUABLE'
              : decided === hp
                ? 'PRIMARY_INVITING_CONDITIONS_MET'
                : decided === hs
                  ? 'SECONDARY_INVITING_CONDITIONS_MET'
                  : 'NEITHER_DECIDES'
    base.basis = basis

    const fromTo = `from ${scenario.configuredArea.widthM} m to ${scenario.availableSpace.widthM} m`
    const widenedFacts = areaFacts(scenario.configuredArea.lengthM, scenario.availableSpace.widthM, teamSizes === 'TWO_TEAMS_WITH_PLAYERS' ? totalPlayers : null)
    const longTerm = resolution.requirements.find((r) => r.id === wc.longTermRequirementId)
    const d1 = ruling(k, wcRulings.longTermRequirementRuling)
    const longTermItems: TraceItem[] = [
        ...(longTerm ? [item(`stage1-rulings.json ${longTerm.id}`, sourceStanding(k, 'stage1Rulings'), `${longTerm.status}: the dominant Game Problem must ultimately respond to the interaction circumstances`, longTerm.cite)] : []),
        item(`stage2-rulings.json ${d1.id}`, sourceStanding(k, 'stage2Rulings'), 'his longer-term requirement, restated in D1; cited, not implemented', { file: SOURCE.stage2Rulings, table: 'rulings', row: d1.id }),
    ]
    const permission = ruling(k, wcRulings.referenceCitationRuling)
    const referenceItems = [
        ...wc.referenceEntries.map((id) => {
            const e = conditionOfUse(k, id)
            return item(`conditions-of-use.stage2.json ${e.id}`, 'REFERENCE ONLY', `${e.evidenceClass}, ${e.permittedEngineUse}: shown with its status; decides nothing`, { file: SOURCE.conditionsOfUse, table: 'entries', row: e.id })
        }),
        item(`stage2-rulings.json ${permission.id}`, sourceStanding(k, 'stage2Rulings'), 'his permission to cite the boundary statement in review traces as reference knowledge, its status explicit; not an executable rule', { file: SOURCE.stage2Rulings, table: 'rulings', row: permission.id }),
    ]
    const boundary = conditionOfUse(k, wc.boundaryEntry)
    const circumstanceItems = circumstanceKeys.map(assumptionItem)
    const geometryItems = [
        inputItem('configuredArea', `${scenario.configuredArea.lengthM} x ${scenario.configuredArea.widthM} m; checked against the limits only, never used to infer organization or usable space`),
        inputItem('availableSpace', `${scenario.availableSpace.lengthM} x ${scenario.availableSpace.widthM} m (the limits)`),
    ]
    const playersItem = inputItem('playersPerTeam', players.join(' v '))
    const structuralAssumptionItems = [hp, hs].flatMap((h) =>
        h.structuralAssumptions.map((a) => item(`conditions-of-use.stage2.json ${h.entryId} assumption ${a.id}`, 'OURS', `structural check ${a.check}: ${a.status}; it gates the comparison`, { file: SOURCE.conditionsOfUse, table: 'entries', row: h.entryId }))
    )
    const hypothesisItems = [entryItem(invitesPrimary, `invites the primary Game Problem's problem`), entryItem(invitesSecondary, decided === hs && basis === 'SECONDARY_INVITING_CONDITIONS_MET' ? `invites the secondary Game Problem's problem; ${wc.notOfferedBasis}` : `invites the secondary Game Problem's problem`)]
    const influencedBy: TraceItem[] = [...gateItems, d5Item, ...geometryItems]
    const consulted: TraceItem[] = []
    const citedOnly: TraceItem[] = []
    if (basis === 'INVALID_GEOMETRY' || basis === 'CONFIGURED_AREA_EXCEEDS_AVAILABLE_SPACE') {
        // The limits decide; the hypotheses are reported but decide nothing here.
        consulted.push(...hypothesisItems, ...circumstanceItems, playersItem, ...structuralEntryItems)
    } else if (basis === 'CIRCUMSTANCES_NOT_SUPPLIED') {
        influencedBy.push(...hypothesisItems, ...circumstanceItems)
        consulted.push(playersItem, ...structuralEntryItems)
    } else {
        // Every circumstance is supplied, so the structural assumption gates the comparison: the team sizes decide too.
        influencedBy.push(...hypothesisItems, ...circumstanceItems, playersItem, ...structuralAssumptionItems)
        consulted.push(...structuralEntryItems)
    }

    // A reported tension with the qualifier of the ruling that set the primary Game Problem, where the data names a circumstance that bears on it.
    const qualifier = resolution.gameProblems.qualifier
    const tensions = qualifier ? wc.circumstances.filter((c) => c.qualifierTensionWhen !== undefined && supplied(c.key) === c.qualifierTensionWhen) : []
    const tensionText = tensions.length
        ? ` Reported tension, not acted on: under the test assumption ${tensions.map((c) => `${c.key} = ${String(c.qualifierTensionWhen)}`).join(' and ')}, the situation may fall outside the qualifier of the ruling that set the primary Game Problem ("${qualifier}"); ${tensions.map((c) => c.qualifierTensionNote ?? '').join(' ')}`
        : ''
    if (tensions.length && resolution.gameProblems.roleSetBy.length) {
        const rulingCite = resolution.gameProblems.roleSetBy[0]
        consulted.push(item(citeRef(rulingCite), sourceStanding(k, 'stage1Rulings'), `reported tension, not acted on: the test assumption may fall outside the ruling's qualifier ("${qualifier}"); consulted, not decisive`, rulingCite))
    }
    const appliesTo = [...new Set(circumstanceKeys.map((key) => scenario.decidingCircumstances[key]?.appliesTo ?? 'an area not stated'))].join('; ')

    if (basis === 'INVALID_GEOMETRY') {
        base.outcome = 'INVALID_TEST_INPUT'
        base.proposal = { ...base.proposal, status: 'NONE_INVALID_TEST_INPUT', statement: 'No proposal: a dimension of the configured area or the available space is not a positive number.', establishedBy: 'INSUFFICIENT EVIDENCE' }
        base.configuredWidthKept = null
        base.statement = `Invalid test input: the configured area (${scenario.configuredArea.lengthM} x ${scenario.configuredArea.widthM} m) and the available space (${scenario.availableSpace.lengthM} x ${scenario.availableSpace.widthM} m) must each have positive dimensions. Nothing is proposed or endorsed. The hypotheses are reported, but decide nothing here.`
        base.establishedBy = 'INSUFFICIENT EVIDENCE'
        missing.push({ kind: 'INVALID_TEST_INPUT', detail: base.statement, cites: [] })
    } else if (basis === 'CONFIGURED_AREA_EXCEEDS_AVAILABLE_SPACE') {
        base.outcome = 'CONFIGURED_AREA_EXCEEDS_AVAILABLE_SPACE'
        base.proposal = {
            ...base.proposal,
            status: 'NONE_CONFIGURED_AREA_EXCEEDS_AVAILABLE_SPACE',
            statement: `No proposal: the configured area (${scenario.configuredArea.lengthM} x ${scenario.configuredArea.widthM} m) already exceeds the coach's available space (${scenario.availableSpace.lengthM} x ${scenario.availableSpace.widthM} m). The configured area is not endorsed either: it lies outside the limits a proposal must stay within.`,
            establishedBy: 'LOGICAL INFERENCE',
        }
        base.configuredWidthKept = null
        base.statement = `The configured area (${scenario.configuredArea.lengthM} x ${scenario.configuredArea.widthM} m) already exceeds the coach's available space (${scenario.availableSpace.lengthM} x ${scenario.availableSpace.widthM} m): the comparison proposes nothing and does not endorse the configured area. The hypotheses are reported, but decide nothing here.`
        base.establishedBy = 'LOGICAL INFERENCE'
        missing.push({ kind: 'CONFIGURED_AREA_OUTSIDE_AVAILABLE_SPACE', detail: base.statement, cites: [] })
    } else if (basis === 'PRIMARY_INVITING_CONDITIONS_MET') {
        const background = listWords(hp.backgroundAssumptions.map((a) => a.id))
        if (room) {
            base.outcome = 'PRIMARY_INVITATION_CONDITIONS_MET'
            base.proposal = {
                ...base.proposal,
                status: 'OFFERED_TEST_ONLY',
                fromWidthM: scenario.configuredArea.widthM,
                toWidthM: scenario.availableSpace.widthM,
                lengthM: scenario.configuredArea.lengthM,
                statement: `Proposed configuration (test-only): widen the playing area ${fromTo}; length unchanged at ${scenario.configuredArea.lengthM} m. A test-only hypothesis that widening might invite the primary problem (${primaryId}), assuming ${background}, unverified; ${hs.entryId}'s deciding conditions are not met under the test assumptions; not empirically established; not eligible for production.`,
                establishedBy: 'TEST-ONLY HYPOTHESIS UNDER TEST ASSUMPTIONS',
            }
            base.configuredWidthKept = false
            base.structuralFacts.widened = widenedFacts
            base.statement = `${why} Test-only hypothesis (${hp.entryId}): widening ${fromTo} might invite the primary problem (${primaryId}), assuming ${background}, unverified. Offered as the proposed configuration on the review pathway only; not empirically established; not eligible for production.`
        } else {
            base.outcome = 'NO_ROOM_WITHIN_AVAILABLE_SPACE'
            base.proposal = {
                ...base.proposal,
                status: 'NO_ROOM_WITHIN_AVAILABLE_SPACE',
                statement: `No widening can be proposed: the coach's available width (${scenario.availableSpace.widthM} m) is no wider than the configured width (${scenario.configuredArea.widthM} m). The configured width is kept.`,
                establishedBy: 'LOGICAL INFERENCE',
            }
            base.statement = `${why} But no widening fits within the coach's available space, so nothing is proposed and the configured width (${scenario.configuredArea.widthM} m), which lies within the limits, is kept.`
        }
        base.establishedBy = 'TEST-ONLY HYPOTHESIS UNDER TEST ASSUMPTIONS'
    } else if (basis === 'SECONDARY_INVITING_CONDITIONS_MET') {
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
        base.statement = `${why} Test-only hypothesis (${hs.entryId}): widening might make exploitation (${secondaryId}, the secondary Game Problem's problem) the more immediate one, a way the manipulation could undermine the primary learning intention. The widening is not offered for the primary. The test assumptions describe ${appliesTo}; nothing is supplied about the configured area, so keeping the configured width is not shown to pose the primary problem either. The primary stays ${primaryId}, as resolved. The longer-term requirement that the dominant Game Problem respond to the interaction circumstances is cited, not implemented; the boundary statement is cited as reference knowledge only.`
        base.establishedBy = 'TEST-ONLY HYPOTHESIS UNDER TEST ASSUMPTIONS'
        consulted.push(entryItem(boundary, wc.boundaryRole))
        citedOnly.push(...referenceItems, ...longTermItems)
    } else {
        base.outcome = 'INSUFFICIENT_EVIDENCE'
        base.proposal = { ...base.proposal, status: 'NONE_INSUFFICIENT_EVIDENCE', statement: `No proposal. The configured width (${scenario.configuredArea.widthM} m) is kept.`, establishedBy: 'INSUFFICIENT EVIDENCE' }
        base.statement = `${why} Insufficient evidence for the pair (${hp.entryId}, ${hs.entryId}): no proposal, and the configured width (${scenario.configuredArea.widthM} m) is kept.`
        base.establishedBy = 'INSUFFICIENT EVIDENCE'
    }
    if (tensionText) base.statement += `${tensionText}${basis === 'SECONDARY_INVITING_CONDITIONS_MET' ? '' : ` The primary stays ${primaryId}, as resolved.`}`

    // Structural checks on every scenario: they report structural certainty and decide nothing (his D6 holds any rule that could exclude a design).
    const precedence = carMergePrecedence(k)
    const strongest = precedence.order[0]
    for (const check of wc.structuralChecks) {
        const entry = conditionOfUse(k, check.entryId)
        const requirement = entry.requirement ?? ''
        const essential = resolution.profile?.effectiveProfile.ratings[requirement as CarRequirement] === strongest
        const reqText = `${requirement}${essential ? ' (Essential in the effective profile)' : ''}`
        const decidesNothing = 'Reported as structurally certain; it decides nothing in this demonstration (his D6 holds any rule that could exclude a design until the rule-level source and status check).'
        if (teamSizes === 'A_TEAM_WITHOUT_PLAYERS') {
            base.structuralChecks.push({ entryId: entry.id, check: check.check, status: 'STRUCTURALLY_CERTAIN', detail: `A team has no players (${players.join(' v ')}): no competitor can influence the interaction, so ${reqText} cannot be met. ${decidesNothing}`, decidesNothing: true, establishedBy: 'LOGICAL INFERENCE' })
        } else if (teamSizes !== 'TWO_TEAMS_WITH_PLAYERS') {
            base.structuralChecks.push({ entryId: entry.id, check: check.check, status: 'UNCERTAINTY_REPORTED', detail: `The team sizes (${players.join(' v ')}) are not two teams of whole numbers: not evaluated.`, decidesNothing: true, establishedBy: 'INSUFFICIENT EVIDENCE' })
        } else if (check.check === 'NUMBERS' && !equalNumbers) {
            base.structuralChecks.push({ entryId: entry.id, check: check.check, status: 'UNCERTAINTY_REPORTED', detail: `Unequal numbers (${players.join(' v ')}): whether the outnumbered team can still rebalance, constrain or disrupt is not evaluable; no approved ratio exists.`, decidesNothing: true, establishedBy: 'INSUFFICIENT EVIDENCE' })
        } else {
            base.structuralChecks.push({
                entryId: entry.id,
                check: check.check,
                status: 'NOT_STRUCTURALLY_CERTAIN',
                detail:
                    check.check === 'AREA'
                        ? `Not structurally certain: both teams have players. This check reads team sizes only, not the area: no approved bound on area exists. ${base.proposal.status === 'OFFERED_TEST_ONLY' ? 'The offered widening carries this entry as a reported risk.' : 'No widening is offered.'}`
                        : `Equal numbers (${players.join(' v ')}): nothing to report.`,
                decidesNothing: true,
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
        base.conclusions.push({ id: `${scenario.id} ${check.entryId}`, step: 'width comparison', statement: `${scenario.id} ${check.entryId}: ${check.status}. ${check.detail}`, establishedBy: check.establishedBy, testOnly: true, trace: { influencedBy: [entryItem(conditionOfUse(k, check.entryId), 'structural check; decides nothing'), playersItem], consulted: [], citedOnly: [] } })
    }
    return base
}
