import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
    test: {
        environment: 'jsdom',
        include: ['tests/**/*.test.tsx'],
        setupFiles: ['./tests/setup.ts'],
        // Keep the small DOM suite in one worker, including on unattended Windows runners.
        threads: false,
    },
}))
