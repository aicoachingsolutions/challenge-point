/**
 * Soccer Module extraction — Coverage sheet (slice 5).
 *
 * WHAT COVERAGE IS FOR. It declares, per canonical Game Problem, whether the soccer module can
 * actually serve it. Without that declaration an unsupported goal fails GENERICALLY — the coach is
 * told "no supported soccer training signals" whether they asked for something we will never support
 * or something we simply have not populated yet. Those are different answers and the coach deserves
 * the honest one. This is the sheet that makes the difference expressible.
 *
 * DERIVED, NOT ASSERTED. Every flag here is computed by running a VERIFIED vocabulary phrase for the
 * relevant signal group through the live `deriveInputConstraints` and observing what the engine
 * actually offers. Hand-written coverage claims rot silently — the engine changes and the
 * declaration keeps saying "supported". Deriving it means the sheet cannot drift from the code
 * without the extraction changing too.
 *
 * THE HONEST GAPS MATTER MORE THAN THE COVERAGE. Game Problems with no signal group routing to them
 * are written as NOT_SUPPORTED with the reason, rather than omitted. An omitted row reads as an
 * oversight; a NOT_SUPPORTED row with a named gap is a decision someone can act on — and it is the
 * list of what to populate next.
 *
 * Run:  npx ts-node --files -r tsconfig-paths/register ./src/scripts/extract-soccer-coverage.ts
 * Then: python back/data/sport-modules/soccer/write-workbook.py
 */
import fs from 'node:fs'
import path from 'node:path'

import { SIGNAL_GROUP_TO_GAME_PROBLEM } from '../system/knowledge-core/affordance-target-matrix'
import { gpLibrary } from '../system/knowledge-core/gp-library'
import { deriveInputConstraints } from '../system/input-constraints/deriveInputConstraints'
import { soccerModule } from '../system/sport-module/soccer-module'

interface CoverageRow {
    [column: string]: string | number | null
}

/** The behaviour-gate inputs — used to mark which Game Problems are actually exercised by the gate. */
const GATE_INPUTS = [
    'Help players break defensive lines.',
    'Players keep winning the ball but turning away from field vision.',
    'We want players to create better support angles under pressure.',
    'Help players recognize space behind the defense.',
    'Create more attacking opportunities without forcing specific passes.',
    'work on touches with pressure and spacing',
    'improve first touch under pressure',
]

/** Establishes defensive intent so the defensive sub-classifier runs. See the probe site. */
const DEFENSIVE_CARRIER = 'prevent'

/** The defensive subtype with no vocabulary of its own — it is the residual bucket. */
const DEFENSIVE_DEFAULT_GROUP = 'I_defensive_protect'

const LIST = '; '
const bool = (v: boolean) => (v ? 'TRUE' : 'FALSE')

/** Reverse the signal-group → Game Problem map so coverage can be built per Game Problem. */
function gameProblemToSignalGroups(): Map<string, string[]> {
    const out = new Map<string, string[]>()
    for (const [signalGroup, gps] of Object.entries(SIGNAL_GROUP_TO_GAME_PROBLEM)) {
        for (const gp of gps) {
            out.set(gp, [...(out.get(gp) ?? []), signalGroup.replace('signalGroup:', '')])
        }
    }
    return out
}

/**
 * A verified probe phrase per signal group, taken from the Vocabulary sheet. Using the sheet rather
 * than a hand-picked phrase keeps coverage honest: if vocabulary for a group is empty, coverage for
 * its Game Problem correctly reports that it cannot be reached.
 */
function probesBySignalGroup(): Map<string, string> {
    const out = new Map<string, string>()
    for (const row of soccerModule.vocabulary()) {
        const group = String(row['signal_group_id'] ?? '')
        const phrase = String(row['phrase'] ?? '')
        const usable =
            String(row['match_mode'] ?? '') === 'CONTAINS' &&
            String(row['routing_polarity'] ?? '') === 'INCLUDE' &&
            String(row['status'] ?? '') === 'ACTIVE'
        // Prefer the longest verified phrase — the most specific, least likely to be claimed by an
        // earlier group, which makes it the fairest test of whether this group is truly reachable.
        if (usable && phrase && phrase.length > (out.get(group)?.length ?? 0)) out.set(group, phrase)
    }
    return out
}

/** Which Game Problems the behaviour-gate inputs actually reach. */
function gateCoveredGameProblems(): Set<string> {
    const covered = new Set<string>()
    for (const input of GATE_INPUTS) {
        for (const signal of deriveInputConstraints(input).matchedSignals) {
            for (const gp of SIGNAL_GROUP_TO_GAME_PROBLEM[signal] ?? []) covered.add(gp)
        }
    }
    return covered
}

