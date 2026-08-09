import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { ChefFactory } from 'test/factories/make-chef'
import {
  makeEditRecipeHttpBody,
  RecipeFactory,
} from 'test/factories/make-recipe'

describe('Edit recipe (E2E)', () => {
  let app: INestApplication
  let chefFactory: ChefFactory
  let recipeFactory: RecipeFactory
  let prisma: PrismaService
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [ChefFactory, RecipeFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    chefFactory = moduleRef.get(ChefFactory)
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
    const originalSlug = recipe.slug.value
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
    expect(recipeOnDatabase?.slug).toBe(originalSlug)
    expect(recipeOnDatabase?.createdAt).toEqual(originalCreatedAt)
    expect(recipeOnDatabase?.tags).toHaveLength(editRecipeBody.tags.length)
    expect(recipeOnDatabase?.ingredients).toHaveLength(
      editRecipeBody.recipeIngredients.length,
    )
  })

  test('[PUT] /recipes/:id should preserve recipe ingredient id on update', async () => {
    const user = await chefFactory.makePrismaChef()

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const createResponse = await request(app.getHttpServer())
      .post('/recipes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Recipe With Ingredients',
        instructions: 'Mix ingredients.',
        difficultyLevel: 'easy',
        tags: ['dinner'],
        recipeIngredients: [{ name: 'Salt', amount: 1, unit: 'teaspoon' }],
      })

    expect(createResponse.statusCode).toBe(201)

    const createdRecipe = await prisma.recipe.findFirst({
      where: {
        authorId: user.id.toString(),
        name: 'Recipe With Ingredients',
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
      .send({
        name: 'Recipe With Ingredients',
        instructions: 'Mix ingredients.',
        difficultyLevel: 'easy',
        tags: ['dinner'],
        recipeIngredients: [
          {
            id: recipeIngredientId,
            name: 'Salt',
            amount: 2,
            unit: 'tablespoon',
            note: 'para polvilhar',
          },
        ],
      })

    expect(response.statusCode).toBe(204)

    const recipeOnDatabase = await prisma.recipeIngredient.findFirst({
      where: {
        id: recipeIngredientId,
      },
    })

    expect(recipeOnDatabase).toBeTruthy()
    expect(recipeOnDatabase?.amount).toBe(2)
    expect(recipeOnDatabase?.unit).toBe('Tablespoon')
    expect(recipeOnDatabase?.position).toBe(0)
    expect(recipeOnDatabase?.note).toBe('para polvilhar')
  })

  test('[PUT] /recipes/:id should reject body without required arrays', async () => {
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
        recipeIngredients: [{ name: 'Ingredient 1', amount: 2, unit: 'cup' }],
      })

    expect(response.statusCode).toBe(400)
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
