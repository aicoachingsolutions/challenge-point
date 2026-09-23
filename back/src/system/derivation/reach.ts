/**
 * Derivation engine — stage 4, Reach (package §2.2, §4.1).
 *
 * "An item reaches a line when its row equals the line's row and the element satisfies its selector."
 *
 * Under SD-47 an element is a **class** — the elements satisfying an authoritative selector — not an
 * individual. So satisfaction is three-valued, and the package's invariant 3 governs: every predicate
 * returns true, false or *undetermined*, and **undetermined is never rounded to false**.
 *
 *   TRUE          the class's own constraints entail the item's selector: every element of the class
 *                 satisfies it, so the item reaches the class's line.
 *   FALSE         a constraint contradicts the selector: no element of the class satisfies it.
 *   UNDETERMINED  the class neither entails nor contradicts it — the item would constrain some
 *                 elements of the class and not others. The engine records this and derives nothing
 *                 from it (see `engine.ts`, which reports it under SD-48).
 */

import { ElementClass, SelectorPredicate, SelectorTerm } from './types'

export type Reach = 'TRUE' | 'FALSE' | 'UNDETERMINED'

function termAgainstClass(term: SelectorTerm, constraints: SelectorPredicate): Reach {
    const fixed = constraints.terms.filter(t => t.attribute === term.attribute)
    if (!fixed.length) {
        // The class says nothing about this attribute. The grammar sheet's rule — "an element that
        // lacks an attribute does not satisfy a selector on it" — is about an element's stated
        // attributes, not about what a class leaves open, so this is undetermined rather than false.
        return 'UNDETERMINED'
    }

    for (const constraint of fixed) {
        if (constraint.op === '=') {
            if (term.op === '=') return constraint.value === term.value ? 'TRUE' : 'FALSE'
            if (term.op === 'IN') return term.values.includes(constraint.value) ? 'TRUE' : 'FALSE'
            if (term.op === 'CONTAINS') return 'UNDETERMINED' // a single value says nothing about a set-valued attribute
        }
        if (constraint.op === 'IN') {
            if (term.op === '=') {
                if (!constraint.values.includes(term.value)) return 'FALSE'
                return constraint.values.length === 1 ? 'TRUE' : 'UNDETERMINED'
            }
            if (term.op === 'IN') {
                const overlap = constraint.values.filter(v => term.values.includes(v))
                if (!overlap.length) return 'FALSE'
                return overlap.length === constraint.values.length ? 'TRUE' : 'UNDETERMINED'
            }
            return 'UNDETERMINED'
        }
        if (constraint.op === 'CONTAINS') {
            if (term.op === 'CONTAINS') return constraint.value === term.value ? 'TRUE' : 'UNDETERMINED'
            return 'UNDETERMINED'
        }
    }
    return 'UNDETERMINED'
}

/** Does an item with this selector reach the given class? */
export function reaches(selector: SelectorPredicate, cls: ElementClass): Reach {
    if (selector.any) return 'TRUE'
    let result: Reach = 'TRUE'
    for (const term of selector.terms) {
        const one = termAgainstClass(term, cls.constraints)
        if (one === 'FALSE') return 'FALSE'
        if (one === 'UNDETERMINED') result = 'UNDETERMINED'
    }
    return result
}
