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
