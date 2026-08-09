import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ChefFactory } from 'test/factories/make-chef'

describe('Publish recipe (E2E)', () => {
  let app: INestApplication
  let chefFactory: ChefFactory
  let prisma: PrismaService
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [ChefFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    chefFactory = moduleRef.get(ChefFactory)
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[POST] /recipes/:id/publish', async () => {
    const user = await chefFactory.makePrismaChef()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const createResponse = await request(app.getHttpServer())
      .post('/recipes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Publishable Recipe',
        description: 'Description',
        instructions: 'Cook it.',
        prepTimeInMinutes: 10,
        cookTimeInMinutes: 20,
        servings: 2,
        difficultyLevel: 'easy',
        tags: ['dinner'],
        recipeIngredients: [{ name: 'Salt', amount: 1, unit: 'teaspoon' }],
      })

    expect(createResponse.statusCode).toBe(201)

    const recipeOnDatabase = await prisma.recipe.findFirst({
      where: { authorId: user.id.toString() },
      orderBy: { createdAt: 'desc' },
    })

    const recipeId = recipeOnDatabase!.id

    const publishResponse = await request(app.getHttpServer())
      .post(`/recipes/${recipeId}/publish`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(publishResponse.statusCode).toBe(204)

    const recipeOnDatabaseAfterPublish = await prisma.recipe.findUnique({
      where: { id: recipeId },
    })

    expect(recipeOnDatabaseAfterPublish?.status).toBe('Published')
    expect(recipeOnDatabaseAfterPublish?.publishedAt).toBeTruthy()
  })

  test('[POST] /recipes/:id/unpublish', async () => {
    const user = await chefFactory.makePrismaChef()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const createResponse = await request(app.getHttpServer())
      .post('/recipes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Unpublishable Recipe',
        description: 'Description',
        instructions: 'Cook it.',
        prepTimeInMinutes: 10,
        cookTimeInMinutes: 20,
        servings: 2,
        difficultyLevel: 'easy',
        tags: ['dinner'],
        recipeIngredients: [{ name: 'Pepper', amount: 1, unit: 'teaspoon' }],
      })

    expect(createResponse.statusCode).toBe(201)

    const recipeOnDatabaseAfterCreate = await prisma.recipe.findFirst({
      where: { authorId: user.id.toString() },
      orderBy: { createdAt: 'desc' },
    })

    const recipeId = recipeOnDatabaseAfterCreate!.id

    await request(app.getHttpServer())
      .post(`/recipes/${recipeId}/publish`)
      .set('Authorization', `Bearer ${accessToken}`)

    const publishedRecipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    })

    const unpublishResponse = await request(app.getHttpServer())
      .post(`/recipes/${recipeId}/unpublish`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(unpublishResponse.statusCode).toBe(204)

    const recipeOnDatabase = await prisma.recipe.findUnique({
      where: { id: recipeId },
    })

    expect(recipeOnDatabase?.status).toBe('Draft')
    expect(recipeOnDatabase?.publishedAt).toEqual(publishedRecipe?.publishedAt)
  })
})
