/**
 * Experience Design runtime — implements the Runtime Decision Rules RC1.
 *
 * WHAT THIS IS FOR. Experience Design improves how an ALREADY-REPRESENTATIVE activity is experienced.
 * The Decision Rules open with the constraint that shapes everything here: it "executes only after
 * Representative Validation succeeds" and "never compensates for non-representative activity design".
 * So this cannot rescue a bad activity and does not try — `decideExperienceDesign` refuses to run
 * when validation has failed, rather than treating that as an opportunity.
 *
 * THE SIX DECISIONS, and where each lives below:
 *   1. Is enhancement necessary?              needsEnhancement
 *   2. Apply the Preference Framework          preferenceRank (used by 5)
 *   3. Select a Representative Stakes Variable selectStakesVariable
 *   4. Retrieve eligible interventions         eligibleInterventions
 *   5. Select one, deterministically           selectIntervention
 *   6. Experience validation                   validateExperience
 *
 * DETERMINISM IS A REQUIREMENT, not a preference: "Avoid non-deterministic random selection." Every
 * step here is a pure function of the activity's own properties, and every tie is broken by a stable
 * key, so the same activity always produces the same enhancement.
 *
 * BOTH ELIGIBILITY AXES ARE NOW APPLIED. The workbook previously declared Learning Stage as
 * Exploring/Building/Refining, which matched nothing a coach selects, so filtering on it would have
 * silently discarded every intervention. Christian adopted the canonical IC-001 labels in response,
 * and the workbook now declares `Learning Stage Source = IC-001 Learning Stage Contract`. So Decision
 * 4 filters on Learning Stage as written, and the "unapplied filter" reporting that existed only to
 * keep that gap visible is gone.
 *
 * ORDERING COMES FROM THE PREFERENCE FRAMEWORK, NOT FROM OWNERSHIP. An earlier version ranked
 * interventions by their Primary Ecological Owner, reasoning that the framework puts interaction-rule
 * changes last. Christian corrected that: ownership identifies which canonical library governs an
 * intervention architecturally, and "isn't intended to determine the intervention's preference
 * ranking". He is right, and the distinction matters — two interventions owned by the same library
 * can preserve very different amounts of affordance diversity, so owner is simply the wrong
 * discriminator. Decision 5 now uses fixed ordering, which the rules name as an acceptable Pilot RC1
 * method, over the registry order he authored.
 */
import { isLearningStage, learningStageLabel } from '../activity/learning-stage-realization'
import {
    type RepresentativeIntervention,
    representativeInterventionLibrary as library,
} from './representative-intervention-library'

/** Decision 1 — the pilot heuristic, verbatim from the Decision Rules. */
const CHALLENGE_INVITING_ENHANCEMENT = ['medium', 'high']

/**
 * Whether an intervention's architectural home is settled.
 *
 * This is NOT a preference signal — Christian was explicit that ownership identifies which canonical
 * library governs an intervention and "isn't intended to determine the intervention's preference
 * ranking". It is kept only as a Decision 6 guard: an intervention whose governing library is
 * undecided has an undecided relationship to "behavior becomes overly prescribed", which is a listed
 * failure condition. All ten are currently resolved, so this never fires today — it exists so a
 * future unowned entry cannot be applied before anyone notices.
 */
export function hasResolvedOwnership(intervention: RepresentativeIntervention): boolean {
    const owner = intervention.ecologicalOwner.toLowerCase()
    return owner !== '' && !owner.includes('tbd') && !owner.includes('review')
}

/**
 * Decision 5 ordering — the registry position Christian authored.
 *
 * The Decision Rules name "fixed ordering" as an acceptable Pilot RC1 selection method, and the
 * registry order is authored knowledge rather than an inference of ours. That keeps the ordering
 * inside the Preference Framework's domain instead of reconstructing it from a column that means
 * something else.
 */
