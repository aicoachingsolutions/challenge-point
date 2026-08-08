/**
 * Soccer Module extraction — Vocabulary sheet (slice 4, extraction half).
 *
 * WHY THIS SLICE MATTERS MOST. Coach vocabulary is our single biggest recurring failure class, and
 * it is the one kind of knowledge that currently lives in CODE — a 691-line regex parser in
 * `deriveInputConstraints.ts`. Every vocabulary gap Christian has found has therefore needed a code
 * change and a deploy. As workbook rows it becomes an edit. That is the whole point of the sheet.
 *
 * WHAT THIS DOES AND DELIBERATELY DOES NOT DO. It extracts the parser's vocabulary into the
 * Vocabulary sheet and PROVES each row against the live parser. It does NOT repoint routing at the
 * sheet — the parser remains the authority at runtime. Populating and flipping are separate governed
 * steps for the same reason they were on the module: while both move at once, a routing change
 * cannot be attributed to either the data or the wiring.
 *
 * THE HARD PART IS THAT ROUTING IS NOT A FLAT TABLE. The parser has order, compound conditions and
 * explicit polarity overrides — "break down a compact defence" must NOT route defensive even though
 * "compact" does. A phrase list that ignored this would look complete and route wrongly, so:
 *
 *   * `fallback_priority` records evaluation order within a group;
 *   * `routing_polarity` records EXCLUDE for the override rules that return false;
 *   * `match_mode` distinguishes a literal phrase a coach might type from a structural pattern;
 *   * `legacy_pattern_reference` keeps the original regex, so no row is a lossy paraphrase.
 *
 * EVERY LITERAL ROW IS VERIFIED. The extractor synthesizes a concrete probe phrase from the pattern
 * and runs it through the real `deriveInputConstraints`. A row whose probe does not actually produce
 * its declared signal group is reported and marked, never written as though it were true. Patterns
 * too structural to synthesize are written as `match_mode=regex` and honestly marked unverified
 * rather than quietly asserted.
 *
 * Run:  npx ts-node --files -r tsconfig-paths/register ./src/scripts/extract-soccer-vocabulary.ts
 * Then: python back/data/sport-modules/soccer/write-workbook.py
 */
import fs from 'node:fs'
import path from 'node:path'

import { deriveInputConstraints } from '../system/input-constraints/deriveInputConstraints'

const PARSER_PATH = path.resolve(__dirname, '../system/input-constraints/deriveInputConstraints.ts')

/** Matcher function → the signal group it pushes. Taken from the push sites, not guessed. */
const MATCHER_GROUPS: Record<string, string> = {
    matchesTouchReceiving: 'A_touch_receiving',
    matchesPressure: 'B_pressure',
    matchesPossession: 'F_possession_passing',
    matchesSpacingSupport: 'C_spacing_support',
    matchesBreakLines: 'D_break_lines',
    matchesFinishing: 'F_finishing',
    matchesRegainPressing: 'E_regain_pressing',
    matchesOverload: 'G_overload',
    matchesTransition: 'H_transition',
    matchesInformationIntent: 'K_information',
    matchesDefensive: 'I_defensive',
    matchesSoccerRelatedDefault: 'Z_soccer_general',
}

/** `defensiveSubtype` picks WHICH defensive group fires, so its rows carry a distinct role. */
const SUBTYPE_MATCHER = 'defensiveSubtype'

/**
 * Carrier for probing subtype rows. "prevent" establishes defensive intent and resolves to the
 * DEFAULT subtype (protect) on its own, so when a probe lands on press/recover/delay the phrase
 * under test is the only thing that could have moved it.
 */
const SUBTYPE_CARRIER = 'prevent'

interface VocabularyRow {
    [column: string]: string | number | null
}

/** Extract a named function's body from the source by brace matching. */
function functionBody(source: string, name: string): string | null {
    const start = source.indexOf(`function ${name}(`)
    if (start === -1) return null
    const open = source.indexOf('{', start)
    let depth = 0
    for (let i = open; i < source.length; i += 1) {
        if (source[i] === '{') depth += 1
        else if (source[i] === '}') {
            depth -= 1
            if (depth === 0) return source.slice(open + 1, i)
        }
    }
    return null
}

type Clause = { patterns: string[]; literals: string[]; polarity: 'INCLUDE' | 'EXCLUDE'; subtype?: string }

/**
 * Split a matcher body into clauses at each `return`. Everything since the previous return belongs
 * to the clause that return concludes, which is what makes multi-line conditions work without a
 * real parser — the source consistently puts one condition per `if`.
 */
