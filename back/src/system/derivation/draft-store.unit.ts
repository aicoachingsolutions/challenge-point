/**
 * The TEST-ONLY draft store (B2, 28 October 2026; E1-lite) — its gate, the record gate's inverted requirement for a DRAFT record, and the
 * static fact that no production module imports it.
 *
 * Christian, his reply filed 30 October 2026: *"The draft-knowledge separation, specialized restart precedence, and other necessary structural
 * safeguards are appropriate general improvements. However, I don't want them to become another extended development cycle disconnected from
 * the composition test."*
 *
 * What is pinned:
 *   - the real store (`docs/audits/drafts/ta02-composition/`) passes the gate: the files it reads, the files it does not read with why, the
 *     drafted contract stamped (knowledge version `draft`, every item and declaration DRAFT_KNOWLEDGE) and the drafted record stamped DRAFT
 *     and citing no ruling; RPC-003-04.a, withdrawn on his reply filed 30 October 2026, item 6, is not loaded;
 *   - on TEST-ONLY copies, each refusal the gate names, each refusing the WHOLE store: a quotation not verbatim in the row it cites (in a
 *     source or in basisEvidence, short or curly-quoted, its ellipsis parts in order), a file or row the workbooks do not hold, an item
 *     claiming his words without sources, an ASSUMED item citing no row that names no citable standing decision, an item without our
 *     reasoning, a key only a ruled restatement writes, an id production uses, a standing other than DRAFT, an object with a production
 *     contract, a drafted context whose primary scoring condition no constituting item cites (the U3 control), and a record citing a ruling,
 *     carrying what only his rulings give, or standing for a production goal;
 *   - B2 review MF1: a source resolved to ONE row by its own table's primary key, its words required in the field it names (P1-P4 of the
 *     reviewer's probe, each of which had loaded), a row named by a foreign key, a table the workbook does not hold, a qualifier the row does
 *     not hold, a wrong line, and a field stated about the row that is not the row's;
 *   - the record gate: a DRAFT record is refused without `draftsAdmitted` (so one placed in the production file stops the server), and with it
 *     is held to the ruling requirement inverted;
 *   - no non-test module imports `draft-store.ts` (statically, by require, or by a dynamic import()).
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { DraftStoreRefused, DRAFTS_DIR, loadDraftStore } from './draft-store'
import { DRAFT_KNOWLEDGE, DRAFT_KNOWLEDGE_VERSION } from './types'
import { learningGoalAuthorizations, validateLearningGoalAuthorizations } from '../test-library/learning-goal-authorizations'

const quiet = console.log
console.log = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('[selection-search]')) return
    quiet(...args)
}

const REAL = 'ta02-composition'
const REAL_DIR = path.join(DRAFTS_DIR, REAL)
const CONTRACT = 'rpc-003-contract.DRAFT.json'
const RECORD = 'ta02-authorization.DRAFT.json'

/** A TEST-ONLY copy of the real store, with one file edited. Never written into the repository. */
function copyWith(file: string, edit: (json: any) => void): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2-draft-store-'))
    for (const name of fs.readdirSync(REAL_DIR).filter(n => n.endsWith('.DRAFT.json'))) fs.copyFileSync(path.join(REAL_DIR, name), path.join(dir, name))
    const json = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
    edit(json)
    fs.writeFileSync(path.join(dir, file), JSON.stringify(json, null, 2) + '\n')
    return dir
}
const itemOf = (json: any, id: string) => {
    const found = json.contractEntry.result.items.find((item: any) => item.id === id)
    if (!found) throw new Error(`no ${id} in the draft`)
    return found
}
/** The store refused whole, with a reason matching each pattern. */
function refused(dir: string, ...patterns: RegExp[]): string[] {
    let caught: unknown = null
    try {
        loadDraftStore(dir)
    } catch (error) {
        caught = error
    }
    assert.ok(caught instanceof DraftStoreRefused, `refused, not loaded (${dir})`)
    const reasons = (caught as DraftStoreRefused).reasons
    for (const pattern of patterns) assert.ok(reasons.some(reason => pattern.test(reason)), `a reason matches ${pattern}: ${reasons.join(' | ')}`)
    return reasons
}

