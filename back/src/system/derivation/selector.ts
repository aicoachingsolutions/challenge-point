/**
 * Derivation engine — stage 1's selector language (register `selectorSyntax`).
 *
 * Operators: `=`, `IN` (set membership), `CONTAINS` (a set-valued attribute), `AND`, `*` (any element).
 *
 * Two rules from the register, both load-bearing:
 *  - an attribute name is taken WHOLE, including dots — `condition.type` is the registered attribute,
 *    and a parser that splits on the dot validates against something that does not exist;
 *  - an attribute outside the row's `selectorAttributes`, resolved through `ownerRow` for a field row,
 *    makes the selector unnormalisable: a reference defect under SD-32, never a prose match.
 */

import { RegisterIndex } from './register'
import { SelectorPredicate, SelectorTerm } from './types'

export interface ParseResult {
    predicate?: SelectorPredicate
    defect?: string
}

const ANY = /^\s*\*\s*$/

/** Unicode operators appear in the authored contracts; ASCII spellings are accepted alongside them. */
const IN_OPS = ['∈', ' IN ']
const CONTAINS_OPS = ['∋', ' CONTAINS ']

function splitConjuncts(selector: string): string[] {
    return selector
        .split(/&|\sAND\s/g)
        .map(s => s.trim())
        .filter(Boolean)
}

function parseSet(raw: string): string[] | null {
    const m = raw.match(/^\{(.*)\}$/s)
    if (!m) return null
    return m[1]
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
}

function parseTerm(conjunct: string): SelectorTerm | { defect: string } {
    for (const op of CONTAINS_OPS) {
        const at = conjunct.indexOf(op)
        if (at > 0) {
            const attribute = conjunct.slice(0, at).trim()
            const value = conjunct.slice(at + op.length).trim()
            if (!attribute || !value) return { defect: `malformed CONTAINS term: ${conjunct}` }
            return { attribute, op: 'CONTAINS', value }
        }
    }
    for (const op of IN_OPS) {
        const at = conjunct.indexOf(op)
        if (at > 0) {
            const attribute = conjunct.slice(0, at).trim()
            const rest = conjunct.slice(at + op.length).trim()
            const values = parseSet(rest)
            if (!attribute || !values) return { defect: `malformed IN term: ${conjunct}` }
            return { attribute, op: 'IN', values }
        }
    }
    const eq = conjunct.indexOf('=')
    if (eq > 0) {
        const attribute = conjunct.slice(0, eq).trim()
        const value = conjunct.slice(eq + 1).trim()
        if (!attribute || !value) return { defect: `malformed equality term: ${conjunct}` }
        return { attribute, op: '=', value }
    }
    return { defect: `no registered operator in: ${conjunct}` }
}

/**
 * Parse and validate a selector against the attributes its row actually offers.
 * `rowId` is the row the item sits on; a field row's attributes come from its `ownerRow`.
 */
export function parseSelector(selector: unknown, rowId: string, index: RegisterIndex): ParseResult {
    if (selector === null || selector === undefined || (typeof selector === 'string' && ANY.test(selector))) {
        return { predicate: { any: true, terms: [] } }
    }
    if (typeof selector !== 'string') return { defect: `selector is not text: ${JSON.stringify(selector)}` }

    const attributeSource = index.ownerRow.get(rowId) || rowId
    const attributes = index.rows.get(attributeSource)?.selectorAttributes || []

    const terms: SelectorTerm[] = []
    for (const conjunct of splitConjuncts(selector)) {
        const parsed = parseTerm(conjunct)
        if ('defect' in parsed) return { defect: parsed.defect }
        if (!attributes.includes(parsed.attribute)) {
            return {
                defect: `attribute ${JSON.stringify(parsed.attribute)} is not a selector attribute of ${attributeSource}` +
                    ` (registered: ${attributes.join(', ') || 'none'})`,
            }
        }
        terms.push(parsed)
    }
    if (!terms.length) return { defect: `selector has no registered term: ${selector}` }
    return { predicate: { any: false, terms } }
}

/**
 * Does a selector attribute hold of this class's own identity?
 *
 * `null` means the element's own selector does not fix the attribute at all, so the question cannot be
 * decided from identity. Each caller decides what undecidable means for it, because the two callers want
 * opposite things and both are right:
 *
 *   - **an applicability condition keeps the line.** An element whose trigger is unknown might well need the
 *     qualifier, and withdrawing its line would hide a real gap behind an applicability rule. So the only
 *     thing that rule can ever do is remove a line it can positively show does not belong.
 *   - **a standing decision declines to apply.** A decision registered for `trigger=POSSESSION_CHANGE` must
 *     not supply a value to an element whose trigger nobody can read — that would be inferring the narrowing
 *     away. Fail rather than infer.
 *
 * `IN` is decidable only when every value the selector permits agrees, because a class that may be either an
 * out-of-play trigger or a turnover is genuinely undetermined here.
 *
 * **Moved here from the engine on 4 October**, when the standing-decision repair needed the same question
 * answered. It is selector semantics and belongs beside the parser; duplicating it in two layers is how this
 * codebase previously ended up with two count readers that disagreed.
 */
export function selectorApplies(cls: { constraints: SelectorPredicate }, attribute: string, permitted: string[]): boolean | null {
    const terms = cls.constraints.terms.filter(t => t.attribute === attribute)
    if (!terms.length) return null
    for (const term of terms) {
        if (term.op === '=') return permitted.includes(term.value)
        if (term.op === 'CONTAINS') return permitted.includes(term.value)
        if (term.op === 'IN') {
            const inside = term.values.filter(v => permitted.includes(v)).length
            if (inside === term.values.length) return true
            if (inside === 0) return false
            return null // the selector straddles the boundary; identity does not decide it
        }
    }
    return null
}

/** Canonical text for a predicate, so two identical selectors produce one class id. */
export function predicateKey(predicate: SelectorPredicate): string {
    if (predicate.any) return '*'
    return predicate.terms
        .map(t => (t.op === 'IN' ? `${t.attribute} IN {${[...t.values].sort().join(',')}}` : `${t.attribute} ${t.op} ${(t as any).value}`))
        .sort()
        .join(' AND ')
}
