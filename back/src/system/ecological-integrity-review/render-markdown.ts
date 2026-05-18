import type { EcologicalIntegrityReport } from './types'

function formatReviewTimestamp(timestamp: string): string {
    const date = new Date(timestamp)

    if (Number.isNaN(date.getTime())) {
        return `${timestamp} UTC`
    }

    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes} UTC`
}

function appendBulletedSection(lines: string[], heading: string, items: string[], italicize = false): void {
    if (items.length === 0) return

    lines.push(`### ${heading}`)
    for (const item of items) {
        lines.push(italicize ? `- _${item}_` : `- ${item}`)
    }
    lines.push('')
}

export function renderReportAsMarkdown(report: EcologicalIntegrityReport): string {
    const lines: string[] = [`# Ecological Integrity Review — ${report.activityRef.title}`, '']

    if (report.activityRef.archetypeName !== undefined) {
        lines.push(`Archetype: ${report.activityRef.archetypeName}`)
    }

    if (report.activityRef.slotIndex !== undefined) {
        lines.push(`Slot index: ${report.activityRef.slotIndex}`)
    }

    lines.push(`Review timestamp: ${formatReviewTimestamp(report.reviewTimestamp)}`)
    lines.push(`Review layer version: ${report.reviewLayerVersion}`)
    lines.push('')

    for (const finding of report.findings) {
        lines.push(`## ${finding.category}`)
        lines.push('')

        appendBulletedSection(lines, 'Preserved interaction properties', finding.preservedInteractionProperties)
        appendBulletedSection(lines, 'Removed interaction properties', finding.removedInteractionProperties)
        appendBulletedSection(lines, 'Possible tradeoffs', finding.possibleTradeoffs)
        appendBulletedSection(lines, 'Possible ecological drift risks', finding.possibleEcologicalDriftRisks)
        appendBulletedSection(lines, 'Review notes', finding.reviewNotes, true)

        const hasObservations =
            finding.preservedInteractionProperties.length > 0 ||
            finding.removedInteractionProperties.length > 0 ||
            finding.possibleTradeoffs.length > 0 ||
            finding.possibleEcologicalDriftRisks.length > 0 ||
            finding.reviewNotes.length > 0

        if (!hasObservations) {
            lines.push('_No observations surfaced for this category._')
            lines.push('')
        }
    }

    if (report.crossCategoryObservations.length > 0) {
        lines.push('## Cross-category observations')
        lines.push('')

        for (const observation of report.crossCategoryObservations) {
            lines.push(`- ${observation}`)
        }

        lines.push('')
    }

    lines.push(
        '_This report describes observable interaction properties. It is not a pass/fail determination or an ecological correctness rating._',
    )

    return lines.join('\n')
}