/* ── The real store passes the gate, stamped ─────────────────────────────────────────────────────────────────────────────── */
{
    const store = loadDraftStore(REAL)
    assert.deepEqual(store.files, [CONTRACT, RECORD])
    // B2 review (28 October 2026): the folder's DRAFT Markdown notes were skipped silently while the head of the store said every DRAFT file
    // it does not read is listed. Every file marked DRAFT is now listed with why.
    assert.deepEqual(
        store.notRead.map(entry => entry.file),
        [
            'gf2-restart-restatement.DRAFT.json',
            'rpc-003-library-reconciliation.DRAFT.md',
            'ta02-candidate-evaluation.DRAFT.md',
            'ta02-relevance-claims.DRAFT.json',
            'ta02-relevance-claims.DRAFT.md',
        ],
        'every DRAFT file of the folder the store does not read is listed, never skipped silently',
    )
    assert.deepEqual(
        fs.readdirSync(REAL_DIR).filter(name => name.includes('.DRAFT.')).sort(),
        [...store.files, ...store.notRead.map(entry => entry.file)].sort(),
        'read or listed: every DRAFT file of the folder, none left out',
    )
    const why = (file: string) => store.notRead.find(entry => entry.file === file)!.why
    assert.ok(why('gf2-restart-restatement.DRAFT.json').includes('added[]'))
    assert.ok(why('ta02-relevance-claims.DRAFT.json').includes('neither a contract entry nor an authorization record'))
    for (const file of ['rpc-003-library-reconciliation.DRAFT.md', 'ta02-candidate-evaluation.DRAFT.md', 'ta02-relevance-claims.DRAFT.md']) assert.ok(why(file).includes('not a DRAFT JSON file'), file)
    assert.equal(store.contracts.length, 1)
    const [contract] = store.contracts
    assert.equal(contract.contractId, 'restated:RPC-003')
    assert.equal(contract.objectId, 'RPC-003')
    assert.equal(contract.knowledgeVersion, DRAFT_KNOWLEDGE_VERSION)
    assert.ok(contract.items.length > 0 && contract.items.every(item => item.category === DRAFT_KNOWLEDGE), 'every item stamped')
    assert.ok(contract.declarations.length > 0 && contract.declarations.every((declaration: any) => declaration.category === DRAFT_KNOWLEDGE), 'every declaration stamped')
    // His reply filed 30 October 2026, item 6: the context refers to the playing environment's ball and establishes none of its own.
    assert.ok(!contract.items.some(item => item.itemId === 'RPC-003-04.a'), 'the withdrawn item is not loaded')
    assert.ok(contract.items.some(item => item.itemId === 'RPC-003-04.b'), 'its outside-the-boundary item stays')
    const draft = JSON.parse(fs.readFileSync(path.join(REAL_DIR, CONTRACT), 'utf8'))
    assert.equal(draft.withdrawnItems[0].item.id, 'RPC-003-04.a', 'kept whole outside the contract entry')
    assert.deepEqual(draft.withdrawnItems[0].ruling.words, [
        'Yes. Attack Development should use one contested ball shared by the context and Game Form.',
        'This should be a reusable representation of the actual playing environment, not an additional ball introduced because two knowledge components refer to possession.',
    ])
    assert.ok(draft.corrections.some((entry: any) => entry.finding.startsWith('his reply filed 30 October 2026, item 6')), 'recorded in the corrections key')
    assert.equal(store.records.length, 1)
    const [record] = store.records
    assert.equal(record.learningGoalId, 'TA02')
    assert.equal(record.knowledgeStatus, 'DRAFT')
    assert.deepEqual([record.ruledOn, record.by, record.ruling], ['', '', []], 'it cites no ruling of his')
}

