/**
 * Unit tests for the Reasoning → Commitment seam (Batch 2 — Deterministic Design Logic).
 *
 * generateSelection separates enumeration of supported Design Possibilities (Reasoning Models) from
 * the single Design Commitment (commitDesignChoice). This test pins the commitment rule so it cannot
 * silently drift: max total score, ties broken by the smallest deterministic combo key. That exact
 * rule is what makes the reasoning/commitment split behavior-preserving vs the old inline argmax.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import { commitDesignChoice, type DesignPossibility } from './generateSelection'

function p(total: number, key: string): DesignPossibility {
    return { total, key, lenses: [], constraints: [] }
}

function testNullOnEmpty(): void {
    assert.equal(commitDesignChoice([]), null, 'No supported possibilities must commit to null (defined failure).')
}

function testPicksMaxTotal(): void {
    const chosen = commitDesignChoice([p(10, 'z'), p(30, 'm'), p(20, 'a')])
    assert.equal(chosen?.total, 30, 'Must commit to the maximum total score.')
    assert.equal(chosen?.key, 'm')
}

function testTieBreaksOnSmallestKey(): void {
    const chosen = commitDesignChoice([p(30, 'zzz'), p(30, 'aaa'), p(30, 'mmm')])
    assert.equal(chosen?.key, 'aaa', 'On a total tie, the smallest combo key must win.')
}

function testOrderIndependent(): void {
    // Same set in different iteration orders must commit identically (repeatability).
    const set = [p(30, 'aaa'), p(30, 'mmm'), p(25, 'a'), p(30, 'bbb')]
    const forward = commitDesignChoice(set)
    const reversed = commitDesignChoice([...set].reverse())
    assert.equal(forward?.key, 'aaa')
    assert.equal(reversed?.key, forward?.key, 'Commitment must be independent of enumeration order.')
}

function runAll(): void {
    testNullOnEmpty()
    testPicksMaxTotal()
    testTieBreaksOnSmallestKey()
    testOrderIndependent()
    console.log('reasoning-commitment unit tests: all cases passed.')
}

runAll()
