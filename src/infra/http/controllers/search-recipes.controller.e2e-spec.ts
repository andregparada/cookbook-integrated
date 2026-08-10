import { AppModule } from '@/infra/app.module'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import { ChefFactory } from 'test/factories/make-chef'
import { RecipeFactory } from 'test/factories/make-recipe'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { RecipeStatus } from '@/domain/enterprise/entities/recipe'

describe('Search recipes (E2E)', () => {
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

  test('[GET] /recipes returns published recipes without authentication', async () => {
    const user = await chefFactory.makePrismaChef({
      userName: 'public_author',
    })

    await recipeFactory.makePrismaRecipe({
      authorId: user.id,
      name: 'Public Recipe',
      status: RecipeStatus.PUBLISHED,
      publishedAt: new Date(),
    })

    const response = await request(app.getHttpServer()).get('/recipes')

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      items: expect.arrayContaining([
        expect.objectContaining({
          name: 'Public Recipe',
          slug: expect.any(String),
          descriptionExcerpt: expect.anything(),
          tags: expect.any(Array),
        }),
      ]),
      meta: expect.objectContaining({
        page: 1,
        perPage: 20,
        totalItems: expect.any(Number),
        totalPages: expect.any(Number),
      }),
    })

    const publicRecipe = response.body.items.find(
      (item: { name: string }) => item.name === 'Public Recipe',
    )

    expect(publicRecipe).not.toHaveProperty('status')
    expect(publicRecipe).not.toHaveProperty('author')
    expect(publicRecipe).not.toHaveProperty('prepTimeInMinutes')
  })

  test('[GET] /recipes?scope=mine returns own draft recipes with JWT', async () => {
    const user = await chefFactory.makePrismaChef({
      userName: 'mine_author',
    })

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const draftRecipe = await recipeFactory.makePrismaRecipe({
      authorId: user.id,
      name: 'My Draft',
      status: RecipeStatus.DRAFT,
    })

    const response = await request(app.getHttpServer())
      .get('/recipes?scope=mine')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      items: expect.arrayContaining([
        expect.objectContaining({
          name: 'My Draft',
          status: RecipeStatus.DRAFT,
          recipeId: draftRecipe.id.toString(),
        }),
      ]),
      meta: expect.objectContaining({
        page: 1,
        perPage: 20,
      }),
    })

    const draftItem = response.body.items.find(
      (item: { name: string }) => item.name === 'My Draft',
    )

    expect(draftItem).not.toHaveProperty('author')
    expect(draftItem).not.toHaveProperty('prepTimeInMinutes')
  })

  test('[GET] /recipes?scope=mine without token returns 401', async () => {
    const response = await request(app.getHttpServer()).get(
      '/recipes?scope=mine',
    )

    expect(response.statusCode).toBe(401)
  })
})
