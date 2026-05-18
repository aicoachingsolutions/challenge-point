/**
 * Probabilistic phrasing helpers for the Ecological Integrity Review Layer.
 *
 * Christian's spec: "The review layer should avoid absolute judgments such as 'This is
 * ecological.' Instead use probabilistic and relational language such as 'This may reduce
 * timing variability.', 'This likely preserves opponent-driven adaptation.'"
 *
 * Every INTERPRETIVE finding sentence in the analyzers passes through one of these helpers.
 * Factual statements about what's present in the activity ("Rule 3 names a specific touch
 * count") can be stated plainly; the interpretation of that fact ("This may collapse decision
 * diversity") must use a probabilistic verb.
 */

// ─── Preservation / positive observations ───────────────────────────────────

export function likelyPreserves(property: string): string {
    return `This likely preserves ${property}.`
}

export function mayPreserve(property: string): string {
    return `This may preserve ${property}.`
}

export function appearsToInvite(behavior: string): string {
    return `This appears to invite ${behavior}.`
}

export function appearsToSupport(property: string): string {
    return `This appears to support ${property}.`
}

export function structureAppearsToOffer(option: string): string {
    return `The structure appears to offer ${option}.`
}

// ─── Removal / negative observations ────────────────────────────────────────

export function appearsToRemove(property: string): string {
    return `This appears to remove ${property}.`
}

export function appearsToLimit(dimension: string): string {
    return `This appears to limit ${dimension}.`
}

export function mayReduce(variable: string): string {
    return `This may reduce ${variable}.`
}

export function mayWeaken(property: string): string {
    return `This may weaken ${property}.`
}

// ─── Tradeoff observations ──────────────────────────────────────────────────

export function mayTradeOff(loss: string, forGain: string): string {
    return `This may trade off ${loss} for ${forGain}.`
}

export function mayIntroduceTension(between: string): string {
    return `This may introduce tension between ${between}.`
}

// ─── Drift-risk observations ────────────────────────────────────────────────

export function mayOverConstrain(dimension: string): string {
    return `This may over-constrain ${dimension}.`
}

export function mayCollapse(diversity: string): string {
    return `This may collapse ${diversity}.`
}

export function mayCreateRiskOf(condition: string): string {
    return `This may create risk of ${condition}.`
}

export function couldUnintentionallyReward(action: string): string {
    return `This could unintentionally reward ${action}.`
}

export function couldUnintentionallyScript(behavior: string): string {
    return `This could unintentionally script ${behavior}.`
}

// ─── Composite helpers (factual fragment + interpretive tail) ──────────────

/**
 * Combine a plainly-stated factual observation with a probabilistic interpretation. Useful
 * when the analyzer wants to anchor a finding in something concretely present in the text
 * before drawing an inference from it.
 *
 * Example:
 *   factThenInterpretation(
 *       "Rule 3 reads 'players must complete five passes before scoring.'",
 *       mayCollapse('decision diversity into satisfying the pass count')
 *   )
 *   → "Rule 3 reads 'players must complete five passes before scoring.' This may collapse
 *      decision diversity into satisfying the pass count."
 */
export function factThenInterpretation(factual: string, interpretation: string): string {
    const f = factual.trim()
    const i = interpretation.trim()
    if (!f) return i
    if (!i) return f
    return `${f.replace(/\.$/, '')}. ${i}`
}