/* ── Each refusal of the gate, on TEST-ONLY copies; each refuses the whole store ────────────────────────────────────────── */
{
    // A paraphrase of a workbook row, in a source.
    refused(
        copyWith(CONTRACT, json => {
            itemOf(json, 'RPC-003-02').source[0].text = 'Purposeful advancement rather than possession: reaching a more advanced area while keeping the ball.'
        }),
        /RPC-003-02 source RPC-PROP-134: ".*" is not verbatim in the row it cites/,
    )
    // A paraphrase of a quoted note of a rendered relationship row: the rendering is compared whole with the row's.
    refused(
        copyWith(CONTRACT, json => {
            const source = itemOf(json, 'RPC-003-01.a').source.find((entry: any) => entry.rowId === 'RPC-REL-003')
            source.text = source.text.replace('Invasion ecological organization', 'invasion organization')
        }),
        /RPC-003-01\.a source RPC-REL-003: ".*Soccer RPCs operate within invasion organization\..*" is not verbatim in the row it cites, nor that row's rendering/,
    )
    // A quotation in basisEvidence that is not in a row the item cites.
    refused(
        copyWith(CONTRACT, json => {
            itemOf(json, 'RPC-003-04.b').basisEvidence = '"while keeping possession of the ball" (RPC-PROP-134)'
        }),
        /RPC-003-04\.b basisEvidence quotes "while keeping possession of the ball", which is not verbatim/,
    )
    // B2 review: a short quotation and a curly-quoted one are quotations too (the gate read only straight quotes of 12 characters or more).
    refused(
        copyWith(CONTRACT, json => {
            itemOf(json, 'RPC-003-04.b').basisEvidence = '"keep it" (RPC-PROP-037)'
        }),
        /RPC-003-04\.b basisEvidence quotes "keep it", which is not verbatim/,
    )
    refused(
        copyWith(CONTRACT, json => {
            itemOf(json, 'RPC-003-04.b').basisEvidence = '“Possession is kept.” (RPC-PROP-037)'
        }),
        /RPC-003-04\.b basisEvidence quotes "Possession is kept\.", which is not verbatim/,
    )
    // The parts an ellipsis separates stand in order, in one value.
    refused(
        copyWith(CONTRACT, json => {
            itemOf(json, 'RPC-003-04.b').basisEvidence = '"is lost. ... Possession" (RPC-PROP-037)'
        }),
        /RPC-003-04\.b basisEvidence quotes "is lost\. \.\.\. Possession", which is not verbatim/,
    )

    /*
     * B2 review MF1 (28 October 2026): a source is resolved to ONE row by its own table's primary key, and its words are required in the
     * field it names. The store had collected every object any `…id` key of which held the cited id (foreign keys such as Archetype_ID on
     * every knowledge record included) and checked the words against every field of every one: the reviewer's probe loaded P1-P4 below.
     */
    const archetypeSource = (json: any) => itemOf(json, 'RPC-003-01.a').source.find((entry: any) => entry.rowId === 'GA-001 Objective_Organization')
    // P1: the GA-001 Objective_Organization source given another row's words (GAK-0001's Knowledge_Statement, whose Archetype_ID is GA-001).
    refused(
        copyWith(CONTRACT, json => {
            archetypeSource(json).text = "This Game Problem is a constitutively recurring expression of the archetype's ecological organization."
        }),
        /RPC-003-01\.a source GA-001 Objective_Organization: "This Game Problem is a constitutively recurring expression of the archetype's ecological organization\." is not verbatim in the field Objective_Organization of the row it cites/,
    )
    // P2: the same source given the words of another field of the same row.
    refused(
        copyWith(CONTRACT, json => {
            archetypeSource(json).text = 'Continuous reorganization of objective access, space, roles, and threat.'
        }),
        /RPC-003-01\.a source GA-001 Objective_Organization: "Continuous reorganization of objective access, space, roles, and threat\." is not verbatim in the field Objective_Organization/,
    )
    // P3: a source citing a context id (every row of the context holds it as rpc_id), with the words of one of its rows.
    refused(
        copyWith(CONTRACT, json => {
            itemOf(json, 'RPC-003-02').source.push({ rowId: 'RPC-003', table: 'properties', file: 'back/src/system/sport-module/rpc-library.rc1.json', line: 1778, text: 'Possession is lost.' })
        }),
        /RPC-003-02 source RPC-003: back\/src\/system\/sport-module\/rpc-library\.rc1\.json holds no row RPC-003 in its table properties \(by its key property_id\); a source cites exactly one/,
    )
    // P4: a rendered relationship misstated outside its quotes (its related id and strength), every rendered field compared.
    refused(
        copyWith(CONTRACT, json => {
            const source = itemOf(json, 'RPC-003-03.a').source.find((entry: any) => entry.rowId === 'RPC-REL-079')
            source.text = source.text.replace('target_zone_entered', 'goal_scored').replace('strength PRIMARY', 'strength SECONDARY')
        }),
        /RPC-003-03\.a source RPC-REL-079: "SCORING_EVENT goal_scored \(COMPATIBLE, strength SECONDARY\).*" is not verbatim in the row it cites, nor that row's rendering/,
    )
    // A row named by a foreign key of its table (GA-001 is the Archetype_ID of 36 knowledge records, the Record_ID of none).
    refused(
        copyWith(CONTRACT, json => {
            const source = itemOf(json, 'RPC-003-01.a').source.find((entry: any) => entry.table === 'knowledge')
            source.rowId = 'GA-001'
        }),
        /RPC-003-01\.a source GA-001: back\/src\/system\/knowledge-core\/game-archetype-workbook\.rc1\.1\.json holds no row GA-001 in its table knowledge \(by its key Record_ID\)/,
    )
    // A table the cited workbook does not hold, and a source naming none.
    refused(
        copyWith(CONTRACT, json => {
            itemOf(json, 'RPC-003-02').source[0].table = 'archetypes'
        }),
        /RPC-003-02 source RPC-PROP-134 names table "archetypes", which is not a table of back\/src\/system\/sport-module\/rpc-library\.rc1\.json this store reads/,
    )
    refused(
        copyWith(CONTRACT, json => {
            delete itemOf(json, 'RPC-003-02').source[0].table
        }),
        /RPC-003-02 source RPC-PROP-134 names table null/,
    )
    // A qualifier after the row id that is neither a field of the row nor, in parentheses, a value it holds.
    refused(
        copyWith(CONTRACT, json => {
            itemOf(json, 'RPC-003-01.a').source.find((entry: any) => entry.table === 'knowledge').rowId = 'GAK-0105 (GA-001-OIC-99)'
        }),
        /RPC-003-01\.a source GAK-0105 \(GA-001-OIC-99\): "\(GA-001-OIC-99\)" after the row id is neither a field of GAK-0105 nor, in parentheses, a value it holds/,
    )
    // A line that is not the line holding the row's key (or the field cited).
    refused(
        copyWith(CONTRACT, json => {
            itemOf(json, 'RPC-003-02').source[0].line = 2652
        }),
        /RPC-003-02 source RPC-PROP-134: line 2652 of back\/src\/system\/sport-module\/rpc-library\.rc1\.json is not the line holding property_id of RPC-PROP-134/,
    )
    refused(
        copyWith(CONTRACT, json => {
            archetypeSource(json).line = 41
        }),
        /RPC-003-01\.a source GA-001 Objective_Organization: line 41 of .* is not the line holding Objective_Organization of GA-001/,
    )
    // A field the source states about the row that is not the row's, and one this store does not read for the table.
    refused(
        copyWith(CONTRACT, json => {
            itemOf(json, 'RPC-003-02').source[0].category = 'END_CONDITION'
        }),
        /RPC-003-02 source RPC-PROP-134 states category "END_CONDITION", and the row's property_category is "PRIMARY_SCORING_CONDITION"/,
    )
    refused(
        copyWith(CONTRACT, json => {
            itemOf(json, 'RPC-003-02').source[0].strength = 'PRIMARY'
        }),
        /RPC-003-02 source RPC-PROP-134 states strength, which is not a field this store reads for the table properties/,
    )
    // B2 review: an ASSUMED item citing no row names the standing decision it rests on (RPC-003-03.b names SD-06).
    refused(
        copyWith(CONTRACT, json => {
            itemOf(json, 'RPC-003-03.b').basisEvidence = 'TEST-ONLY: exactly one, by our reading.'
        }),
        /RPC-003-03\.b is ASSUMED and cites no source row, and its basisEvidence names no standing decision it rests on/,
    )
    refused(
        copyWith(CONTRACT, json => {
            itemOf(json, 'RPC-003-03.b').basisEvidence = 'TEST-ONLY: exactly one, from SD-99.'
        }),
        /RPC-003-03\.b is ASSUMED and cites no source row/,
    )
    // A file outside the workbooks, and a row the workbook does not hold.
    refused(
        copyWith(CONTRACT, json => {
            itemOf(json, 'RPC-003-02').source[0].file = 'docs/audits/conformance/stage-b/contracts.json'
        }),
        /cites docs\/audits\/conformance\/stage-b\/contracts\.json, which is not a workbook this store reads/,
    )
    refused(
        copyWith(CONTRACT, json => {
            itemOf(json, 'RPC-003-02').source[0].rowId = 'RPC-PROP-999'
        }),
        /holds no row RPC-PROP-999/,
    )
    // An item claiming his words (AUTHORED) with no sources; an item without our reasoning.
    refused(
        copyWith(CONTRACT, json => {
            itemOf(json, 'RPC-003-02').source = []
        }),
        /RPC-003-02 cites no source row, and its basis "AUTHORED" claims words that must be cited/,
    )
    refused(
        copyWith(CONTRACT, json => {
            delete itemOf(json, 'RPC-003-02').fitNote
        }),
        /RPC-003-02 carries no reasoning of ours/,
    )
    // What only a ruled restatement or a provisional realization writes.
    for (const key of ['category', 'departsFrom', 'authorizedBy', 'defersTo']) {
        refused(
            copyWith(CONTRACT, json => {
                itemOf(json, 'RPC-003-02')[key] = 'TEST-ONLY'
            }),
            new RegExp(`RPC-003-02 carries ${key}, which a draft never writes`),
        )
    }
    // An id production uses; a standing other than DRAFT (item, entry, file); an object that already has a production contract.
    refused(
        copyWith(CONTRACT, json => {
            itemOf(json, 'RPC-003-02').id = 'SPORT-SOCCER-01'
        }),
        /item SPORT-SOCCER-01 uses an id a production contract, the Sport Profile or a provisional realization already uses/,
    )
    refused(
        copyWith(CONTRACT, json => {
            itemOf(json, 'RPC-003-02').standing = 'APPROVED'
        }),
        /RPC-003-02 does not stand DRAFT/,
    )
    refused(
        copyWith(CONTRACT, json => {
            json.contractEntry.standing = 'APPROVED'
        }),
        /the contract entry does not stand DRAFT/,
    )
    refused(
        copyWith(CONTRACT, json => {
            json.standing = 'APPROVED'
        }),
        /rpc-003-contract\.DRAFT\.json does not stand DRAFT/,
    )
    refused(
        copyWith(CONTRACT, json => {
            json.contractEntry.name = 'GF2 TEST-ONLY'
        }),
        /GF2 already has a production contract/,
    )
    // The U3 control as a draft: every condition item removed. The workbook's primary scoring condition is then cited by no item that
    // constitutes a scoring condition, and the store is refused (the plain game form's activity can no longer pass as the context's).
    const CONDITIONS = ['RPC-003-10.a', 'RPC-003-10.b', 'RPC-003-11.a', 'RPC-003-11.b', 'RPC-003-11.c', 'RPC-003-12.a', 'RPC-003-12.b']
    refused(
        copyWith(CONTRACT, json => {
            json.contractEntry.result.items = json.contractEntry.result.items.filter((item: any) => !CONDITIONS.includes(item.id))
        }),
        /the workbook's PRIMARY_SCORING_CONDITION row RPC-PROP-134 for RPC-003 is cited by no item constituting a scoring condition/,
    )
    // Only the constituting items count: the other items that cite the condition (02, 04.b, 05) do not satisfy it.
    refused(
        copyWith(CONTRACT, json => {
            for (const id of ['RPC-003-10.a', 'RPC-003-11.a', 'RPC-003-12.a']) itemOf(json, id).source = itemOf(json, id).source.filter((source: any) => source.rowId !== 'RPC-PROP-134')
        }),
        /RPC-PROP-134 for RPC-003 is cited by no item constituting a scoring condition/,
    )
    // One constituting item citing it is enough.
    assert.equal(
        loadDraftStore(
            copyWith(CONTRACT, json => {
                for (const id of ['RPC-003-10.a', 'RPC-003-11.a']) {
                    itemOf(json, id).source = itemOf(json, id).source.filter((source: any) => source.rowId !== 'RPC-PROP-134')
                    itemOf(json, id).basisEvidence = 'TEST-ONLY: no quotation'
                }
            }),
        ).contracts.length,
        1,
    )
    // The record: citing a ruling, carrying what only his rulings give, standing for a production goal, or stamped by hand.
    refused(
        copyWith(RECORD, json => {
            json.record.ruledOn = '2026-10-30'
            json.record.by = 'TEST-ONLY'
            json.record.ruling = ['TEST-ONLY words']
        }),
        /the record gate refuses it as a draft: TA02: a DRAFT record cites no ruling of his/,
    )
    for (const key of ['provisionalRealization', 'realizations', 'provisionalChoices', 'authorizedAdjustments', 'reviewRequest']) {
        refused(
            copyWith(RECORD, json => {
                json.record[key] = 'TEST-ONLY'
            }),
            new RegExp(`carries ${key}, which only his rulings give a record`),
        )
    }
    refused(
        copyWith(RECORD, json => {
            json.record.learningGoalId = 'A01'
        }),
        /A01 has a production record: a draft never stands beside or for one/,
    )
    refused(
        copyWith(RECORD, json => {
            json.record.knowledgeStatus = 'DRAFT'
        }),
        /carries knowledgeStatus, which only the store stamps/,
    )
    // Whole-store refusal: one defect in the record refuses the contract too; nothing of the store is handed back.
    const reasons = refused(
        copyWith(RECORD, json => {
            json.record.knowledgeStatus = 'DRAFT'
        }),
        /knowledgeStatus/,
    )
    assert.equal(reasons.length, 1, 'one defect, and the whole store is refused for it')
}

