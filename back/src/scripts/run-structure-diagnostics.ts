/**
 * REPRESENTATIVE STRUCTURE DIAGNOSTICS — Christian's request, 31 Aug.
 *
 * His hypothesis: the selector asks "what is the single highest-scoring structure?" rather than
 * "which structures legitimately express this learning problem?", so a deterministic selector
 * converges whenever one archetype has even a modest advantage.
 *
 * Everything here is DETERMINISTIC — selection and package building run without the AI, so this
 * costs nothing and can be re-run on every change. Wording is deliberately ignored: structure is
 * read from the selected archetype, constraint package and affordance lenses, which is what the
 * activity is actually built around.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/scripts/run-structure-diagnostics.ts
 */
import { SessionEmphasis, SessionStatus, type ISession } from '../models/session.model'
import type { IActivity } from '../models/activity.model'
import { deriveInputConstraints } from '../system/input-constraints/deriveInputConstraints'
import { sessionPlanningModel } from '../system/session-planning/session-planning-model'
import { generateSelection, systemAssemblyInputFromTestLibrarySelection } from '../system/test-library'

interface Row {
    label: string
    archetype: string
    margin: number | null
    top: Array<{ name: string; score: number }>
    structure: string
    lenses: string
    constraints: string
}

function session(emphasis: SessionEmphasis): ISession {
    const n = new Date()
    return {
        _id: 'diag', createdBy: 'diag', name: 'diag', sessionStatus: SessionStatus['In Progress'],
        playerCount: 16, fieldLength: '40', fieldWidth: '30', fieldType: 'grass',
        sessionEmphasis: emphasis, createdAt: n, updatedAt: n,
    } as unknown as ISession
}

/** Every (Learning Goal, Practice Situation) pair the guided conversation can actually produce. */
function planningCases(): Array<{ label: string; text: string }> {
    const cases: Array<{ label: string; text: string }> = []
    for (const goal of sessionPlanningModel.learningGoals()) {
        const name = String(goal['Learning Goal'] ?? '')
        const definition = String(goal['Coach Definition'] ?? '')
        cases.push({ label: name, text: `${name}. ${definition}` })
        for (const situation of sessionPlanningModel.practiceSituationsFor(String(goal['ID']))) {
            const sName = String(situation['Practice Situation'] ?? '')
            cases.push({ label: `${name} / ${sName}`, text: `${name}. ${definition} ${sName}. ${situation['Definition'] ?? ''}` })
        }
    }
    return cases
}

function analyse(emphasis: SessionEmphasis): Row[] {
    return planningCases().map(({ label, text }) => {
        const ic = deriveInputConstraints(text)
        const sel = generateSelection({ learningGoals: [text], challengeLevel: 'intermediate' }, ic)
        const input = systemAssemblyInputFromTestLibrarySelection({
            selection: sel, session: session(emphasis), previousActivities: [] as IActivity[],
            coachInput: { challengeLevel: 'intermediate', duration: 20, learningGoals: [text] },
        })
        const trace = (sel as unknown as { selectionTrace?: { ranking?: { archetypes?: Array<Record<string, unknown>>; archetypeMargin?: number | null } } }).selectionTrace
        const ranked = (trace?.ranking?.archetypes ?? []).slice(0, 4).map((a) => ({
            name: String(a.title ?? a.name ?? a.id ?? '?'),
            score: Number(a.score ?? 0),
        }))
        const pkg = input.constraintPackage
        const constraints = [pkg.foundation, pkg.shaping, pkg.consequence]
            .map((c) => c?.constraint?.title ?? '-')
            .join(' + ')
        const lenses = sel.affordanceLenses.map((l) => l.title).join(' + ')
        return {
            label,
            archetype: sel.archetype.game_form_name,
            margin: trace?.ranking?.archetypeMargin ?? null,
            top: ranked,
            // THE STRUCTURE. What the activity is built around, independent of wording.
            structure: `${sel.archetype.game_form_name} | ${constraints}`,
            lenses,
            constraints,
        }
    })
}

