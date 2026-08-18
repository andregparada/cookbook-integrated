import { Injectable } from '@nestjs/common'
import { IngredientsRepository } from '../repositories/ingredients-repository'
import { NormalizedName } from '@/domain/enterprise/entities/value-objects/normalized-name'
import { isUuid } from '@/domain/utils/is-uuid'

export type SearchIngredientTermsResolution = {
  resolvedIds: string[]
  hasUnresolved: boolean
}

@Injectable()
export class SearchIngredientTermsResolver {
  constructor(private ingredientsRepository: IngredientsRepository) {}

  async resolve(terms: string[]): Promise<SearchIngredientTermsResolution> {
    const seenKeys = new Set<string>()
    const uniqueTerms: string[] = []

    for (const term of terms) {
      const key = isUuid(term)
        ? term.toLowerCase()
        : NormalizedName.createFromText(term).value

      if (seenKeys.has(key)) {
        continue
      }

      seenKeys.add(key)
      uniqueTerms.push(term)
    }

    const resolvedIds: string[] = []
    const resolvedIdSet = new Set<string>()
    let hasUnresolved = false

    for (const term of uniqueTerms) {
      const ingredient = isUuid(term)
        ? await this.ingredientsRepository.findById(term)
        : await this.ingredientsRepository.findByNormalizedName(
            NormalizedName.createFromText(term),
          )

      if (!ingredient) {
        hasUnresolved = true
        continue
      }

      const ingredientId = ingredient.id.toString()

      if (resolvedIdSet.has(ingredientId)) {
        continue
      }

      resolvedIdSet.add(ingredientId)
      resolvedIds.push(ingredientId)
    }

    return {
      resolvedIds,
      hasUnresolved,
    }
  }
}
