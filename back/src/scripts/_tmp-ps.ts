import { sessionPlanningModel } from '../system/session-planning/session-planning-model'
const m: any = sessionPlanningModel
for (const id of ['A01', 'A05', 'A04', 'TA01', 'TA02', 'A02', 'A03', 'A06', 'D01', 'D02', 'D03', 'TD01', 'TD02']) {
    const ps = m.practiceSituationsFor(id)
    console.log(`${id.padEnd(5)} -> ${ps.length} situation(s): ${JSON.stringify(ps).slice(0, 320)}`)
}
