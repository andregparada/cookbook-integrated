import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { CreateRecipeUseCaseRequest } from '@/domain/application/use-cases/create-recipe'
import { EditRecipeUseCaseRequest } from '@/domain/application/use-cases/edit-recipe'
import { PublishRecipeUseCaseRequest } from '@/domain/application/use-cases/publish-recipe'
import { UnpublishRecipeUseCaseRequest } from '@/domain/application/use-cases/unpublish-recipe'
import { DeleteRecipeUseCaseRequest } from '@/domain/application/use-cases/delete-recipe'
import {
  DifficultyLevel,
  Recipe,
  RecipeProps,
} from '@/domain/enterprise/entities/recipe'
import { RecipeIngredientList } from '@/domain/enterprise/entities/recipe-ingredient-list'
import { MeasurementUnit } from '@/domain/enterprise/entities/recipe-ingredient'
import { PrismaRecipeMapper } from '@/infra/database/prisma/mappers/prisma-recipe-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'

type RecipeScalars = {
  name: string
  description: string
  instructions: string
  prepTimeInMinutes: number | null
  cookTimeInMinutes: number | null
  servings: number | null
  difficultyLevel: DifficultyLevel
}

type RecipeIngredientInput = NonNullable<
  CreateRecipeUseCaseRequest['recipeIngredients']
>[number]

export type EditRecipeHttpBody = Omit<
  EditRecipeUseCaseRequest,
  'recipeId' | 'actorId'
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

export function makeTagsInput(): string[] {
  return ['tag1', 'tag2']
}

export function makeRecipeIngredientsInput(): RecipeIngredientInput[] {
  return [
    { name: faker.food.ingredient(), amount: 2, unit: MeasurementUnit.CUP },
    {
      name: faker.food.ingredient(),
      amount: 1,
      unit: MeasurementUnit.TABLESPOON,
    },
  ]
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
      ingredients: new RecipeIngredientList(),
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
    recipeIngredients: makeRecipeIngredientsInput(),
    ...override,
  }
}

/** Input for `EditRecipeUseCase.execute` (unit specs). Not the domain entity — use `makeRecipe` for that. */
export function makeEditRecipeUseCaseRequest(
  override: Partial<EditRecipeUseCaseRequest> = {},
): EditRecipeUseCaseRequest {
  return {
    recipeId: new UniqueEntityID().toString(),
    actorId: new UniqueEntityID().toString(),
    ...makeRecipeScalars(),
    tags: makeTagsInput(),
    recipeIngredients: makeRecipeIngredientsInput(),
    ...override,
  }
}

export function makeEditRecipeHttpBody(
  override: Partial<EditRecipeHttpBody> = {},
): EditRecipeHttpBody {
  return {
    ...makeRecipeScalars(),
    tags: makeTagsInput(),
    recipeIngredients: makeRecipeIngredientsInput(),
    ...override,
  }
}

export function makePublishRecipeUseCaseRequest(
  override: Partial<PublishRecipeUseCaseRequest> = {},
): PublishRecipeUseCaseRequest {
  return {
    recipeId: new UniqueEntityID().toString(),
    actorId: new UniqueEntityID().toString(),
    ...override,
  }
}

export function makeUnpublishRecipeUseCaseRequest(
  override: Partial<UnpublishRecipeUseCaseRequest> = {},
): UnpublishRecipeUseCaseRequest {
  return {
    recipeId: new UniqueEntityID().toString(),
    actorId: new UniqueEntityID().toString(),
    ...override,
  }
}

export function makeDeleteRecipeUseCaseRequest(
  override: Partial<DeleteRecipeUseCaseRequest> = {},
): DeleteRecipeUseCaseRequest {
  return {
    recipeId: new UniqueEntityID().toString(),
    actorId: new UniqueEntityID().toString(),
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
