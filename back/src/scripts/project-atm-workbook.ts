/**
 * Regenerates back/src/system/knowledge-core/atm-workbook.rc1.2.json from the committed Affordance Target Matrix
 * workbook, by `atm-workbook-projection.ts`. Added for item B1 (after his reply filed 30 October 2026): the JSON's original generator was never
 * committed. `atm-workbook-projection.unit.ts` fails whenever the committed JSON is not exactly this output.
 *
 * Run from back/:  node node_modules/ts-node/dist/bin.js --files src/scripts/project-atm-workbook.ts [--check]
 * With --check it writes nothing and exits 1 if the committed JSON differs from the projection.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { projectAtmWorkbook } from '../system/knowledge-core/atm-workbook-projection'

const XLSX = path.resolve(__dirname, '../../data/knowledge-core/Affordance_Target_Matrix_RC1_2_Canonical.xlsx')
const JSON_PATH = path.resolve(__dirname, '../system/knowledge-core/atm-workbook.rc1.2.json')

const projected = projectAtmWorkbook(readFileSync(XLSX))
if (process.argv.includes('--check')) {
    const committed = readFileSync(JSON_PATH, 'utf8').split('\r\n').join('\n')
    console.log(committed === projected ? 'atm-workbook.rc1.2.json IS the workbook projection.' : 'atm-workbook.rc1.2.json DIFFERS from the workbook projection.')
    if (committed !== projected) process.exitCode = 1
} else {
    writeFileSync(JSON_PATH, projected, 'utf8')
    console.log(`Wrote ${path.relative(process.cwd(), JSON_PATH)} (${Buffer.byteLength(projected)} bytes).`)
}
