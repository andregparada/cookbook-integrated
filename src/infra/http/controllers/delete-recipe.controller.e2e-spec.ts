import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ChefFactory } from 'test/factories/make-chef'

describe('Delete recipe (E2E)', () => {
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

  test('[DELETE] /recipes/:id', async () => {
    const user = await chefFactory.makePrismaChef()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    // TODO: usar factory
    const createResponse = await request(app.getHttpServer())
      .post('/recipes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Deletable Recipe',
        description: 'Description',
        instructions: 'Cook it.',
        prepTimeInMinutes: 10,
        cookTimeInMinutes: 20,
        servings: 2,
        difficultyLevel: 'easy',
        tags: ['dinner'],
        recipeIngredients: [{ name: 'Salt', amount: 1, unit: 'teaspoon' }],
      })

    // TODO: tirar esse spec expect — 201 do POST /recipes já está no e2e de create.
    expect(createResponse.statusCode).toBe(201)

    const recipeOnDatabase = await prisma.recipe.findFirst({
      where: { authorId: user.id.toString() },
      orderBy: { createdAt: 'desc' },
    })

    const recipeId = recipeOnDatabase!.id

    const ingredientBeforeDelete = await prisma.ingredient.findFirst({
      where: { name: 'Salt' },
    })

    const tagBeforeDelete = await prisma.tag.findFirst({
      where: { name: 'dinner' },
    })

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(deleteResponse.statusCode).toBe(204)

    const recipeOnDatabaseAfterDelete = await prisma.recipe.findUnique({
      where: { id: recipeId },
    })

    expect(recipeOnDatabaseAfterDelete?.deletedAt).toBeTruthy()

    const getResponse = await request(app.getHttpServer())
      .get(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    // TODO: tirar esse spec expect — soft-deleted → not found já está no unit de
    // get-recipe-by-id; 404 HTTP já está no e2e desse GET. Aqui basta deletedAt.
    expect(getResponse.statusCode).toBe(404)

    const ingredientAfterDelete = await prisma.ingredient.findUnique({
      where: { id: ingredientBeforeDelete!.id },
    })

    const tagAfterDelete = await prisma.tag.findUnique({
      where: { id: tagBeforeDelete!.id },
    })

    // TODO: tirar esses spec expect — mover para delete-recipe.spec.ts
    // (catálogo global Ingredient/Tag sobrevive ao soft delete; Sugestão 5).
    expect(ingredientAfterDelete).toBeTruthy()
    expect(tagAfterDelete).toBeTruthy()
  })
})
