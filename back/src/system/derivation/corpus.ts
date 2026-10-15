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
import { AUDITS_DIR } from './knowledge-root'

export const CONFORMANCE_DIR = path.join(AUDITS_DIR, 'conformance')

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
export const restatementTally: RestatementTally = { applied: 0, withheld: [], itemsRestated: 0, itemsRemoved: 0, itemsAdded: 0, declarationScopes: 0, declarationsRestated: 0, declarationsAdded: 0, declarationsAddedOnDeclaredRows: 0, notFound: [] }

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

/**
 * **Provisional realizations — his provisional choices for one goal's activity, built like knowledge and never mistaken
 * for it.** Added 15 October 2026 (stage K2).
 *
 * Christian, reply filed 17 October 2026: *"The priority remains producing one complete, representative Play Out from the
 * Back activity through the normal generation pathway, without introducing unnecessary architecture or treating this first
 * realization as the canonical version of the Learning Goal."* His 16 October item 10 keeps the categories apart:
 * *"Provisional realization choices for the first activity. … Please keep those categories distinct."*
 *
 * **Why a contract and why not an existing home.** The engine can only build what reaches it as contract items, so a
 * choice that is to shape the game must be one; the Sport Profile is the precedent (SD-17), and no new mechanism grades
 * these items. But the existing homes each say the wrong thing: in `contracts.json` or a restatement the choice would be
 * canonical knowledge of the context for every activity; a realization-choices file cannot create structure (SD-16);
 * and the authorization record holds no values. So the items live in their own file, and three things keep them apart:
 *
 *   - **they join only where a record names them** (`derivationInputFor` reads `provisionalRealization` from the
 *     selected goal's record; nothing else selects them, and no goal is named in code);
 *   - **every item carries `category: PROVISIONAL_REALIZATION_CHOICE`**, which the resolved game copies onto each support
 *     entry the item gives (`resolved-game.ts`) and the fixture carries whole — the grading alone (OWNER_RULING) could
 *     not tell his choice for one activity from canonical knowledge;
 *   - **the loader refuses the WHOLE file** on any item without his words, without basis OWNER_RULING, without the
 *     category, colliding with a canonical item id, or naming a designation the file refuses (his D7: *"Please use the
 *     assigned team roles rather than referring generically to "the defending team,""*), and on ANY declaration. A
 *     provisional choice says what this activity does; a declaration says what knowledge does not constrain, and his M6
 *     admits an added non-claim only where it *"provably cannot contradict existing knowledge"* — so none enters here.
 *
 * Refused at load rather than per contract, because a malformed realization would silently decide what one goal's coach
 * is served, which is the authorization records' reason too (`learning-goal-authorizations.ts`). Returned as deep copies.
 */
export const PROVISIONAL_REALIZATION_CHOICE = 'PROVISIONAL_REALIZATION_CHOICE'
export const PROVISIONAL_REALIZATIONS_FILE = 'stage-b/provisional-realizations.json'

/** A practice situation a realization was not designed for, with why: the combination is refused, not built. */
export interface NotWithPracticeSituation {
    id: string
    basis: string
    because: string
}

/** A provisional realization as derivation receives it: a contribution contract, with what makes it provisional beside it. */
export interface ProvisionalRealization extends LoadedContract {
    provisionalId: string
    category: typeof PROVISIONAL_REALIZATION_CHOICE
    /** The context it realizes for one activity, and is never canonical knowledge of. */
    realizes: string
    ruledOn: string
    by: string
    citedAs: string
    words: string[]
    /** The realization-choices file (under docs/audits) whose declared entries replace the game form's, or null. */
    realizationChoices: string | null
    notWithPracticeSituations: NotWithPracticeSituation[]
}

const filledText = (value: unknown): boolean => typeof value === 'string' && value.trim().length > 0

/** The designation tokens a selector or value names: each run of upper-case letters, digits and underscores. */
const tokensOf = (value: unknown): string[] => (JSON.stringify(value ?? null).match(/[A-Z][A-Z0-9_]*/g) ?? [])

/**
 * Everything wrong with a provisional-realizations file, as sentences. Empty means it may be loaded. The lists it is
 * checked against are parameters so a test can hand it a damaged copy; production passes the corpus, the Sport Profile,
 * the register and the audits directory.
 */
