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
import {
  MeasurementUnit,
  RecipeIngredient,
} from '@/domain/enterprise/entities/recipe-ingredient'
import { PrismaRecipeMapper } from '@/infra/database/prisma/mappers/prisma-recipe-mapper'
import { PrismaRecipeIngredientMapper } from '@/infra/database/prisma/mappers/prisma-recipe-ingredient-mapper'
import { PrismaTagMapper } from '@/infra/database/prisma/mappers/prisma-tag-mapper'
import { PrismaIngredientMapper } from '@/infra/database/prisma/mappers/prisma-ingredient-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { Tag } from '@/domain/enterprise/entities/tag'
import { Ingredient } from '@/domain/enterprise/entities/ingredient'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'
import { makeIngredient, IngredientFactory } from './make-ingredient'
import { makeRecipeIngredient } from './make-recipe-ingredient'
import { TagFactory } from './make-tag'

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

export type CreateRecipeHttpBody = Omit<CreateRecipeUseCaseRequest, 'authorId'>

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

export type MakePublishableRecipeOverride = Partial<RecipeProps> & {
  ingredientName?: string
}

export type MakePrismaPublishableRecipeOverride =
  MakePublishableRecipeOverride & {
    tagName?: string
  }

export function makePublishableRecipe(
  override: MakePublishableRecipeOverride = {},
  id?: UniqueEntityID,
) {
  const { ingredientName = 'Salt', ...recipeProps } = override
  const recipeId = id ?? new UniqueEntityID()

  const ingredient = makeIngredient({ name: ingredientName })
  const recipeIngredient = makeRecipeIngredient({
    recipeId,
    ingredientId: ingredient.id,
    unit: MeasurementUnit.TEASPOON,
  })

  const recipe = makeRecipe(
    {
      ingredients: new RecipeIngredientList([recipeIngredient]),
      ...recipeProps,
    },
    recipeId,
  )

  return { recipe, recipeIngredient, ingredient }
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
    tags: makeTagsInput(),
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

export function makeCreateRecipeHttpBody(
  override: Partial<CreateRecipeHttpBody> = {},
): CreateRecipeHttpBody {
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
  constructor(
    private prisma: PrismaService,
    private tagFactory: TagFactory,
    private ingredientFactory: IngredientFactory,
  ) {}

  async makePrismaPublishableRecipe(
    override: MakePrismaPublishableRecipeOverride = {},
    id?: UniqueEntityID,
  ): Promise<Recipe> {
    const {
      tagName = 'dinner',
      ingredientName,
      tagsIds,
      ingredients,
      ...recipeProps
    } = override

    const tag = await this.tagFactory.makePrismaTag({ name: tagName })
    const ingredient = await this.ingredientFactory.makePrismaIngredient(
      ingredientName ? { name: ingredientName } : {},
    )

    const defaultIngredients = new RecipeIngredientList([
      makeRecipeIngredient({
        ingredientId: ingredient.id,
        unit: MeasurementUnit.TEASPOON,
      }),
    ])

    return this.makePrismaRecipe(
      {
        ...recipeProps,
        tagsIds: tagsIds ?? [tag.id],
        ingredients: ingredients ?? defaultIngredients,
      },
      id,
    )
  }

  async makePrismaRecipe(
    data: Partial<RecipeProps> = {},
    id?: UniqueEntityID,
  ): Promise<Recipe> {
    const recipe = makeRecipe(data, id)

    for (const tagId of recipe.tagsIds) {
      const existingTag = await this.prisma.tag.findUnique({
        where: { id: tagId.toString() },
      })

      if (!existingTag) {
        const tag = Tag.create(
          {
            name: `tag-${tagId.toString()}`,
          },
          tagId,
        )

        await this.prisma.tag.create({
          data: PrismaTagMapper.toPrisma(tag),
        })
      }
    }

    await this.prisma.recipe.create({
      data: {
        ...PrismaRecipeMapper.toPrisma(recipe),
        tags: {
          connect: recipe.tagsIds.map((tagId) => ({
            id: tagId.toString(),
          })),
        },
      },
    })

    for (const recipeIngredient of recipe.ingredients.getItems()) {
      const ingredientId = recipeIngredient.ingredientId.toString()
      const existingIngredient = await this.prisma.ingredient.findUnique({
        where: { id: ingredientId },
      })

      if (!existingIngredient) {
        const ingredient = Ingredient.create(
          { name: `ingredient-${ingredientId}` },
          recipeIngredient.ingredientId,
        )

        await this.prisma.ingredient.create({
          data: PrismaIngredientMapper.toPrisma(ingredient),
        })
      }

      const persistedRecipeIngredient = RecipeIngredient.create(
        {
          recipeId: recipe.id,
          ingredientId: recipeIngredient.ingredientId,
          amount: recipeIngredient.amount,
          unit: recipeIngredient.unit,
          position: recipeIngredient.position,
          note: recipeIngredient.note,
        },
        recipeIngredient.id,
      )

      await this.prisma.recipeIngredient.create({
        data: PrismaRecipeIngredientMapper.toPrisma(persistedRecipeIngredient),
      })
    }

    return recipe
  }
}
