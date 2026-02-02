import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Recipe } from '@/domain/enterprise/entities/recipe'
import { Prisma, Recipe as PrismaRecipe } from '@prisma/client'
import {
  mapDifficultyLevelToDomain,
  mapDifficultyLevelToPrisma,
} from './enum-mappers'

export class PrismaRecipeMapper {
  static toDomain(raw: PrismaRecipe): Recipe {
    if (raw.description === null || raw.difficultyLevel === null) {
      throw new Error('Invalid recipe data')
    }

    return Recipe.create(
      {
        authorId: new UniqueEntityID(raw.authorId),
        name: raw.name,
        description: raw.description,
        instructions: raw.instructions,
        prepTimeInMinutes: raw.prepTime,
        cookTimeInMinutes: raw.cookTime,
        servings: raw.servings,
        difficultyLevel: mapDifficultyLevelToDomain(raw.difficultyLevel),
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(recipe: Recipe): Prisma.RecipeUncheckedCreateInput {
    return {
      id: recipe.id.toString(),
      slug: recipe.slug.value,
      name: recipe.name,
      description: recipe.description,
      instructions: recipe.instructions,
      prepTime: recipe.prepTimeInMinutes,
      cookTime: recipe.cookTimeInMinutes,
      servings: recipe.servings,
      difficultyLevel: mapDifficultyLevelToPrisma(recipe.difficultyLevel),
      authorId: recipe.authorId.toString(),
    }
  }
}
