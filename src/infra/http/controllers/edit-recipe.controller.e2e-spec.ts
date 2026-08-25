import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { ChefFactory } from 'test/factories/make-chef'
import { IngredientFactory } from 'test/factories/make-ingredient'
import { TagFactory } from 'test/factories/make-tag'
import {
  makeEditRecipeHttpBody,
  RecipeFactory,
} from 'test/factories/make-recipe'
import { makeRecipeIngredient } from 'test/factories/make-recipe-ingredient'
import { RecipeIngredientList } from '@/domain/enterprise/entities/recipe-ingredient-list'
import { MeasurementUnit } from '@/domain/enterprise/entities/recipe-ingredient'

describe('Edit recipe (E2E)', () => {
  let app: INestApplication
  let chefFactory: ChefFactory
  let tagFactory: TagFactory
  let ingredientFactory: IngredientFactory
  let recipeFactory: RecipeFactory
  let prisma: PrismaService
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [ChefFactory, TagFactory, IngredientFactory, RecipeFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    chefFactory = moduleRef.get(ChefFactory)
    tagFactory = moduleRef.get(TagFactory)
    ingredientFactory = moduleRef.get(IngredientFactory)
    recipeFactory = moduleRef.get(RecipeFactory)
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[PUT] /recipes/:id', async () => {
    const user = await chefFactory.makePrismaChef()

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const recipe = await recipeFactory.makePrismaRecipe({
      authorId: user.id,
    })

    const recipeId = recipe.id.toString()
    const originalCreatedAt = recipe.createdAt

    const editRecipeBody = makeEditRecipeHttpBody()

    const response = await request(app.getHttpServer())
      .put(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(editRecipeBody)

    expect(response.statusCode).toBe(204)

    const recipeOnDatabase = await prisma.recipe.findFirst({
      where: {
        name: editRecipeBody.name,
        description: editRecipeBody.description,
      },
      include: {
        tags: true,
        ingredients: true,
      },
    })

    expect(recipeOnDatabase).toBeTruthy()
    expect(recipeOnDatabase?.createdAt).toEqual(originalCreatedAt)
    expect(recipeOnDatabase?.tags).toHaveLength(
      editRecipeBody.tags?.length ?? 0,
    )
    expect(recipeOnDatabase?.ingredients).toHaveLength(
      editRecipeBody.recipeIngredients.length,
    )
  })

  // TODO: esse teste é necessário? ele deve ser unit?
  test('[PUT] /recipes/:id should preserve recipe ingredient id on update', async () => {
    const user = await chefFactory.makePrismaChef()

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const ingredient = await ingredientFactory.makePrismaIngredient({
      name: 'Salt',
    })

    const recipe = await recipeFactory.makePrismaRecipe({
      authorId: user.id,
      ingredients: new RecipeIngredientList([
        makeRecipeIngredient({
          ingredientId: ingredient.id,
          unit: MeasurementUnit.TEASPOON,
        }),
      ]),
    })

    const createdRecipe = await prisma.recipe.findFirst({
      where: {
        id: recipe.id.toString(),
      },
      include: {
        ingredients: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    })

    const recipeIngredientId = createdRecipe?.ingredients[0].id

    const response = await request(app.getHttpServer())
      .put(`/recipes/${createdRecipe?.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(
        makeEditRecipeHttpBody({
          recipeIngredients: [
            {
              id: recipeIngredientId,
              name: 'Salt',
              amount: 1,
              unit: MeasurementUnit.TEASPOON,
            },
          ],
        }),
      )

    expect(response.statusCode).toBe(204)

    const recipeOnDatabase = await prisma.recipeIngredient.findFirst({
      where: {
        id: recipeIngredientId,
      },
    })

    expect(recipeOnDatabase).toBeTruthy()
  })

  // TODO: Esse teste não é unit? se for para mapear o 400, deve renomear
  test('[PUT] /recipes/:id should reject body without recipeIngredients', async () => {
    const user = await chefFactory.makePrismaChef()

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const recipe = await recipeFactory.makePrismaRecipe({
      authorId: user.id,
    })

    const response = await request(app.getHttpServer())
      .put(`/recipes/${recipe.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'New Recipe',
      })

    expect(response.statusCode).toBe(400)
  })

  // TODO: Esse teste não é unit?
  test('[PUT] /recipes/:id should preserve tags when tags are omitted', async () => {
    const user = await chefFactory.makePrismaChef()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const dinnerTag = await tagFactory.makePrismaTag({ name: 'dinner' })
    const quickTag = await tagFactory.makePrismaTag({ name: 'quick' })
    const ingredient = await ingredientFactory.makePrismaIngredient({
      name: 'Salt',
    })

    const recipe = await recipeFactory.makePrismaRecipe({
      authorId: user.id,
      tagsIds: [dinnerTag.id, quickTag.id],
      ingredients: new RecipeIngredientList([
        makeRecipeIngredient({
          ingredientId: ingredient.id,
          unit: MeasurementUnit.TEASPOON,
        }),
      ]),
    })

    const createdRecipe = await prisma.recipe.findFirst({
      where: {
        id: recipe.id.toString(),
      },
      include: {
        tags: true,
      },
    })

    const originalTagIds = createdRecipe?.tags.map((tag) => tag.id).sort()

    const response = await request(app.getHttpServer())
      .put(`/recipes/${createdRecipe?.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(
        makeEditRecipeHttpBody({
          tags: undefined,
          recipeIngredients: [
            { name: 'Salt', amount: 1, unit: MeasurementUnit.TEASPOON },
          ],
        }),
      )

    expect(response.statusCode).toBe(204)

    const recipeOnDatabase = await prisma.recipe.findFirst({
      where: {
        id: createdRecipe?.id,
      },
      include: {
        tags: true,
      },
    })

    expect(recipeOnDatabase?.tags.map((tag) => tag.id).sort()).toEqual(
      originalTagIds,
    )
  })

  test('[PUT] /recipes/:id should return 404 when recipe does not exist', async () => {
    const user = await chefFactory.makePrismaChef()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .put(`/recipes/${randomUUID()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(makeEditRecipeHttpBody())

    expect(response.statusCode).toBe(404)
  })
})
