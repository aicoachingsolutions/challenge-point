import { resolveArchetypeByHint } from '../archetypes'
import { testLibraryRegistry } from '../test-library/library/registry'
import type { TestLibraryV0Archetype } from '../test-library/types'
import type { ArchetypeDefinition } from '../types'
import { normalizeText } from '../text'

/**
 * Deterministic Test Library V0 game form → system `ArchetypeDefinition`.
 * Catalog rows (GF*) are never passed through loose alias resolution on `game_form_name`
 * (avoids e.g. "Pressing & Regain Games" matching Transition Chaos via "press"/"regain" substrings).
 */
function fromCatalogGameForm(a: TestLibraryV0Archetype): ArchetypeDefinition {
    return {
        id: a.game_form_id,
        name: a.game_form_name,
        description: [a.objective, a.phase_of_play, a.interaction_structure, a.representative_design_notes].filter(Boolean).join(' | '),
        aliases: [],
        supportedPrimaryAffordanceKeywords: a.primaryAffordances ?? [],
        supportedSecondaryAffordanceKeywords: a.secondaryAffordances ?? [],
        assemblyCues: [
            ...(a.exampleConstraintPatterns?.length ? a.exampleConstraintPatterns : [a.interaction_structure]),
            a.phase_of_play,
            a.representative_design_notes,
        ].filter(Boolean),
        consequenceCues: a.exampleIncentivePatterns?.length ? [...a.exampleIncentivePatterns] : [a.representative_design_notes],
    }
}

export function testLibraryArchetypeToSystemDefinition(a: TestLibraryV0Archetype): ArchetypeDefinition {
    const gid = (a.game_form_id || a.id || '').trim()
    if (gid) {
        const row = testLibraryRegistry.archetypes().find((x) => x.game_form_id === gid || x.id === gid)
        if (row) {
            return fromCatalogGameForm(row)
        }
    }

    const norm = normalizeText(a.game_form_name)
    const byName = testLibraryRegistry.archetypes().find((x) => normalizeText(x.game_form_name) === norm)
    if (byName) {
        return fromCatalogGameForm(byName)
    }

    return (
        resolveArchetypeByHint(a.objective) ||
        resolveArchetypeByHint(a.phase_of_play) ||
        resolveArchetypeByHint(a.game_form_name) ||
        fromCatalogGameForm(a)
    )
}
