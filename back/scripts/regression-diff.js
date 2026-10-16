// npm run snapshot:diff -- before.json after.json
// Prints every differing leaf as `path: before -> after`, grouped under its top-level key, with arrays compared index
// by index (an instruction list shows the one line that moved, at its index). Ends with the number of top-level keys
// COMPARED, so an empty or truncated snapshot cannot pass as clean. Exit 0 identical, 1 changed, 2 unusable input.
const fs = require('node:fs')

const refuse = message => {
    console.error(`snapshot:diff: ${message}`)
    process.exit(2)
}
const read = file => {
    if (!file) refuse('usage: regression-diff.js before.json after.json')
    let value
    try {
        value = JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch (error) {
        refuse(`${file}: ${error.message}`)
    }
    if (!value || typeof value !== 'object' || Array.isArray(value) || !Object.keys(value).length) refuse(`${file} has no top-level keys`)
    return value
}

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const show = value => value === undefined ? '(absent)' : JSON.stringify(value)
const step = name => /^[A-Za-z_$][\w$]*$/.test(name) ? `.${name}` : `[${JSON.stringify(name)}]`

const compare = (left, right, at, changes) => {
    if (JSON.stringify(left) === JSON.stringify(right)) return
    if (isObject(left) && isObject(right)) {
        for (const name of [...new Set([...Object.keys(left), ...Object.keys(right)])].sort()) compare(left[name], right[name], at + step(name), changes)
        return
    }
    if (Array.isArray(left) && Array.isArray(right)) {
        for (let index = 0; index < Math.max(left.length, right.length); index++) compare(left[index], right[index], `${at}[${index}]`, changes)
        return
    }
    changes.push(`${at}: ${show(left)} -> ${show(right)}`)
}

const before = read(process.argv[2])
const after = read(process.argv[3])
const onlyBefore = Object.keys(before).filter(key => !(key in after)).sort()
const onlyAfter = Object.keys(after).filter(key => !(key in before)).sort()
const compared = Object.keys(before).filter(key => key in after).sort()
let changedKeys = 0
let leaves = 0
for (const key of compared) {
    const changes = []
    compare(before[key], after[key], key, changes)
    if (!changes.length) continue
    changedKeys++
    leaves += changes.length
    console.log(`== ${key}  (${changes.length})`)
    for (const change of changes) console.log(`  ${change}`)
}
for (const key of onlyBefore) console.log(`== ${key}  ONLY IN ${process.argv[2]}`)
for (const key of onlyAfter) console.log(`== ${key}  ONLY IN ${process.argv[3]}`)
console.log(`KEYS ${compared.length}  CHANGED ${changedKeys}  LEAVES ${leaves}  ONLY-BEFORE ${onlyBefore.length}  ONLY-AFTER ${onlyAfter.length}`)
if (changedKeys || onlyBefore.length || onlyAfter.length) process.exitCode = 1
