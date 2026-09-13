/**
 * WHAT WOULD CONTEXT-GATED SELECTION ACTUALLY REACH?
 *
 *   cd back && npx ts-node --files -r tsconfig-paths/register ./src/scripts/run-rpc-coverage.ts
 *
 * Read-only and deterministic: no AI, no selection change. Before Representative Performance Contexts
 * are allowed to steer the selector, this shows what they would steer it TOWARD, using only the
 * relationships that resolved to canonical ids:
 *
 *   1. each guided Learning Goal -> the contexts it reaches -> those contexts' compatible game forms;
 *   2. contexts no Learning Goal reaches (unreachable from guided planning);
 *   3. game forms no context is compatible with (unreachable once selection is context-gated);
 *   4. what is still unresolved, per context and library.
 *
 * The point is to put the consequences of each unresolved reference in front of the knowledge owner
 * as a decision, before code quietly encodes a gap as behaviour.
 */
import sessionPlanning from '../system/session-planning/session-planning-model.rc1.json'
import sportModule from '../system/sport-module/soccer-module.rc1-v3.json'
import { rpcLibrary, validateRpcLibraryIntegrity } from '../system/sport-module/rpc-library'

type Row = Record<string, unknown>

function main(): void {
    const integrity = validateRpcLibraryIntegrity()
    console.log(`Integrity: ${integrity.valid ? 'VALID' : `INVALID — ${integrity.errors.join(' | ')}`}`)
    console.log(`Runtime status: ${rpcLibrary.runtimeStatus}\n`)

    const goals = (sessionPlanning as unknown as { learning_goals: Row[] }).learning_goals
    const forms = (sportModule as unknown as { game_forms: Row[] }).game_forms
    const formName = new Map(forms.map((f) => [String(f['game_form_id']), String(f['game_form_name'])]))
    const contexts = rpcLibrary.contexts()
    const contextName = new Map(contexts.map((c) => [c.id, c.name]))

    console.log('1. GUIDED LEARNING GOAL -> CONTEXT -> COMPATIBLE GAME FORMS')
    const reachedContexts = new Set<string>()
    for (const goal of goals) {
        const id = String(goal['ID'])
        const links = rpcLibrary.contextsForLearningGoal(id)
        console.log(`\n  ${id.padEnd(5)} ${String(goal['Learning Goal'])}`)
        if (links.length === 0) {
            console.log('        -- reaches NO context')
            continue
        }
        for (const link of links) {
            reachedContexts.add(link.rpcId)
            const gf = rpcLibrary
                .gameFormsForContext(link.rpcId)
                .map((f) => `${formName.get(f.relatedId)} (${f.strength})`)
                .join(', ')
            console.log(`        ${link.strength.padEnd(9)} ${link.rpcId} ${contextName.get(link.rpcId)}  ->  ${gf || 'NO compatible game form'}`)
        }
    }

    console.log('\n2. CONTEXTS NO GUIDED LEARNING GOAL REACHES')
    for (const c of contexts) if (!reachedContexts.has(c.id)) console.log(`  ${c.id} ${c.name}`)

    console.log('\n3. GAME FORMS NO CONTEXT IS COMPATIBLE WITH')
    const compatible = new Set(contexts.flatMap((c) => rpcLibrary.gameFormsForContext(c.id).map((f) => f.relatedId)))
    for (const f of forms) {
        const id = String(f['game_form_id'])
        if (!compatible.has(id)) console.log(`  ${id.padEnd(5)} ${String(f['game_form_name'])}`)
    }

    console.log('\n4. STILL UNRESOLVED (context x library: candidates)')
    const byKey = new Map<string, string[]>()
    for (const row of rpcLibrary.unresolvedStaging()) {
        const key = `${String(row['rpc_id'])} ${contextName.get(String(row['rpc_id']))} x ${String(row['target_library'])}`
        byKey.set(key, [...(byKey.get(key) ?? []), `${String(row['candidate_name'])} (${String(row['intended_strength'])})`])
    }
    for (const [key, candidates] of [...byKey.entries()].sort()) {
        console.log(`  ${key}\n      ${candidates.join('; ')}`)
    }

    console.log('\n5. DEFERRED BY DECISION (reported, never reasoned from; does not block ACTIVE)')
    const deferredBy = new Map<string, number>()
    for (const row of rpcLibrary.deferredStaging()) {
        const key = `${String(row['rpc_id'])} ${contextName.get(String(row['rpc_id']))} x ${String(row['target_library'])}`
        deferredBy.set(key, (deferredBy.get(key) ?? 0) + 1)
    }
    for (const [key, count] of [...deferredBy.entries()].sort()) console.log(`  ${key}: ${count}`)
}

main()
