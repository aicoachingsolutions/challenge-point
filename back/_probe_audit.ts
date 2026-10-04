import { loadCorpusContracts } from './src/system/derivation/corpus'
const cs = loadCorpusContracts()
for (const c of cs) for (const it of (c.items ?? []) as any[]) {
  if (String(it.row) === 'P2' || String(it.itemId ?? '').includes('GF2-14') || String(it.row)==='P3') {
    console.log(JSON.stringify({ contract: (c as any).contractId, itemId: it.itemId, row: it.row, basis: it.basis, valueStatus: it.valueStatus, relation: it.relation, value: it.value }, null, 1))
  }
}
console.log('--- all items whose value matches /equal/i ---')
for (const c of cs) for (const it of (c.items ?? []) as any[]) {
  if (/equal/i.test(String(it.value ?? ''))) console.log((c as any).contractId, it.itemId, 'row=', it.row, 'basis=', it.basis, 'valueStatus=', it.valueStatus, '|', String(it.value).slice(0,140))
}
