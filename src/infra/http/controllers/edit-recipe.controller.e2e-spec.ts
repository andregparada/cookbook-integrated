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

  test('[PUT] /recipes/:id with body missing recipeIngredients returns 400', async () => {
    const user = await chefFactory.makePrismaChef()

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const recipe = await recipeFactory.makePrismaRecipe({
      authorId: user.id,
    })

    const originalName = recipe.name

    const response = await request(app.getHttpServer())
      .put(`/recipes/${recipe.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'New Recipe',
      })

    expect(response.statusCode).toBe(400)
    expect(response.body).toMatchObject({
      statusCode: 400,
      message: 'Validation Failed',
    })

    const recipeOnDatabase = await prisma.recipe.findFirst({
      where: {
        id: recipe.id.toString(),
      },
    })

    expect(recipeOnDatabase?.name).toBe(originalName)
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
