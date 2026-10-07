/**
 * Derivation engine — the real contract corpus as an input.
 *
 * The stage-B conformance work restated eight knowledge objects as contracts. This module adapts that
 * file into `DerivationInput` **without repairing any of it**: the only transformation is the field
 * name `id` → `itemId`, because the corpus predates the record names. Every defect the corpus carries
 * — the mojibake glyph, the unregistered attributes, the missing modifier operations — reaches the
 * engine intact and is refused there, which is the point.
 *
 * His rule, 22 September: "Do not repair knowledge merely to make implementation tests pass."
 *
 * The figures a run produces are asserted in the increment tests, so the numbers quoted in any report
 * are reproducible from the repository rather than from a script that no longer exists.
 */

import fs from 'node:fs'
import path from 'node:path'

import { ContractItem, DerivationInput, LoadedContract } from './types'
import { repairCorpusEncoding, RepairTally } from './corpus-repair'
import { applyNoRowRestatement, RestatementTally } from './corpus-restatement'

export const CONFORMANCE_DIR = path.resolve(__dirname, '../../../../docs/audits/conformance')

/** The BOM the register file carries; stripping it is a file-encoding concern, not a repair. */
export function readJson(file: string): any {
    return JSON.parse(fs.readFileSync(path.join(CONFORMANCE_DIR, file), 'utf8').replace(/^﻿/, ''))
}

export function loadRegister(): any {
    return readJson('register-2026-09-18.json')
}

/**
 * The envelope the stage-B derivations worked to. It is a session input, not knowledge: no contract
 * authors it, and SD-33 makes the session the authority for these four rows.
 */
/**
 * `roles` added 1 October on his ruling, and the wording of it matters: *"This is a session fact for
 * this run, not a default assumption that Challenge Point sessions contain no goalkeepers."*
 *
 * An explicit zero, not an omission — an absent entry means NOT STATED, so only a stated zero lets the
 * roster derive without implying that every available performer is an outfield player.
 */
function statedRoles(): Record<string, number> {
    // Keyed by whatever the register names as a specialized role, so no role name is written here.
    // Zero for each, which is a stated fact about this run rather than a default about sessions.
    const rows = (loadRegister().rows || []) as any[]
    return Object.fromEntries(rows.filter(r => r?.specializedRole).map(r => [String(r.path).split('.').pop() as string, 0]))
}

export const CORPUS_ENVELOPE = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: statedRoles() }

/**
 * The corpus names objects in prose, sometimes carrying the library code in brackets. Ids reach the
 * emitted line ids, so the rule is explicit and stable: a bracketed code, else a leading code token
 * carrying a digit, else the name slugged. It invents no knowledge — only a stable handle.
 */
function objectIdOf(name: string, index: number): string {
    const text = String(name || '').trim()
    const bracketed = text.match(/\(([A-Z][A-Z0-9-]*)\)/)
    if (bracketed) return bracketed[1]
    const leading = text.match(/^([A-Z][A-Z0-9-]*\d[A-Z0-9-]*)\b/)
    if (leading) return leading[1]
    const slug = text.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase()
    return slug || `OBJ-${index}`
}

/**
 * Repair phase A — **encoding only**. The original artefact is never modified; the repair is applied on
 * load and counted, so every run states how much of what it read was repaired. Restatement and new
 * authoring are not done here: they need a semantic decision that is his.
 */
export const repairTally: RepairTally = { strings: 0, charactersRecovered: 0 }

/** Restatement is counted separately from encoding repair: they are different kinds of change. */
export const restatementTally: RestatementTally = { applied: 0, withheld: [], itemsRestated: 0, itemsRemoved: 0, itemsAdded: 0, declarationScopes: 0, notFound: [] }

