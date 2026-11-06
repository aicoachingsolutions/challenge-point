/**
 * **The bounded activity-assembly experiment, offline** — `npm run design:assembly -- [--out <dir>]`.
 *
 * Runs the whole experiment (Christian's second reply of 5 November 2026) and writes two evidence files into
 * `docs/audits/design-reasoning-assembly/evidence/` (or `--out`): `assembly-report.txt`, for a reader (the front, Parts 0 to 7, with the
 * activity as assembled in Part 1), and `assembly-results.json`, every value with what decided it. No time stamp, so two runs on the same
 * knowledge are byte-identical. No network, no database, no route: it reads the committed knowledge, the experiment record and the DRAFT
 * wording, nothing else.
 *
 * This runner supplies the display texts (a goal's display name among them, read from its 'Learning Goal' cell), through the display
 * reader, after Steps 1 and 2 are computed; no decision reads them. It also reads the committed regression record
 * (`evidence/regression-record.json`, always from the evidence folder, whatever `--out` says), which Part 5 prints.
 */
import fs from 'node:fs'
import path from 'node:path'

import { displayTextsFor } from './assembly-display'
import { buildAssemblyReport, runAssembly, validateRegressionRecord } from './assembly-review'

const REPO = path.resolve(__dirname, '..', '..', '..', '..')
const DEFAULT_OUT = path.join(REPO, 'docs', 'audits', 'design-reasoning-assembly', 'evidence')
const REGRESSION_RECORD = path.join(DEFAULT_OUT, 'regression-record.json')
const GOAL_NAME_COLUMN = 'Learning Goal'

function main(): void {
    const args = process.argv.slice(2)
    const outIndex = args.indexOf('--out')
    const outDir = outIndex >= 0 ? path.resolve(process.cwd(), args[outIndex + 1]) : DEFAULT_OUT
    const run = runAssembly((k, experiment, resolution, forms) => displayTextsFor(k, experiment, resolution, forms, GOAL_NAME_COLUMN))
    const regression = validateRegressionRecord(JSON.parse(fs.readFileSync(REGRESSION_RECORD, 'utf8')))
    const { report, results } = buildAssemblyReport(run, regression)
    fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(path.join(outDir, 'assembly-report.txt'), report)
    fs.writeFileSync(path.join(outDir, 'assembly-results.json'), `${JSON.stringify(results, null, 2)}\n`)
    console.log(report)
    console.log(`wrote assembly-report.txt and assembly-results.json to ${path.relative(process.cwd(), outDir) || '.'}`)
}

main()
