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
 * ONE THING IT CANNOT DO YET. Decision 4 says to retrieve interventions by "Learning Stage
 * compatibility", but the workbook's stage vocabulary (Exploring/Building/Refining) does not match
 * the stages a coach actually selects (First Time Exploring/Building Understanding/Reinforcing &
 * Refining), and no single rule bridges them. Filtering on a guessed mapping would silently discard
 * every intervention, so Learning Stage is deliberately NOT used as a filter and the omission is
 * reported on the result. Challenge compatibility, whose vocabulary does match, is applied.
 */
import {
    type RepresentativeIntervention,
    representativeInterventionLibrary as library,
} from './representative-intervention-library'

/** Decision 1 — the pilot heuristic, verbatim from the Decision Rules. */
const CHALLENGE_INVITING_ENHANCEMENT = ['medium', 'high']

/**
 * Decision 2 / 5 — the Representative Design Preference Framework, expressed as a rank.
 *
 * The framework orders enhancement from richest to poorest: enrich performer affordances, then the
 * environment, then information, then stakes, and modify interaction RULES last, "because they often
 * reduce affordance diversity". The workbook already records which canonical library owns each
 * intervention's mechanism, so the rank is derived from that column rather than from a judgement
 * written here — "preserve before restrict" becomes a lookup rather than an opinion.
 *
 * Lower is preferred.
 */
const PREFERENCE_RANK: Record<string, number> = {
    'environmental manipulation': 2,
    'information expression': 3,
    'interaction regulation': 5,
}

/** Anything unowned or still under review ranks last — see preferenceRank. */
const UNRANKED = 99

/**
 * Preference rank for an intervention.
 *
 * An owner marked "(review)" or "TBD" cannot be ranked honestly, so it sorts LAST rather than being
 * guessed into a tier. That is the conservative direction: an intervention whose mechanism is not
 * yet agreed should not be preferred over one whose is.
 */
export function preferenceRank(intervention: RepresentativeIntervention): number {
    const owner = intervention.ecologicalOwner.toLowerCase()
    if (!owner || owner.includes('tbd') || owner.includes('review')) return UNRANKED
    return PREFERENCE_RANK[owner] ?? UNRANKED
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
    /** Constraints the runtime could NOT apply, so a silent non-match is never mistaken for a decision. */
    unappliedFilters: string[]
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
 * DECISION 4 — eligible interventions.
 *
 * Challenge compatibility is applied. Learning Stage is not, for the reason in the module header;
 * the caller receives that omission rather than a quietly narrower result.
 */
export function eligibleInterventions(input: ExperienceDesignInput): RepresentativeIntervention[] {
    const challenge = CHALLENGE_LABELS[norm(input.challengeLevel)] ?? norm(input.challengeLevel)

    return library.interventions().filter((intervention) => {
        // No declared constraint means "no constraint", not "matches nothing".
        if (intervention.challengeLevels.length === 0) return true
        return intervention.challengeLevels.some((level) => norm(level) === challenge)
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
        const rank = preferenceRank(a) - preferenceRank(b)
        if (rank !== 0) return rank
        const overlap = affordanceOverlap(b, targetAffordances) - affordanceOverlap(a, targetAffordances)
        if (overlap !== 0) return overlap
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
    if (preferenceRank(intervention) === UNRANKED) {
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
    const unappliedFilters = [
        // See the module header. Reported on every result so it cannot be forgotten while it stands.
        'Learning Stage compatibility (Decision 4) — workbook and coach-facing stage vocabularies do not match.',
    ]
    const nothing = (reason: string): ExperienceDesignResult => ({
        applied: false,
        reason,
        stakesVariable: null,
        intervention: null,
        unappliedFilters,
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
                unappliedFilters,
            }
        }

        rejected.push(`${candidate.id} (${validation.reasons.join(' ')})`)
        remaining = remaining.filter((intervention) => intervention.id !== candidate.id)
    }

    return nothing(`Experience validation rejected every candidate for "${stakesVariable}": ${rejected.join('; ')}`)
}
