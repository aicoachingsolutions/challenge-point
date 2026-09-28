/**
 * Prints the corpus diagnostic. Run: npm run corpus:diagnostic
 *
 * It adds no semantics: it runs the engine over the committed corpus and renders the emitted result,
 * together with the provenance of the repairs applied on load.
 */
import { corpusInput, repairTally, restatementTally } from './corpus'
import { runDerivation } from './engine'
import { renderDiagnostic } from './diagnostic'

const result = runDerivation(corpusInput())
console.log(renderDiagnostic(result, { encoding: repairTally, restatement: restatementTally }))
