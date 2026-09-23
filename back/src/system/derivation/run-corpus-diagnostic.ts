/**
 * Prints the corpus diagnostic. Run: npx ts-node --files -r tsconfig-paths/register
 * ./src/system/derivation/run-corpus-diagnostic.ts
 *
 * It adds no semantics: it runs the engine over the committed corpus and renders the emitted result.
 */
import { corpusInput } from './corpus'
import { runDerivation } from './engine'
import { renderDiagnostic } from './diagnostic'

console.log(renderDiagnostic(runDerivation(corpusInput())))
