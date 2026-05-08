require('ts-node').register({
    files: true,
    project: __dirname + '/tsconfig.json',
})

require('./src/scripts/run-local-create-activity-test.ts')