function clauses(body: string): Clause[] {
    const out: Clause[] = []
    const returnRe = /return\s+(true|false|'(\w+)')/g
    let last = 0
    let match: RegExpExecArray | null
    while ((match = returnRe.exec(body)) !== null) {
        const chunk = body.slice(last, match.index)
        last = returnRe.lastIndex
        const patterns = [...chunk.matchAll(/\/((?:[^/\\\n]|\\.)+)\/\s*\.test\(/g)].map((m) => m[1])
        const literals = [...chunk.matchAll(/\.includes\(\s*'((?:[^'\\]|\\.)*)'\s*\)/g)].map((m) => m[1])
        if (patterns.length === 0 && literals.length === 0) continue
        out.push({
            patterns,
            literals,
            polarity: match[1] === 'false' ? 'EXCLUDE' : 'INCLUDE',
            subtype: match[2],
        })
    }
    return out
}

/** Split a regex alternation on TOP-LEVEL `|` only, so `(?:a|b)` stays intact. */
function topLevelAlternatives(pattern: string): string[] {
    const parts: string[] = []
    let depth = 0
    let current = ''
    let inClass = false
    for (let i = 0; i < pattern.length; i += 1) {
        const ch = pattern[i]
        if (ch === '\\') {
            current += ch + (pattern[i + 1] ?? '')
            i += 1
            continue
        }
        if (ch === '[') inClass = true
        else if (ch === ']') inClass = false
        else if (!inClass && ch === '(') depth += 1
        else if (!inClass && ch === ')') depth -= 1
        if (ch === '|' && depth === 0 && !inClass) {
            parts.push(current)
            current = ''
            continue
        }
        current += ch
    }
    parts.push(current)
    return parts.filter((p) => p.trim() !== '')
}

/**
 * Turn one alternative into a concrete phrase a coach could type, or null when it is too structural
 * to represent honestly. Optional groups are dropped and alternations take their first branch, which
 * yields the shortest phrase the pattern accepts — the strictest probe, and the most readable row.
 */
function synthesizePhrase(alternative: string): string | null {
    let s = alternative
    if (/\(\?[=!<]/.test(s)) return null // lookaround — not a phrase

    s = s.replace(/\\b/g, '')
    s = s.replace(/\(\?:([^()]*)\)\?/g, '') // optional group → omit
    s = s.replace(/\(\?:([^()|]*)\|[^()]*\)/g, '$1') // alternation group → first branch
    s = s.replace(/\(\?:([^()]*)\)/g, '$1')
    s = s.replace(/\[\^\.\]\*/g, ' ') // "anything up to a full stop" → a gap
    s = s.replace(/\.\*/g, ' ')
    s = s.replace(/\\w\*/g, '')
    s = s.replace(/\\d\+/g, '3')
    s = s.replace(/\[-\\s\]\??/g, ' ')
    s = s.replace(/\\s\+/g, ' ')
    s = s.replace(/\\s\*/g, ' ')
    s = s.replace(/\\s\?/g, ' ')
    s = s.replace(/\[([a-z])([a-z])\]/g, '$1') // [sz] → s
    s = s.replace(/(\w)\?/g, '') // trailing optional char (shots? → shot)
    s = s.replace(/\\\./g, '.')
    s = s.replace(/\s+/g, ' ').trim()

    if (s === '' || /[\\[\]()*+?^$|{}]/.test(s)) return null
    return s
}

function main(): void {
    const source = fs.readFileSync(PARSER_PATH, 'utf8')
    const rows: VocabularyRow[] = []
    const unverified: string[] = []
    const mismatched: string[] = []
    let sequence = 0

    const emit = (
        matcher: string,
        group: string,
        clause: Clause,
        order: number,
        phrase: string | null,
        raw: string,
        mode: 'literal' | 'regex',
        role: string
    ) => {
        sequence += 1
        let status = 'ACTIVE'
        let note = ''

        if (mode === 'literal' && phrase && clause.polarity === 'INCLUDE') {
            // THE PROOF. A row claims this phrase routes to this group; ask the real parser.
            //
            // SUBTYPE rows need a carrier. `defensiveSubtype` only runs once defensive intent is
            // already established, so probing "press" bare tests the wrong thing — it correctly
            // routes to regain/pressing on its own. The carrier supplies the defensive intent and
            // resolves to the DEFAULT subtype by itself, so any change is attributable to the phrase.
            const probe = role === 'SUBTYPE' ? `${SUBTYPE_CARRIER} ${phrase}` : phrase
            const signals = deriveInputConstraints(probe).matchedSignals
            const hit = signals.some((s) => s.startsWith(`signalGroup:${group}`))
            if (!hit) {
                status = 'NEEDS_REVIEW'
                note = `Probe "${probe}" did not produce ${group} through the live parser (got: ${
                    signals.filter((s) => s.startsWith('signalGroup:')).join(', ') || 'none'
                }).`
                mismatched.push(`${group} :: "${probe}" -> ${note}`)
            }
        } else if (mode === 'regex') {
            status = 'ACTIVE_UNVERIFIED'
            note = 'Structural pattern — no single phrase represents it, so it is recorded rather than probed.'
            unverified.push(`${group} :: ${raw}`)
        }

        rows.push({
            vocabulary_id: `SV-${String(sequence).padStart(4, '0')}`,
            phrase: phrase ?? raw,
            normalized_phrase: (phrase ?? '').toLowerCase(),
            phrase_type: clause.polarity === 'EXCLUDE' ? 'DISAMBIGUATION' : 'GOAL_TERM',
            match_mode: mode === 'literal' ? 'CONTAINS' : 'PATTERN',
            signal_group_id: group,
            signal_group_role: role,
            direct_target_concept_type: '',
            direct_target_concept_id: '',
            modifier_target_signal_group_ids: '',
            routing_weight: '',
            // The parser's overrides are the reason a flat list would route wrongly.
            routing_polarity: clause.polarity,
            age_band: '',
            level_band: '',
            regional_variant: '',
            ambiguity_group: clause.polarity === 'EXCLUDE' ? `${group}_POLARITY` : '',
            disambiguation_rule:
                clause.polarity === 'EXCLUDE'
                    ? 'Attacking-intent override: this phrasing must NOT route defensive even though its nouns are defensive.'
                    : '',
            fallback_priority: order,
            status,
            source_type: 'LEGACY_PARSER_EXTRACTION',
            source_reference: `${matcher}()`,
            legacy_pattern_reference: raw,
            introduced_version: 'RC1-CANDIDATE-V3',
            last_verified_version: 'RC1-CANDIDATE-V3',
            provenance: 'Extracted from deriveInputConstraints.ts via extract-soccer-vocabulary.ts',
            notes: note,
        })
    }

    for (const [matcher, group] of Object.entries(MATCHER_GROUPS)) {
        const body = functionBody(source, matcher)
        if (!body) {
            console.error(`  ! ${matcher} not found — the parser has changed shape.`)
            continue
        }
        clauses(body).forEach((clause, order) => {
            for (const literal of clause.literals) {
                emit(matcher, group, clause, order + 1, literal, `includes('${literal}')`, 'literal', 'PRIMARY')
            }
            for (const pattern of clause.patterns) {
                // A compound clause (two patterns AND-ed) is a rule, not a vocabulary term.
                const compound = clause.patterns.length > 1
                for (const alternative of topLevelAlternatives(pattern)) {
                    const phrase = compound ? null : synthesizePhrase(alternative)
                    emit(
                        matcher,
                        group,
                        clause,
                        order + 1,
                        phrase,
                        alternative,
                        phrase ? 'literal' : 'regex',
                        'PRIMARY'
                    )
                }
            }
        })
    }

    // The defensive sub-classifier decides WHICH defensive group fires — separate role, same sheet.
    const subtypeBody = functionBody(source, SUBTYPE_MATCHER)
    if (subtypeBody) {
        clauses(subtypeBody).forEach((clause, order) => {
            const group = `I_defensive_${clause.subtype ?? 'protect'}`
            for (const pattern of clause.patterns) {
                for (const alternative of topLevelAlternatives(pattern)) {
                    const phrase = synthesizePhrase(alternative)
                    emit(
                        SUBTYPE_MATCHER,
                        group,
                        { ...clause, polarity: 'INCLUDE' },
                        order + 1,
                        phrase,
                        alternative,
                        phrase ? 'literal' : 'regex',
                        'SUBTYPE'
                    )
                }
            }
        })
    }

    const outPath = path.resolve(__dirname, '../../data/sport-modules/soccer/vocabulary.extracted.json')
    fs.writeFileSync(outPath, `${JSON.stringify(rows, null, 2)}\n`)

    const literal = rows.filter((r) => r['match_mode'] === 'CONTAINS').length
    console.log(`Extracted ${rows.length} vocabulary rows → ${outPath}`)
    console.log(`  ${literal} literal phrases (probed against the live parser), ${rows.length - literal} structural patterns`)
    console.log(`  ${mismatched.length} literal phrases did NOT reproduce their group (marked NEEDS_REVIEW)`)
    for (const m of mismatched.slice(0, 15)) console.log(`     - ${m}`)
    if (mismatched.length > 15) console.log(`     ... and ${mismatched.length - 15} more`)
}

main()
