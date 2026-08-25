import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ChefFactory } from 'test/factories/make-chef'
import { IngredientFactory } from 'test/factories/make-ingredient'
import { TagFactory } from 'test/factories/make-tag'
import { RecipeFactory } from 'test/factories/make-recipe'

describe('Publish recipe (E2E)', () => {
  let app: INestApplication
  let chefFactory: ChefFactory
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
    recipeFactory = moduleRef.get(RecipeFactory)
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[POST] /recipes/:id/publish', async () => {
    const user = await chefFactory.makePrismaChef()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const recipe = await recipeFactory.makePrismaPublishableRecipe({
      authorId: user.id,
    })

    const recipeId = recipe.id.toString()

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

  // TODO: mover para unpublish-recipe.controller.e2e-spec.ts (rota distinta).
  // Não fundir com edit-recipe: são use cases e rotas diferentes.
  test('[POST] /recipes/:id/unpublish', async () => {
    const user = await chefFactory.makePrismaChef()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const recipe = await recipeFactory.makePrismaPublishableRecipe({
      authorId: user.id,
    })

    const recipeId = recipe.id.toString()

    await request(app.getHttpServer())
      .post(`/recipes/${recipeId}/publish`)
      .set('Authorization', `Bearer ${accessToken}`)

    const unpublishResponse = await request(app.getHttpServer())
      .post(`/recipes/${recipeId}/unpublish`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(unpublishResponse.statusCode).toBe(204)

    const recipeOnDatabase = await prisma.recipe.findUnique({
      where: { id: recipeId },
    })

    expect(recipeOnDatabase?.status).toBe('Draft')
  })
})
