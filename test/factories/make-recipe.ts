import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  DifficultyLevel,
  Recipe,
  RecipeProps,
} from '@/domain/enterprise/entities/recipe'
import { CreateRecipeUseCaseRequest } from '@/domain/application/use-cases/create-recipe'
import { PrismaRecipeMapper } from '@/infra/database/prisma/mappers/prisma-recipe-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'

type RecipeScalars = Pick<
  CreateRecipeUseCaseRequest,
  | 'name'
  | 'description'
  | 'instructions'
  | 'prepTimeInMinutes'
  | 'cookTimeInMinutes'
  | 'servings'
  | 'difficultyLevel'
>

function makeRecipeScalars(): RecipeScalars {
  return {
    name: faker.food.dish(),
    description: faker.food.description(),
    instructions: faker.lorem.paragraphs(3),
    prepTimeInMinutes: faker.number.int({ min: 5, max: 120 }),
    cookTimeInMinutes: faker.number.int({ min: 5, max: 240 }),
    servings: faker.number.int({ min: 1, max: 20 }),
    difficultyLevel: faker.helpers.arrayElement([
      DifficultyLevel.EASY,
      DifficultyLevel.MEDIUM,
      DifficultyLevel.HARD,
    ]),
  }
}

export function makeRecipe(
  override: Partial<RecipeProps> = {},
  id?: UniqueEntityID,
) {
  const recipe = Recipe.create(
    {
      authorId: new UniqueEntityID(),
      ...makeRecipeScalars(),
      tagsIds: [],
      recipeIngredientsIds: [],
      ...override,
    },
    id,
  )

  return recipe
}

/** Input for `CreateRecipeUseCase.execute` (unit specs). Not the domain entity — use `makeRecipe` for that. */
export function makeCreateRecipeUseCaseRequest(
  override: Partial<CreateRecipeUseCaseRequest> = {},
): CreateRecipeUseCaseRequest {
  return {
    authorId: new UniqueEntityID().toString(),
    ...makeRecipeScalars(),
    recipeIngredients: [
      { name: faker.food.ingredient(), amount: 2, unit: 'cups' },
      { name: faker.food.ingredient(), amount: 1, unit: 'tbsp' },
    ],
    ...override,
  }
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
