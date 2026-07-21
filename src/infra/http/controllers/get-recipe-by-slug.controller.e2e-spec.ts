import { AppModule } from '@/infra/app.module'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import { ChefFactory } from 'test/factories/make-chef'
import { RecipeFactory } from 'test/factories/make-recipe'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { Slug } from '@/domain/enterprise/entities/value-objects/slug'

describe('Get recipe by slug (E2E', () => {
  let app: INestApplication
  let chefFactory: ChefFactory
  let recipeFactory: RecipeFactory
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [ChefFactory, RecipeFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    chefFactory = moduleRef.get(ChefFactory)
    recipeFactory = moduleRef.get(RecipeFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[GET] /recipes/:slug', async () => {
    const user = await chefFactory.makePrismaChef({
      userName: 'johndoe',
    })

    const accessToken = jwt.sign({ sub: user.id.toString() })

    await recipeFactory.makePrismaRecipe({
      authorId: user.id,
      name: 'Receita 01',
      slug: Slug.create('receita-01'),
    })

    const response = await request(app.getHttpServer())
      .get(`/recipes/receita-01`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      recipe: expect.objectContaining({
        name: 'Receita 01',
        author: 'johndoe',
      }),
    })
  })
})