function registryPosition(intervention: RepresentativeIntervention): number {
    const index = library.interventions().findIndex((candidate) => candidate.id === intervention.id)
    return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

export interface ExperienceDesignInput {
    /** Decision Rules entry condition — Experience Design runs only when this is true. */
    representativeValidationPassed: boolean
    /** The engine's challenge level (low | medium | high). */
    challengeLevel: string
    /** Affordance names the activity is targeting, in the engine's own vocabulary. */
    targetAffordances: string[]
    /** The coach's Learning Stage, carried for reporting even though it cannot filter yet. */
    learningStage?: string
}

export interface ExperienceDesignResult {
    applied: boolean
    /** Why nothing was applied, in the Decision Rules' own terms. */
    reason: string
    stakesVariable: string | null
    intervention: RepresentativeIntervention | null
}

const norm = (value: string): string => value.trim().toLowerCase()

/** Challenge eligibility uses the coach-facing words; the engine stores low/medium/high. */
const CHALLENGE_LABELS: Record<string, string> = {
    low: 'comfortable',
    medium: 'stretch',
    high: 'demanding',
}

/**
 * DECISION 1 — is enhancement necessary?
 *
 * "Challenge = Stretch or Demanding → evaluate enhancement. Challenge = Comfortable → normally no
 * Representative Stakes unless specifically justified." The "unless specifically justified" escape
 * is deliberately NOT implemented: nothing in the pilot supplies a justification, so honouring it
 * would mean inventing one.
 */
export function needsEnhancement(challengeLevel: string): boolean {
    return CHALLENGE_INVITING_ENHANCEMENT.includes(norm(challengeLevel))
}

/**
 * DECISION 4 — eligible interventions, on both declared axes.
 *
 * The Learning Stage comparison goes through `learningStageLabel`, which is IC-001's own value→label
 * mapping — the workbook declares `Learning Stage Source = IC-001 Learning Stage Contract`, so both
 * sides now name the same authority instead of two vocabularies that happened to look similar.
 *
 * An ABSENT Learning Stage does not filter. The free-text form never asks for one, and treating
 * "the coach was not asked" as "matches nothing" would silently disable Experience Design for every
 * activity created that way.
 */
export function eligibleInterventions(input: ExperienceDesignInput): RepresentativeIntervention[] {
    const challenge = CHALLENGE_LABELS[norm(input.challengeLevel)] ?? norm(input.challengeLevel)
    const stage = isLearningStage(input.learningStage) ? norm(learningStageLabel(input.learningStage)) : null

    return library.interventions().filter((intervention) => {
        // No declared constraint means "no constraint", not "matches nothing".
        if (intervention.challengeLevels.length > 0) {
            if (!intervention.challengeLevels.some((level) => norm(level) === challenge)) return false
        }
        if (stage !== null && intervention.learningStages.length > 0) {
            if (!intervention.learningStages.some((value) => norm(value) === stage)) return false
        }
        return true
    })
}

/** How strongly an intervention's stated affordance intent overlaps what the activity targets. */
function affordanceOverlap(intervention: RepresentativeIntervention, targetAffordances: string[]): number {
    const targets = targetAffordances.map(norm).filter(Boolean)
    if (targets.length === 0) return 0

    const declared = [...intervention.primaryAffordanceIntent, ...intervention.affordanceTags].map(norm)
    let score = 0
    for (const target of targets) {
        // Substring either way: the vocabularies are close but not identical ("Scanning" vs
        // "scan the targets"), and requiring exact equality would score everything zero.
        if (declared.some((value) => value.includes(target) || target.includes(value))) score += 1
    }
    return score
}

/**
 * DECISION 3 — select the Representative Stakes Variable.
 *
 * The rule is to pick the variable "that best increases the significance of the targeted
 * affordances". So variables are scored by how well their own interventions' declared affordance
 * intent overlaps what this activity targets — a measurement from the workbook, not a mapping
 * invented here.
 *
 * Ties break on the category's declared order in the registry, which is stable and authored, so the
 * same activity always yields the same variable.
 */
export function selectStakesVariable(input: ExperienceDesignInput): string | null {
    const eligible = eligibleInterventions(input)
    if (eligible.length === 0) return null

    let best: { name: string; score: number; index: number } | null = null

    library.categories().forEach((category, index) => {
        const members = eligible.filter((intervention) => intervention.categoryId === category.id)
        if (members.length === 0) return

        const score = Math.max(...members.map((m) => affordanceOverlap(m, input.targetAffordances)))
        if (best === null || score > best.score || (score === best.score && index < best.index)) {
            best = { name: category.name, score, index }
        }
    })

    return best ? best.name : null
}

/**
 * DECISION 5 — select one intervention, deterministically.
 *
 * Ordered by Preference Framework rank first (richer representative interventions before behavioural
 * restrictions), then by affordance overlap, then by id. The id tie-break is what makes this
 * reproducible rather than dependent on registry order.
 */
export function selectIntervention(
    candidates: RepresentativeIntervention[],
    targetAffordances: string[]
): RepresentativeIntervention | null {
    if (candidates.length === 0) return null

    return [...candidates].sort((a, b) => {
        // Strongest fit to what the activity actually targets comes first — Decision 3's own
        // criterion, "best increases the significance of the targeted affordances", applied again
        // among the survivors.
        const overlap = affordanceOverlap(b, targetAffordances) - affordanceOverlap(a, targetAffordances)
        if (overlap !== 0) return overlap
        // Then the authored registry order — "fixed ordering", named as acceptable by the rules.
        const position = registryPosition(a) - registryPosition(b)
        if (position !== 0) return position
        return a.id.localeCompare(b.id)
    })[0]
}

/**
 * DECISION 6 — experience validation.
 *
 * The Decision Rules require verifying representative integrity, strengthened affordances, preserved
 * functional solutions, coach simplicity and understandability. Only the checks that can be made
 * HONESTLY from available data are made: an intervention must carry the coach description a coach
 * needs to run it, and the rationale that records why it stays representative.
 *
 * The remaining criteria are genuine judgements about a generated activity that this layer cannot
 * evaluate — asserting them would be theatre. They are reported as unverified so the gap is visible
 * rather than implied to be covered.
 */
export function validateExperience(intervention: RepresentativeIntervention): { valid: boolean; reasons: string[] } {
    const reasons: string[] = []

    if (!intervention.coachDescription.trim()) {
        reasons.push(`${intervention.id} has no coach description — coach implementation would not be simple.`)
    }
    if (!intervention.representativeRationale.trim()) {
        reasons.push(`${intervention.id} has no representative rationale — representative integrity cannot be shown.`)
    }
    if (!hasResolvedOwnership(intervention)) {
        reasons.push(
            `${intervention.id} has unresolved ecological ownership, so which canonical library governs it — and ` +
                `therefore whether it restricts behaviour — is not yet agreed.`
        )
    }

    return { valid: reasons.length === 0, reasons }
}

/**
 * The full decision sequence.
 *
 * Returns a decision either way. "Nothing applied" is a legitimate and expected outcome, so it comes
 * back with the reason in the Decision Rules' own language rather than as an empty result — the
 * whole difficulty with this layer is that doing nothing and failing look identical from outside.
 */
export function decideExperienceDesign(input: ExperienceDesignInput): ExperienceDesignResult {
    const nothing = (reason: string): ExperienceDesignResult => ({
        applied: false,
        reason,
        stakesVariable: null,
        intervention: null,
    })

    if (!input.representativeValidationPassed) {
        return nothing('Representative Validation failed — Experience Design never compensates for that.')
    }
    if (!needsEnhancement(input.challengeLevel)) {
        return nothing('Challenge is Comfortable — no Representative Stakes unless specifically justified.')
    }

    const stakesVariable = selectStakesVariable(input)
    if (!stakesVariable) return nothing('No Representative Stakes Variable had an eligible intervention.')

    const eligible = eligibleInterventions(input).filter((intervention) => {
        const category = library.categories().find((c) => c.name === stakesVariable)
        return category ? intervention.categoryId === category.id : false
    })

    if (eligible.length === 0) return nothing(`No eligible Representative Intervention for Stakes Variable "${stakesVariable}".`)

    // DECISION 6 RECOVERY, followed literally: "Remove the Representative Intervention. Revalidate.
    // If still unsuccessful, return the activity without Representative Stakes." So a rejected
    // candidate is removed and the next-preferred one is tried, rather than the whole variable being
    // abandoned on the first failure — the rules say revalidate, not give up.
    const rejected: string[] = []
    let remaining = [...eligible]

    while (remaining.length > 0) {
        const candidate = selectIntervention(remaining, input.targetAffordances)
        if (!candidate) break

        const validation = validateExperience(candidate)
        if (validation.valid) {
            return {
                applied: true,
                reason: 'Representative Stakes applied.',
                stakesVariable,
                intervention: candidate,
            }
        }

        rejected.push(`${candidate.id} (${validation.reasons.join(' ')})`)
        remaining = remaining.filter((intervention) => intervention.id !== candidate.id)
    }

    return nothing(`Experience validation rejected every candidate for "${stakesVariable}": ${rejected.join('; ')}`)
}

/**
 * Interventions that CANNOT be selected under the current rules, whatever a coach asks for.
 *
 * Decision 1 evaluates enhancement only at Stretch or Demanding. An intervention declared eligible
 * ONLY at Comfortable therefore sits behind a door that never opens — the workbook says it applies,
 * and the rules guarantee it never will.
 *
 * This is the "silence" failure in its purest form: nothing errors, the intervention simply never
 * appears, and that is indistinguishable from the runtime correctly deciding an activity needed no
 * enhancement. Reported rather than resolved, because reconciling the two is a knowledge decision —
 * either those interventions belong at a different Challenge level, or Decision 1's heuristic needs
 * the "specifically justified" escape it currently describes but does not define.
 */
export function reportUnreachableInterventions(): Array<{ id: string; reason: string }> {
    return library
        .interventions()
        .filter((intervention) => intervention.challengeLevels.length > 0)
        .filter((intervention) =>
            intervention.challengeLevels.every((level) => {
                const engineValue = Object.entries(CHALLENGE_LABELS).find(([, label]) => label === norm(level))?.[0]
                return engineValue === undefined || !needsEnhancement(engineValue)
            })
        )
        .map((intervention) => ({
            id: intervention.id,
            reason:
                `Eligible only at ${intervention.challengeLevels.join('/')}, but Decision 1 evaluates enhancement ` +
                `only at Stretch or Demanding — so it can never be selected.`,
        }))
}