function main(): void {
    const byGameProblem = gameProblemToSignalGroups()
    const probes = probesBySignalGroup()
    const gateCovered = gateCoveredGameProblems()
    const rows: CoverageRow[] = []
    let sequence = 0

    for (const gp of gpLibrary.gameProblems()) {
        sequence += 1
        const id = gp.ID
        const signalGroups = byGameProblem.get(id) ?? []

        // Ask the engine what it would actually offer for this Game Problem.
        const lensIds = new Set<string>()
        const gameFormIds = new Set<string>()
        const realizationIds = new Set<string>()
        const unreachable: string[] = []
        const defaultRouted: string[] = []

        for (const group of signalGroups) {
            let phrase = probes.get(group)
            if (!phrase && group === DEFENSIVE_DEFAULT_GROUP) {
                // Protect Space has NO vocabulary of its own — `defensiveSubtype` returns it as the
                // DEFAULT for defensive intent that matches none of press/recover/delay. So it is
                // genuinely reachable, but only residually: a coach cannot ask for it directly, and
                // nothing would fail if its vocabulary were missing entirely. Recorded as reachable
                // with the gap named, because "supported" and "supported on purpose" differ.
                phrase = ''
                defaultRouted.push(group)
            }
            if (phrase === undefined) {
                unreachable.push(`${group} (no verified vocabulary)`)
                continue
            }
            // Defensive SUBTYPE groups are only reached once defensive intent is established — the
            // sub-classifier never runs otherwise. Probing them bare would report Protect Space and
            // Force Turnover as unsupported when they are reachable, which is precisely the kind of
            // false claim this sheet exists to prevent. Same carrier the vocabulary probes use.
            const probe = group.startsWith('I_defensive_') ? `${DEFENSIVE_CARRIER} ${phrase}`.trim() : phrase
            const hints = deriveInputConstraints(probe)
            if (!hints.matchedSignals.some((s) => s === `signalGroup:${group}`)) {
                // The probe routes somewhere else, so this group is not independently reachable.
                unreachable.push(`${group} (vocabulary claimed by another group)`)
                continue
            }
            hints.candidateAffordanceLensIds.forEach((v) => lensIds.add(v))
            hints.candidateArchetypeIds.forEach((v) => gameFormIds.add(v))
            hints.candidateConstraintIds.forEach((v) => realizationIds.add(v))
        }

        const reachable = signalGroups.length > 0 && unreachable.length < signalGroups.length
        const gaps: string[] = []
        if (signalGroups.length === 0) {
            gaps.push(
                'No signal group routes to this Game Problem, so no coach phrasing can reach it. ' +
                    'Supporting it needs vocabulary plus a routing decision, not just content.'
            )
        }
        if (unreachable.length > 0) gaps.push(`Unreachable signal groups: ${unreachable.join(', ')}`)
        if (defaultRouted.length > 0)
            gaps.push(
                `Reached only as the DEFAULT for ${defaultRouted.join(', ')} — no vocabulary routes here directly, ` +
                    'so a coach cannot ask for this Game Problem by name.'
            )
        if (reachable && gameFormIds.size === 0) gaps.push('Reachable but no game form is offered.')
        if (reachable && realizationIds.size === 0) gaps.push('Reachable but no realization is offered.')

        rows.push({
            coverage_id: `CV-${String(sequence).padStart(3, '0')}`,
            game_problem_id: id,
            game_archetype_id: '',
            lens_ids: [...lensIds].join(LIST),
            age_band: '',
            level_band: '',
            coverage_status: reachable ? 'SUPPORTED' : 'NOT_SUPPORTED',
            vocabulary_supported: bool(signalGroups.some((g) => probes.has(g))),
            signal_group_supported: bool(signalGroups.length > 0),
            lens_supported: bool(lensIds.size > 0),
            game_form_supported: bool(gameFormIds.size > 0),
            realization_supported: bool(realizationIds.size > 0),
            // Translation and validation are universal-platform machinery, not per-Game-Problem.
            communication_supported: 'TRUE',
            validation_supported: 'TRUE',
            behavior_gate_verified: bool(gateCovered.has(id)),
            supported_game_form_ids: [...gameFormIds].join(LIST),
            supported_realization_group_ids: [...realizationIds].join(LIST),
            known_gaps: gaps.join(' | '),
            // What to populate first is a coaching judgement; only the mechanical part is filled in.
            pilot_priority: reachable ? '' : 'REVIEW',
            evidence_status: gateCovered.has(id) ? 'BEHAVIOR_GATE' : 'NOT_EXERCISED',
            status: 'ACTIVE',
            introduced_version: 'RC1-CANDIDATE-V3',
            last_verified_version: 'RC1-CANDIDATE-V3',
            notes: `Signal groups: ${signalGroups.join(LIST) || 'none'}. Derived from the live parser via extract-soccer-coverage.ts.`,
        })
    }

    const outPath = path.resolve(__dirname, '../../data/sport-modules/soccer/coverage.extracted.json')
    fs.writeFileSync(outPath, `${JSON.stringify(rows, null, 2)}\n`)

    const supported = rows.filter((r) => r['coverage_status'] === 'SUPPORTED')
    console.log(`Extracted ${rows.length} coverage rows → ${outPath}`)
    console.log(`  SUPPORTED: ${supported.length} of ${rows.length} canonical Game Problems`)
    console.log(`  gate-exercised: ${rows.filter((r) => r['behavior_gate_verified'] === 'TRUE').length}`)
    console.log('\n  NOT SUPPORTED (this is the population backlog):')
    for (const row of rows.filter((r) => r['coverage_status'] === 'NOT_SUPPORTED')) {
        const gp = gpLibrary.gameProblem(String(row['game_problem_id']))
        console.log(`    ${row['game_problem_id']}  ${gp?.Name ?? ''}`)
    }
}

main()
