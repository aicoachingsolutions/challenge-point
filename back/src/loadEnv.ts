import path from 'path'
import commandLineArgs from 'command-line-args'
import dotenv from 'dotenv'

const options = commandLineArgs([{ name: 'env', alias: 'e', type: String }], { partial: true })

function resolveEnvFileSuffix(): string {
    if (options.env) {
        return options.env
    }
    // Bundled output lives in dist/ with only .env.production copied at build time
    if (path.basename(__dirname) === 'dist') {
        return 'production'
    }
    if (process.env.NODE_ENV === 'production') {
        return 'production'
    }
    return 'development'
}

const suffix = resolveEnvFileSuffix()
const envPath = path.join(__dirname, `.env.${suffix}`)
const result = dotenv.config({ path: envPath })

if (result.error) {
    console.warn(`[loadEnv] Could not load ${envPath}: ${result.error.message}`)
}