export function validateProvisionalRealizations(
    file: any,
    canonicalItemIds: Set<string> = new Set([...loadCorpusContracts(), ...loadSportProfile()].flatMap(c => c.items.map(item => item.itemId))),
    designationNames: Set<string> = new Set(((loadRegister().teamDesignations?.list ?? []) as string[]).map(entry => String(entry).trim().split(/\s/)[0])),
    choicesFileExists: (name: string) => boolean = name => fs.existsSync(path.join(AUDITS_DIR, name)),
): string[] {
    const errors: string[] = []
    if (!file || typeof file !== 'object' || !filledText(file.about)) errors.push('the file says nothing about what it is (about)')
    const refused = file?.refusedDesignations
    const refusedList: string[] = Array.isArray(refused?.designations) ? refused.designations.map(String) : []
    if (!refusedList.length || !filledText(refused?.words) || !filledText(refused?.citedAs)) errors.push('the refused designations must be listed with his words and where he said them')
    for (const name of refusedList) if (!designationNames.has(name)) errors.push(`the refused designation ${name} is not one the register defines`)
    const realizations: any[] = Array.isArray(file?.realizations) ? file.realizations : []
    if (!realizations.length) errors.push('the file holds no realization')
    const seen = new Set<string>()
    for (const [i, realization] of realizations.entries()) {
        const id = String(realization?.id ?? '')
        const which = `realization ${id || i + 1}`
        if (!filledText(realization?.id)) errors.push(`realization ${i + 1} has no id`)
        if (seen.has(id)) errors.push(`${which} is defined twice`)
        seen.add(id)
        if (realization?.contractId !== `provisional:${id}`) errors.push(`${which}: its contract id must be provisional:${id}`)
        if (realization?.category !== PROVISIONAL_REALIZATION_CHOICE) errors.push(`${which} is not labelled ${PROVISIONAL_REALIZATION_CHOICE}`)
        if (!filledText(realization?.realizes)) errors.push(`${which} names no context it realizes`)
        if (!filledText(realization?.ruledOn) || !filledText(realization?.by) || !filledText(realization?.citedAs)) errors.push(`${which} cites no ruling (ruledOn, by and citedAs are all required)`)
        if (!Array.isArray(realization?.words) || !realization.words.length || !realization.words.every(filledText)) errors.push(`${which} quotes none of his words`)
        if (realization?.realizationChoices !== null && realization?.realizationChoices !== undefined) {
            if (!filledText(realization.realizationChoices) || !choicesFileExists(String(realization.realizationChoices))) errors.push(`${which} names realization choices that do not exist: ${realization.realizationChoices}`)
        }
        for (const [j, situation] of (Array.isArray(realization?.notWithPracticeSituations) ? realization.notWithPracticeSituations : [null]).entries()) {
            if (situation === null) {
                errors.push(`${which} lists no practice situations it was not designed for (an empty list says it was designed for all)`)
                continue
            }
            if (!filledText(situation?.id) || !filledText(situation?.because) || !filledText(situation?.basis)) errors.push(`${which}: practice situation ${j + 1} must say which, why and on what basis`)
        }
        if (!Array.isArray(realization?.declarations) || realization.declarations.length) errors.push(`${which} holds a declaration; a provisional realization says what its activity does, never what knowledge does not constrain`)
        if (!Array.isArray(realization?.relationshipRules) || realization.relationshipRules.length) errors.push(`${which} holds a relationship rule, which no provisional realization has a reading for`)
        const items: any[] = Array.isArray(realization?.items) ? realization.items : []
        if (!Array.isArray(realization?.items)) errors.push(`${which} lists no items (an empty list says it holds none)`)
        for (const item of items) {
            const itemId = String(item?.id ?? '')
            const at = `${which} item ${itemId || '(no id)'}`
            if (!filledText(item?.id) || !itemId.startsWith(`${id}-`)) errors.push(`${at}: an item's id must begin ${id}-`)
            if (canonicalItemIds.has(itemId)) errors.push(`${at} collides with a canonical item id`)
            if (item?.basis !== 'OWNER_RULING') errors.push(`${at} is not OWNER_RULING: a provisional realization holds only his choices`)
            if (item?.category !== PROVISIONAL_REALIZATION_CHOICE) errors.push(`${at} is not labelled ${PROVISIONAL_REALIZATION_CHOICE}`)
            if (!filledText(item?.words) || !filledText(item?.citedAs)) errors.push(`${at} does not quote him (words and citedAs are required)`)
            if (!filledText(item?.choice)) errors.push(`${at} does not say what the choice is (choice)`)
            if (!item?.basisEvidence) errors.push(`${at} carries no basis evidence`)
            const named = [...tokensOf(item?.selector), ...tokensOf(item?.value)].filter(token => refusedList.includes(token))
            if (named.length) errors.push(`${at} names ${[...new Set(named)].join(', ')}, which a provisional realization may not use (his D7)`)
        }
    }
    return errors
}

/**
 * Every provisional realization, validated and as deep copies. `file` is a parameter ONLY so a test can load a copy
 * carrying a TEST-ONLY item through the same gate; production passes none.
 */
export function loadProvisionalRealizations(file: any = readJson(PROVISIONAL_REALIZATIONS_FILE)): ProvisionalRealization[] {
    const errors = validateProvisionalRealizations(file)
    if (errors.length) throw new Error(`${PROVISIONAL_REALIZATIONS_FILE} failed its integrity gate: ${errors.join(' | ')}`)
    const copy = JSON.parse(JSON.stringify(file))
    return (copy.realizations as any[]).map(realization => ({
        contractId: String(realization.contractId),
        objectId: String(realization.contractId),
        knowledgeVersion: 'stage-b',
        items: (realization.items as any[]).map(item => {
            const { id, ...rest } = item
            return { itemId: String(id), ...rest } as ContractItem
        }),
        declarations: [],
        relationshipRules: [],
        provisionalId: String(realization.id),
        category: PROVISIONAL_REALIZATION_CHOICE,
        realizes: String(realization.realizes),
        ruledOn: String(realization.ruledOn),
        by: String(realization.by),
        citedAs: String(realization.citedAs),
        words: (realization.words as unknown[]).map(String),
        realizationChoices: realization.realizationChoices ? String(realization.realizationChoices) : null,
        notWithPracticeSituations: (realization.notWithPracticeSituations as any[]).map(s => ({ id: String(s.id), basis: String(s.basis), because: String(s.because) })),
    }))
}

/** The provisional realization a record names, as a copy, or null where it names none. A name that resolves to nothing throws. */
export function provisionalRealizationNamed(id: string | null | undefined, realizations: ProvisionalRealization[] = loadProvisionalRealizations()): ProvisionalRealization | null {
    if (!id) return null
    const found = realizations.find(realization => realization.provisionalId === id)
    if (!found) throw new Error(`a record names the provisional realization ${id}, which ${PROVISIONAL_REALIZATIONS_FILE} does not hold`)
    return JSON.parse(JSON.stringify(found)) as ProvisionalRealization
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
