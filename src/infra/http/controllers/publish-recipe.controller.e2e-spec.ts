import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
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
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [ChefFactory, TagFactory, IngredientFactory, RecipeFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    chefFactory = moduleRef.get(ChefFactory)
    recipeFactory = moduleRef.get(RecipeFactory)
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
  })
})
