const fs = require('node:fs')

const before = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const after = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'))
const changes = []
const compare = (left, right, key = '') => {
    if (JSON.stringify(left) === JSON.stringify(right)) return
    if (left && right && typeof left === 'object' && typeof right === 'object' && !Array.isArray(left) && !Array.isArray(right)) {
        for (const name of [...new Set([...Object.keys(left), ...Object.keys(right)])].sort()) compare(left[name], right[name], key ? `${key}.${name}` : name)
        return
    }
    changes.push(`${key}: ${JSON.stringify(left)} -> ${JSON.stringify(right)}`)
}
compare(before, after)
for (const change of changes) console.log(change)
console.log(`KEYS ${new Set(changes.map(change => change.split(/[.:]/)[0])).size}  CHANGED ${changes.length}`)
if (changes.length) process.exitCode = 1