/* ── The record gate: a DRAFT record only with draftsAdmitted, and then its ruling requirement inverted ─────────────────── */
{
    const [record] = loadDraftStore(REAL).records
    const production = learningGoalAuthorizations()
    assert.deepEqual(validateLearningGoalAuthorizations([...production, record], undefined, undefined, undefined, { draftsAdmitted: true }), [], 'admitted beside the production records')
    // The production gate at load passes no options, so a DRAFT record placed in the production file is refused and the server stops.
    assert.deepEqual(validateLearningGoalAuthorizations([...production, record]), ['TA02: a DRAFT record is read only through the TEST-ONLY draft store (knowledgeStatus "DRAFT")'])
    const loader = fs.readFileSync(path.join(__dirname, '../test-library/learning-goal-authorizations.ts'), 'utf8')
    assert.ok(loader.includes('...validateLearningGoalAuthorizations(RECORDS),'), 'the load gate passes no options')
    // With drafts admitted, the requirement is inverted, never skipped: TEST-ONLY ruling words on a DRAFT record are refused.
    assert.ok(validateLearningGoalAuthorizations([{ ...record, ruling: ['TEST-ONLY words'] }], undefined, undefined, undefined, { draftsAdmitted: true }).includes('TA02: a DRAFT record cites no ruling of his (ruledOn, by and his words must all be empty)'))
    assert.ok(validateLearningGoalAuthorizations([{ ...record, ruledOn: '2026-10-30' }], undefined, undefined, undefined, { draftsAdmitted: true }).some(error => error.includes('a DRAFT record cites no ruling of his')))
    // Any other value of the marker is refused, admitted or not.
    assert.ok(validateLearningGoalAuthorizations([{ ...record, knowledgeStatus: 'APPROVED' as any }], undefined, undefined, undefined, { draftsAdmitted: true }).some(error => error.includes('a DRAFT record is read only through the TEST-ONLY draft store')))
    // And a production record is held to the ruling requirement exactly as before.
    const { ruling: _ruling, ...unruled } = production[0]
    assert.ok(validateLearningGoalAuthorizations([{ ...unruled, ruling: [] } as any], undefined, undefined, undefined, { draftsAdmitted: true }).some(error => error.includes('the record cites no ruling (ruledOn, by and his words are all required)')))
}

/* ── No production module imports the draft store ───────────────────────────────────────────────────────────────────────── */
{
    const SRC = path.resolve(__dirname, '..', '..')
    const files: string[] = []
    const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) walk(full)
            else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.unit.ts')) files.push(full)
        }
    }
    walk(SRC)
    assert.ok(files.length > 100, 'the scan reads the source tree')
    // A static import, a require, and (B2 review) a dynamic import(), which the scan had missed.
    const IMPORTS = /(from|require\s*\(|import\s*\()\s*['"][^'"]*draft-store['"]/
    assert.ok(["import('./draft-store')", "await import ( '../derivation/draft-store' )", "require('./draft-store')", "from './draft-store'"].every(text => IMPORTS.test(text)), 'the scan sees each form')
    const importers = files.filter(file => IMPORTS.test(fs.readFileSync(file, 'utf8'))).map(file => path.relative(SRC, file).split(path.sep).join('/'))
    assert.deepEqual(importers, [], 'only unit tests import the TEST-ONLY draft store')
}

console.log = quiet
console.log('draft-store unit tests: all cases passed.')
