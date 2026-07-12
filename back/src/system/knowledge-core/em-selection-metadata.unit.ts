/**
 * Unit tests — EM selection-metadata experiment (the "right next experiment" per Christian):
 * does canonical reachability + a lightweight preference layer produce sensible selections?
 *
 * Pins: (1) every metadata entry references a real canonical KO and all 11 KOs are covered;
 * (2) realistic coach goals reach the expected KO first; (3) results are deterministic and
 * traceable (matched terms + canonical dimensions + guidance attached).
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import { emCanonical } from './em-canonical'
import { EM_SELECTION_METADATA, reasonEnvironmentalManipulations } from './em-selection-metadata'

function testMetadataCoversAllCanonicalKosExactly(): void {
    const canonicalIds = new Set(emCanonical.schema.knowledgeObjects.map((k) => k.KO_ID))
    const metaIds = new Set(EM_SELECTION_METADATA.map((m) => m.koId))
    assert.equal(metaIds.size, EM_SELECTION_METADATA.length, 'No duplicate metadata entries.')
    for (const id of metaIds) assert.ok(canonicalIds.has(id), `Metadata references non-canonical KO ${id}.`)
    for (const id of canonicalIds) assert.ok(metaIds.has(id), `Canonical KO ${id} lacks selection metadata.`)
    for (const m of EM_SELECTION_METADATA) {
        assert.ok(m.matchingVocabulary.length >= 5 || m.koId === 'EM-0011' || m.koId === 'EM-0005',
            `${m.koId} should carry a usable vocabulary bank.`)
    }
}

function testGoalsReachSensibleKos(): void {
    const cases: Array<[string, string]> = [
        ['keep possession in tight spaces under pressure', 'EM-0001'],
        ['create overloads to exploit the extra player', 'EM-0006'],
        ['players must read which goal is open before finishing', 'EM-0010'],
        ['attack multiple goals and find the open target', 'EM-0009'],
        ['defenders start deeper and recover their shape', 'EM-0002'],
    ]
    for (const [goal, expectedTop] of cases) {
        const result = reasonEnvironmentalManipulations(goal)
        assert.ok(result.length > 0, `Goal "${goal}" reached no canonical KOs.`)
        assert.equal(result[0].koId, expectedTop, `Goal "${goal}" → expected ${expectedTop} first, got ${result[0].koId}.`)
    }
}

function testAffordanceAffinityInfluencesRanking(): void {
    // No vocabulary hit at all: pure affinity reachability for a perception-oriented session.
    const result = reasonEnvironmentalManipulations('improve scanning decisions', ['perception'])
    assert.ok(result.length >= 2, 'Perception affinity should reach the info-oriented KOs.')
    const top2 = new Set(result.slice(0, 2).map((r) => r.koId))
    assert.ok(top2.has('EM-0009') && top2.has('EM-0010'), 'Objective Composition + Objective State lead for perception.')
}

function testTraceabilityAndDeterminism(): void {
    const a = reasonEnvironmentalManipulations('keep possession in tight spaces')
    const b = reasonEnvironmentalManipulations('keep possession in tight spaces')
    assert.deepEqual(a, b, 'Reasoning must be deterministic.')
    const top = a[0]
    assert.ok(top.matchedTerms.length > 0, 'Matched vocabulary must be traceable.')
    assert.ok(top.dimensions.length > 0, 'Canonical Engineering Dimensions must be attached.')
    assert.ok(top.guidance.length > 0, 'Ecological Guidance must be attached (contextual-fit layer).')
}

function runAll(): void {
    testMetadataCoversAllCanonicalKosExactly()
    testGoalsReachSensibleKos()
    testAffordanceAffinityInfluencesRanking()
    testTraceabilityAndDeterminism()
    console.log('em-selection-metadata unit tests: all cases passed.')
}

runAll()
