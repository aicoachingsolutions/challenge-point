/**
 * Is a selected affordance lens traceable into the structural knowledge selected because of it?
 *
 * His refinement, and the reason this is not the earlier constraint-only measurement:
 *
 *   > *A selected affordance lens must have a traceable causal contribution to at least one selected
 *   > structural knowledge object capable of realizing the relationship/opportunity the lens was
 *   > intended to amplify* — **structural knowledge object**, not **constraint**, because a Game Form,
 *   > Practice Situation or Information Expression object may already establish the conditions.
 *
 * So every selected structural object is tested, not only the constraints.
 *
 * **The link is exact, not fuzzy.** All three libraries already speak one vocabulary of snake_case
 * affordance keys — a lens's `category` normalises to the same key a constraint writes in
 * `targetAffordancePrimary` and a game form writes in `primaryAffordances`. Nothing here interprets
 * prose, matches on substrings or scores similarity; a trace either exists in the data or it does
 * not, and where a link could only be asserted by reading a description this reports **undetermined**
 * rather than guessing. An affordance is not something the system should claim to manufacture, and
 * that applies to this measurement as much as to the representation.
 *
 * Run: npm run lens:trace
 */
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { deriveInputConstraints } from '../input-constraints/deriveInputConstraints'
import { TEST_LIBRARY_V0_AFFORDANCE_LENSES } from './affordanceLenses'
import { TEST_LIBRARY_V0_ARCHETYPES } from './archetypes'
import { TEST_LIBRARY_V0_CONSTRAINTS } from './constraints'
import { generateSelection } from './generateSelection'

/** `Break Lines` → `break_lines`; the key every library already writes. */
const key = (category: string): string => category.trim().toLowerCase().replace(/\s+/g, '_')

/** Every key the lens vocabulary can produce. A key outside it cannot be compared to a lens. */
const LENS_KEYS = new Set(TEST_LIBRARY_V0_AFFORDANCE_LENSES.map(l => key(l.category)))

const archetypeById = new Map(TEST_LIBRARY_V0_ARCHETYPES.map(a => [a.id, a]))
const constraintById = new Map(TEST_LIBRARY_V0_CONSTRAINTS.map(c => [c.id, c]))

type Verdict = 'REALIZED' | 'UNREALIZED' | 'UNDETERMINED'

interface Trace {
    goalId: string
    lensId: string
    lensTitle: string
    affordance: string
    /** Every selected structural object that traces to this lens, with the field that carries it. */
    realizedBy: { object: string; kind: string; via: string }[]
    /** Objects that could carry a trace and do not, so "unrealized" names what was actually checked. */
    checked: { object: string; kind: string; holds: string }[]
    /** Objects whose data cannot express a trace either way. */
    undeterminable: { object: string; kind: string; why: string }[]
    verdict: Verdict
}

function traceFor(goalId: string): Trace[] {
    const goal: any = sessionPlanningModel.learningGoal(goalId)
    const text = `${goal['Learning Goal']}. ${goal['Coach Definition']}`
    const selection: any = generateSelection({ learningGoals: [text], learningGoalId: goalId } as any, deriveInputConstraints(text))

    const lenses: any[] = selection.affordanceLenses ?? []
    const constraints: any[] = selection.constraints ?? []
    const archetype = selection.archetype ? archetypeById.get(selection.archetype.id) : undefined
    const situations = sessionPlanningModel.practiceSituationsFor(goalId) as any[]

    return lenses.map(lens => {
        const affordance = key(lens.category)
        const realizedBy: Trace['realizedBy'] = []
        const checked: Trace['checked'] = []
        const undeterminable: Trace['undeterminable'] = []

        // Game form — the object most likely to already establish the conditions, and the one the
        // earlier constraint-only measurement never looked at.
        if (archetype) {
            const holds = [...(archetype.primaryAffordances ?? []), ...(archetype.secondaryAffordances ?? [])]
            if (holds.includes(affordance)) realizedBy.push({ object: archetype.id, kind: 'game form', via: `primary/secondaryAffordances contains ${affordance}` })
            else checked.push({ object: archetype.id, kind: 'game form', holds: holds.join(', ') || 'none' })
        }

        for (const selected of constraints) {
            const constraint = constraintById.get(selected.id)
            if (!constraint) continue
            if (constraint.targetAffordancePrimary === affordance) realizedBy.push({ object: constraint.id, kind: 'constraint', via: `targetAffordancePrimary = ${affordance}` })
            else checked.push({ object: constraint.id, kind: 'constraint', holds: constraint.targetAffordancePrimary })
        }

        // Practice Situations carry ID, parent, order, name and a prose Definition — and nothing
        // else. There is no field in which a causal contribution to a lens could be recorded, so the
        // relationship cannot be determined either way without interpreting the Definition, which is
        // exactly what must not be done here.
        for (const situation of situations) {
            undeterminable.push({
                object: String(situation.ID),
                kind: 'practice situation',
                why: 'the Practice Situation record carries no affordance or design-intent field; only a prose Definition',
            })
        }

        // **Vocabulary drift makes a comparison unfounded, not false.** The three libraries do not
        // share one closed list: a game form may hold `fast_attack` or `regain`, which no lens
        // category produces. Reporting such a lens as *unrealized* would assert that `fast_attack`
        // is not `attack_quickly` — a semantic claim, and not one this measurement is entitled to
        // make in either direction. Where a selected object holds a key the lens vocabulary cannot
        // express at all, the relationship is undetermined.
        const drifted = [...checked, ...realizedBy.map(r => ({ ...r, holds: '' }))]
            .flatMap(c => ('holds' in c && c.holds ? c.holds.split(', ') : []))
            .filter(k => k && !LENS_KEYS.has(k))
        if (!realizedBy.length && drifted.length) {
            undeterminable.push({
                object: checked.map(c => c.object).join(', '),
                kind: 'vocabulary drift',
                why: `the selected objects hold ${[...new Set(drifted)].sort().join(', ')}, which no lens category produces — the two vocabularies are not comparable`,
            })
            return { goalId, lensId: lens.id, lensTitle: lens.title, affordance, realizedBy, checked, undeterminable, verdict: 'UNDETERMINED' as Verdict }
        }

        const verdict: Verdict = realizedBy.length ? 'REALIZED' : checked.length ? 'UNREALIZED' : 'UNDETERMINED'
        return { goalId, lensId: lens.id, lensTitle: lens.title, affordance, realizedBy, checked, undeterminable, verdict }
    })
}

