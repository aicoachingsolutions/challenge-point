/**
 * Where the authored knowledge files are read from at runtime.
 *
 * **Two layouts, and the second was missing.** Run from source, every module on this pathway sits four
 * directories below the repository root, so `../../../../docs/audits` is the checked-in knowledge. The
 * deployed server is a single bundle at `dist/index.js`, where `__dirname` is `dist` for every module and
 * the same relative path points outside the repository altogether. One of these files is read at module
 * load, so the bundle did not degrade — it failed to start. That went unnoticed because the pathway had
 * only ever been run from source; it became a start-up failure for the whole application the moment a
 * route imported it.
 *
 * `build.js` copies the runtime knowledge files into `dist/knowledge`, mirroring their paths under
 * `docs/audits`, and this module chooses between the two. The bundled copy is preferred when it exists
 * because that is the only place it can exist: the source tree has no `knowledge` directory beside these
 * modules. Nothing here knows which files there are — that list lives in `build.js`, beside the copy.
 */
import fs from 'node:fs'
import path from 'node:path'

const SOURCE_AUDITS = path.resolve(__dirname, '../../../../docs/audits')
const BUNDLED_AUDITS = path.resolve(__dirname, 'knowledge')

export const AUDITS_DIR = fs.existsSync(path.join(BUNDLED_AUDITS, 'conformance')) ? BUNDLED_AUDITS : SOURCE_AUDITS