function report(emphasis: SessionEmphasis) {
    const rows = analyse(emphasis)
    const n = rows.length
    console.log(`\n${'='.repeat(78)}\nEMPHASIS: ${emphasis}   (${n} planning cases)\n${'='.repeat(78)}`)

    // 1. ARCHETYPE DISTRIBUTION
    const arch = new Map<string, number>()
    for (const r of rows) arch.set(r.archetype, (arch.get(r.archetype) ?? 0) + 1)
    console.log('\n1. ARCHETYPE DISTRIBUTION')
    for (const [name, count] of [...arch.entries()].sort((a, b) => b[1] - a[1])) {
        console.log(`   ${String(Math.round((count / n) * 100)).padStart(3)}%  ${String(count).padStart(3)}  ${name}`)
    }

    // 2 + 5. STRUCTURE COUNT AND DIVERSITY INDEX
    const structures = new Map<string, number>()
    for (const r of rows) structures.set(r.structure, (structures.get(r.structure) ?? 0) + 1)
    console.log(`\n2. REPRESENTATIVE STRUCTURES: ${structures.size} distinct across ${n} cases`)
    for (const [s, count] of [...structures.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
        console.log(`   ${String(count).padStart(3)}x  ${s.slice(0, 96)}`)
    }
    console.log(`\n5. STRUCTURE DIVERSITY INDEX: ${(structures.size / n).toFixed(2)}  (unique structures / activities)`)

    // 3. STRUCTURAL SIMILARITY — how often two cases share the whole structure
    let same = 0, pairs = 0
    for (let i = 0; i < rows.length; i++) {
        for (let j = i + 1; j < rows.length; j++) {
            pairs++
            if (rows[i].structure === rows[j].structure) same++
        }
    }
    console.log(`3. STRUCTURAL SIMILARITY: ${((same / pairs) * 100).toFixed(0)}% of case pairs share an identical structure`)

    // 4. RUNNER-UP ANALYSIS
    console.log('\n4. ARCHETYPE RUNNER-UP ANALYSIS (is the winner dominating, or barely ahead?)')
    const margins = rows.map((r) => r.margin ?? 0)
    const ties = margins.filter((m) => m === 0).length
    const narrow = margins.filter((m) => m > 0 && m <= 2).length
    console.log(`   margin 0 (tie): ${ties}   margin 1-2 (narrow): ${narrow}   margin 3+: ${margins.filter((m) => m > 2).length}`)
    console.log(`   mean margin: ${(margins.reduce((a, b) => a + b, 0) / n).toFixed(2)}`)
    // THE NUMBER THAT DECIDES THE RECOMMENDATION: how many archetypes are legitimately in play?
    // If alternatives routinely sit within a point or two, the selector is discarding viable
    // structures by a hair rather than choosing a clearly better one.
    for (const within of [0, 1, 2]) {
        const counts = rows.map((r) => {
            const best = r.top[0]?.score ?? 0
            return r.top.filter((t) => best - t.score <= within).length
        })
        const withAlternatives = counts.filter((c) => c >= 2).length
        console.log(
            `   within ${within} point(s): mean ${(counts.reduce((a, b) => a + b, 0) / n).toFixed(2)} archetypes; ` +
                `${withAlternatives}/${n} cases (${Math.round((withAlternatives / n) * 100)}%) have a viable alternative`
        )
    }

    // What a coach actually experiences: within ONE goal all three activities share the selected
    // structure, so within-goal diversity is fixed at 1/3 no matter how contested the choice was.
    console.log('   WITHIN one goal: 1 structure across 3 activities (index 0.33) — the selector commits once.')

    console.log('\n   sample of contested cases (winner barely ahead):')
    rows.filter((r) => (r.margin ?? 9) <= 1).slice(0, 8).forEach((r) => {
        console.log(`     ${r.label.slice(0, 42).padEnd(44)} ${r.top.map((t) => `${t.name.split(' ')[0]}:${t.score}`).join('  ')}`)
    })
}

report(SessionEmphasis['Discovering Solutions'])
report(SessionEmphasis['Applying Solutions Under Pressure'])
