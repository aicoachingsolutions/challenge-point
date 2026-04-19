import { ICategory } from '../models/category.model'
import { SystemPipelineError } from './types'
import { overlapScore, scoreKeywordMatches, tokenize } from './text'

export function inferCategoryIdFromText(sourceText: string, categories: ICategory[]): string {
    const sourceTokens = tokenize(sourceText)

    const ranked = categories
        .map((category) => {
            const categoryText = `${category.name} ${category.description ?? ''}`
            const categoryTokens = tokenize(categoryText)
            const score =
                overlapScore(sourceTokens, categoryTokens, 4) +
                scoreKeywordMatches(sourceText, [category.name, category.description ?? ''], 8)

            return {
                category,
                score,
            }
        })
        .sort((left, right) => right.score - left.score || left.category.name.localeCompare(right.category.name))

    if (!ranked[0] || ranked[0].score <= 0) {
        throw new SystemPipelineError(
            'category-inference',
            'Could not infer a category from the current library item using the available category metadata.'
        )
    }

    return ranked[0].category._id
}
