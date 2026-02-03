import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Recipe, RecipeProps } from '@/domain/enterprise/entities/recipe'
import { PrismaRecipeMapper } from '@/infra/database/prisma/mappers/prisma-recipe-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'

export function makeRecipe(
  override: Partial<RecipeProps> = {},
  id?: UniqueEntityID,
) {
  const recipe = Recipe.create(
    {
      authorId: new UniqueEntityID(),
      name: faker.food.dish(),
      description: faker.food.description(),
      instructions: faker.lorem.paragraphs(3),
      prepTimeInMinutes: faker.number.int({ min: 5, max: 120 }),
      cookTimeInMinutes: faker.number.int({ min: 5, max: 240 }),
      servings: faker.number.int({ min: 1, max: 20 }),
      difficultyLevel: faker.helpers.arrayElement([
        'easy',
        'medium',
        'hard',
      ]) as RecipeProps['difficultyLevel'],
      tagsIds: [],
      recipeIngredientsIds: [],
      ...override,
    },
    id,
  )

  return recipe
}

@Injectable()
export class RecipeFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaRecipe(data: Partial<RecipeProps> = {}): Promise<Recipe> {
    const recipe = makeRecipe(data)

    await this.prisma.recipe.create({
      data: PrismaRecipeMapper.toPrisma(recipe),
    })

    return recipe
  }
}
