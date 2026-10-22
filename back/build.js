const esbuild = require('esbuild')
const { dependencies } = require('./package.json')
const fs = require('fs-extra')
const path = require('path')

const external = Object.keys(dependencies)

async function preBuildOperations() {
    const distPath = path.resolve(__dirname, 'dist')
    const envFromSrc = path.resolve(__dirname, './src/.env.production')
    const envTemplate = path.resolve(__dirname, './env.production.template')
    const emailTemplatesPath = path.resolve(__dirname, './src/services/email-templates')

    try {
        await fs.emptyDir(distPath)
        console.log('Cleared the /dist folder.')

        const distEnv = path.join(distPath, '.env.production')
        if (await fs.pathExists(envFromSrc)) {
            await fs.copy(envFromSrc, distEnv)
            console.log('Copied src/.env.production to dist/.env.production.')
        } else if (await fs.pathExists(envTemplate)) {
            await fs.copy(envTemplate, distEnv)
            console.warn(
                'No src/.env.production — copied env.production.template to dist/.env.production (replace secrets for real use).'
            )
        } else {
            console.warn('No env file for dist; backend must get configuration from the process environment.')
        }

        await fs.copy(emailTemplatesPath, path.join(distPath, '/email-templates'))
        console.log('Copied email-templates to /dist folder.')

        // The integrity-checked pathway reads its authored knowledge at runtime, one file at module load.
        // Bundled, every module's __dirname is dist, so the files have to travel with the bundle; the
        // reader's half of this is src/system/derivation/knowledge-root.ts. A missing file stops the build
        // here, because a server built without them does not degrade - it fails to start.
        const auditsPath = path.resolve(__dirname, '../docs/audits')
        const stageB = 'conformance/stage-b'
        const sportProfiles = (await fs.readdir(path.join(auditsPath, stageB))).filter(
            (name) => name.startsWith('sport-profile-') && name.endsWith('.json')
        )
        // The sport's coach vocabulary (stage M4, 17 October 2026) is found by pattern beside its profile, at module load.
        const sportVocabularies = (await fs.readdir(path.join(auditsPath, stageB))).filter(
            (name) => name.startsWith('sport-coach-vocabulary-') && name.endsWith('.json')
        )
        // The realization choices are found through an index that says which file belongs to which
        // knowledge object, so the files to copy are read FROM it: an entry added there travels with the
        // bundle without this list having to be remembered as well.
        const choicesIndex = 'realization-choices-index.json'
        const choicesFiles = Object.values((await fs.readJson(path.join(auditsPath, choicesIndex))).byKnowledgeObject)
        // His provisional realizations (15 October 2026, stage K2) are read at module load by the authorization records'
        // gate and by derivation, and each names its own realization-choices file, so those files are read FROM it too.
        const provisionalFile = `${stageB}/provisional-realizations.json`
        const provisionalChoices = ((await fs.readJson(path.join(auditsPath, provisionalFile))).realizations || [])
            .map((realization) => realization.realizationChoices)
            .filter(Boolean)
        const knowledgeFiles = [
            'conformance/register-2026-09-18.json',
            `${stageB}/contracts.json`,
            `${stageB}/corpus-restatements.json`,
            ...sportProfiles.map((name) => `${stageB}/${name}`),
            ...sportVocabularies.map((name) => `${stageB}/${name}`),
            choicesIndex,
            // Step 4 component 3 (14 October 2026): the coach wording he has approved, read at runtime by the renderer.
            'approved-coach-wording.json',
            // Stage 3C (21 October 2026): the PROPOSED table of what the Coach Overview must state, read at module load by coach-overview.ts.
            'overview-essentials.json',
            // Stage 3E (22 October 2026): the PROPOSED record of what parts of his approved wording state, read at module load by
            // approved-wording-readings.ts.
            'approved-wording-readings.json',
            // Rounding at establishment (14 October 2026): the practical grain, read at module load by derivation/practical.ts.
            'practical-rounding.json',
            ...new Set(['a04-realization-choices.json', ...choicesFiles, ...provisionalChoices]),
            provisionalFile,
        ]
        for (const file of knowledgeFiles) {
            await fs.copy(path.join(auditsPath, file), path.join(distPath, 'knowledge', file))
        }
        console.log(`Copied ${knowledgeFiles.length} knowledge files to /dist/knowledge.`)
    } catch (error) {
        console.error('Error during pre-build operations:', error)
        process.exit(1)
    }
}

async function build() {
    await preBuildOperations()

    esbuild
        .build({
            entryPoints: ['src/index.ts'],
            bundle: true,
            platform: 'node',
            target: 'es2020',
            outfile: 'dist/index.js',
            external,
            tsconfig: 'tsconfig.json',
        })
        .catch(() => process.exit(1))
}

build()