const goals: any[] = (sessionPlanningModel.learningGoals() as any[]).filter(g => {
    const text = `${g['Learning Goal']}. ${g['Coach Definition']}`
    return typeof text === 'string' && text.trim().length > 0
})

const traces = goals.flatMap(g => traceFor(String(g.ID)))

console.log('AFFORDANCE LENS — CAUSAL TRACE INTO SELECTED STRUCTURAL KNOWLEDGE')
console.log('='.repeat(94))
console.log(`${traces.length} selected lenses across ${goals.length} learning goals.`)
console.log('Tested against every selected structural object, not only constraints.')
console.log('A trace exists in the data or it does not; no description is interpreted.\n')

const bucket = (v: Verdict) => traces.filter(t => t.verdict === v)
console.log(`  CAUSALLY REALIZED BY SELECTED STRUCTURAL KNOWLEDGE   ${bucket('REALIZED').length}`)
console.log(`  SELECTED BUT CAUSALLY UNREALIZED                     ${bucket('UNREALIZED').length}`)
console.log(`  CANNOT CURRENTLY BE DETERMINED                       ${bucket('UNDETERMINED').length}`)

console.log('\n\nWHAT REALIZED THEM — by the kind of object that carried the trace')
console.log('-'.repeat(94))
const viaKind = new Map<string, number>()
for (const t of bucket('REALIZED')) for (const r of t.realizedBy) viaKind.set(r.kind, (viaKind.get(r.kind) ?? 0) + 1)
for (const [kind, n] of [...viaKind].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${kind}`)
const gameFormOnly = bucket('REALIZED').filter(t => t.realizedBy.every(r => r.kind === 'game form'))
console.log(`\n  ${gameFormOnly.length} lens selection(s) are realized ONLY by the game form — invisible to the earlier`)
console.log('  constraint-only test, and the reason he asked for the broader one.')

console.log('\n\nSELECTED BUT CAUSALLY UNREALIZED')
console.log('-'.repeat(94))
for (const t of bucket('UNREALIZED')) {
    console.log(`  ${t.goalId.padEnd(6)} ${t.lensTitle.padEnd(34)} wants ${t.affordance}`)
    for (const c of t.checked) console.log(`         ${c.kind.padEnd(12)} ${c.object.padEnd(46)} holds ${c.holds}`)
}

console.log('\n\nCOVERAGE OF THE LINKING VOCABULARY ITSELF')
console.log('-'.repeat(94))
const wanted = [...new Set(traces.map(t => t.affordance))].sort()
const constraintCan = new Set(TEST_LIBRARY_V0_CONSTRAINTS.map(c => c.targetAffordancePrimary))
const formCan = new Set(TEST_LIBRARY_V0_ARCHETYPES.flatMap(a => [...(a.primaryAffordances ?? []), ...(a.secondaryAffordances ?? [])]))
console.log(`  ${'affordance a lens asks for'.padEnd(26)} any constraint  any game form`)
for (const affordance of wanted) {
    console.log(`  ${affordance.padEnd(26)} ${(constraintCan.has(affordance) ? 'yes' : 'NO ').padEnd(15)} ${formCan.has(affordance) ? 'yes' : 'NO'}`)
}
console.log('\n  An affordance no object in either library can name is one no selection could ever realize.')

console.log('\n\nCANNOT BE DETERMINED — the same reason every time')
console.log('-'.repeat(94))
const reasons = new Set(traces.flatMap(t => t.undeterminable.map(u => `${u.kind}: ${u.why}`)))
for (const r of reasons) console.log(`  ${r}`)
console.log(`\n  Practice Situations were checked for ${traces.length} lens selections and could not contribute`)
console.log('  evidence either way, because the record has no field in which such a contribution exists.')
