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

/** Canonical text for a predicate, so two identical selectors produce one class id. */
export function predicateKey(predicate: SelectorPredicate): string {
    if (predicate.any) return '*'
    return predicate.terms
        .map(t => (t.op === 'IN' ? `${t.attribute} IN {${[...t.values].sort().join(',')}}` : `${t.attribute} ${t.op} ${(t as any).value}`))
        .sort()
        .join(' AND ')
}
