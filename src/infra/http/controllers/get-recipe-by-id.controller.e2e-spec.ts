import { AppModule } from '@/infra/app.module'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import { randomUUID } from 'node:crypto'
import { ChefFactory } from 'test/factories/make-chef'
import { RecipeFactory } from 'test/factories/make-recipe'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'

describe('Get recipe by id (E2E)', () => {
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

  test('[GET] /recipes/:id', async () => {
    const user = await chefFactory.makePrismaChef({
      userName: 'johndoe',
    })

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const recipe = await recipeFactory.makePrismaRecipe({
      authorId: user.id,
      name: 'Receita 01',
    })

    const response = await request(app.getHttpServer())
      .get(`/recipes/${recipe.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      recipe: expect.objectContaining({
        name: 'Receita 01',
        author: 'johndoe',
        slug: expect.objectContaining({
          value: recipe.slug.value,
        }),
      }),
    })
  })

  test('[GET] /recipes/:id should return 404 when recipe does not exist', async () => {
    const user = await chefFactory.makePrismaChef()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .get(`/recipes/${randomUUID()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(404)
  })
})