export function loadCorpusContracts(): LoadedContract[] {
    repairTally.strings = 0
    repairTally.charactersRecovered = 0
    const raw = repairCorpusEncoding(readJson('stage-b/contracts.json'), repairTally)
    const entries: any[] = Array.isArray(raw) ? raw : Object.values(raw)

    const adapted = entries.map((entry, index) => {
        const result = entry.result || {}
        const objectId = objectIdOf(entry.name, index)
        const items: ContractItem[] = (result.items || []).map((item: any) => {
            const { id, ...rest } = item
            return { itemId: String(id), ...rest } as ContractItem
        })

        return {
            contractId: `${entry.kind}:${objectId}`,
            objectId,
            knowledgeVersion: 'stage-b',
            items,
            declarations: result.declarations || [],
            relationshipRules: result.relationshipRules || [],
        }
    })

    // Phase A, second kind: the one restatement he has ruled. Applied after the encoding repair, because
    // one of the two unregistered spellings is an em dash that only exists once the encoding is restored.
    return applyNoRowRestatement(adapted, restatementTally)
}

/**
 * **The Sport Profile — constitutive sport structure, not selected knowledge.**
 *
 * Authorized by Christian on 6 October, after the bounded carrier sweep established that the ball is the only
 * sport-level carrier any currently selected game rule requires. The layer was named before it existed: the game
 * archetype workbook's own `Sport_Profile_Rule` says *"Detailed sport-specific logic is excluded and must inherit
 * through separate Sport Profile resources."*
 *
 * **Why it is loaded separately from the corpus rather than added to it.** `contracts.json` holds the eight
 * restated knowledge objects a goal SELECTS from, each frozen against the 81-row roster of its restatement. A
 * Sport Profile is selected by nobody — it is the environment every activity of this sport runs in — so it reaches
 * every derivation unconditionally. Putting it in the corpus file would make it look selectable and would put a
 * post-freeze contribution inside a frozen set.
 *
 * **It uses no new mechanism.** It is an ordinary contribution contract, and §6 already rules that shape for a
 * source outside the representation needing a structural property inside it: *"it enters as a `SELECTION` item
 * under its own contract (SD-17), with no separate route into the game or its language."* Its items are graded by
 * exactly the same rules as any other, which is the point — `OWNER_RULING` establishes an element because
 * `establishesExistence` admits it, not because this file is special.
 *
 * **The engine does not name the sport, and the discovery rule is the reason.** The profile is found by pattern in
 * the knowledge directory, so the sport's identity lives in the artefact — in its filename and its own `sportId`
 * field — and never in this sport-neutral module. Writing the filename here would have put a sport inside the
 * engine, which is the coupling the sport-coupling ratchet exists to catch; it did catch it, on the first run.
 *
 * Absence and plurality both raise rather than resolve quietly. A derivation with no sport is not a game, so an
 * empty directory must not hand back an empty list and let the ball disappear silently. Two profiles are a choice
 * of sport, and the engine is not entitled to make it by sort order.
 */
function sportProfileFiles(): string[] {
    const dir = path.join(CONFORMANCE_DIR, 'stage-b')
    const found = fs
        .readdirSync(dir)
        .filter(name => /^sport-profile-.+\.json$/.test(name))
        .sort()
    if (!found.length) throw new Error(`no Sport Profile in ${dir}: the sport a game is played in is constitutive, so there is nothing to derive`)
    if (found.length > 1) throw new Error(`${found.length} Sport Profiles in ${dir} (${found.join(', ')}): which sport a game is played in is a decision, not a sort order`)
    return found.map(name => `stage-b/${name}`)
}

export function loadSportProfile(): LoadedContract[] {
    return sportProfileFiles().map(file => {
        const result = readJson(file).result || {}
        return {
            contractId: String(result.object),
            objectId: String(result.object),
            knowledgeVersion: 'stage-b',
            items: (result.items || []).map((item: any) => {
                const { id, ...rest } = item
                return { itemId: String(id), ...rest } as ContractItem
            }),
            declarations: result.declarations || [],
            relationshipRules: result.relationshipRules || [],
        }
    })
}

export function corpusInput(): DerivationInput {
    const contracts = loadCorpusContracts()
    return {
        selection: contracts.map(c => ({ objectId: c.objectId, knowledgeVersion: 'stage-b' })),
        contracts,
        envelope: CORPUS_ENVELOPE,
        register: loadRegister(),
        derivationRules: { version: 'rev-5' },
    }
}
