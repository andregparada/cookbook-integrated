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
    // TODO: reduzir a smoke do envelope HTTP (`items` + name + `meta` existir).
    // slug/excerpt/tags e defaults de page/perPage já estão no unit (read model + paginação).
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

    // TODO: tirar esses spec expect — campos ausentes são do VO RecipeCatalogCard
    // (search-recipes.spec.ts). Presenter é 1:1; não precisa reassertar no e2e.
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
    // TODO: tirar status/recipeId/meta — “mine devolve rascunho” já está no unit.
    // Este spec vale pelo JWT + scope=mine; smoke: 200 + name.
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

    // TODO: tirar esses spec expect — shape de RecipeAuthorWorkspaceItem já está no unit.
    expect(draftItem).not.toHaveProperty('author')
    expect(draftItem).not.toHaveProperty('prepTimeInMinutes')
  })

  test('[GET] /recipes?scope=mine without token returns 401', async () => {
    const response = await request(app.getHttpServer()).get(
      '/recipes?scope=mine',
    )

    expect(response.statusCode).toBe(401)
  })

  // TODO: filtro 12.c já está em search-recipes.spec.ts. Tirar o spec ou reduzir a
  // 200 (querystring chega no use case). Não reassertar match nem campos de presenter.
  test('[GET] /recipes?query= returns search result shape', async () => {
    const user = await chefFactory.makePrismaChef({
      userName: 'query_author',
    })

    await recipeFactory.makePrismaRecipe({
      authorId: user.id,
      name: 'Bolo de Cenoura',
      status: RecipeStatus.PUBLISHED,
      publishedAt: new Date(),
    })

    const response = await request(app.getHttpServer()).get(
      '/recipes?query=cenoura',
    )

    expect(response.statusCode).toBe(200)
    // TODO: tirar author/prepTime/difficultyLevel — RecipeSearchResultItem já está no unit.
    expect(response.body.items[0]).toEqual(
      expect.objectContaining({
        name: 'Bolo de Cenoura',
        author: 'query_author',
        prepTimeInMinutes: expect.anything(),
        difficultyLevel: expect.any(String),
      }),
    )
  })

  test('[GET] /recipes?query= with more than 100 characters returns 400', async () => {
    const longQuery = 'a'.repeat(101)

    const response = await request(app.getHttpServer()).get(
      `/recipes?query=${longQuery}`,
    )

    expect(response.statusCode).toBe(400)
  })

  // TODO: filtro 12.d já está em search-recipes.spec.ts. Tirar o spec ou reduzir a
  // 200 com seed via RecipeFactory (não POST+publish). Não reassertar match ALL.
  test('[GET] /recipes?ingredients= returns search result shape', async () => {
    const user = await chefFactory.makePrismaChef({
      userName: 'ingredients_author',
    })

    const accessToken = jwt.sign({ sub: user.id.toString() })

    // TODO: usar factory
    const createResponse = await request(app.getHttpServer())
      .post('/recipes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Chicken Potato Stew',
        description: 'A hearty stew',
        instructions: 'Cook chicken and potatoes together.',
        prepTimeInMinutes: 15,
        cookTimeInMinutes: 45,
        servings: 4,
        difficultyLevel: 'easy',
        tags: ['dinner'],
        recipeIngredients: [
          { name: 'Frango', amount: 500, unit: 'gram' },
          { name: 'Batata', amount: 3, unit: 'unit' },
        ],
      })

    expect(createResponse.statusCode).toBe(201)

    const recipeOnDatabase = await request(app.getHttpServer())
      .get('/recipes?scope=mine')
      .set('Authorization', `Bearer ${accessToken}`)

    const recipeId = recipeOnDatabase.body.items[0].recipeId

    const publishResponse = await request(app.getHttpServer())
      .post(`/recipes/${recipeId}/publish`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(publishResponse.statusCode).toBe(204)

    const response = await request(app.getHttpServer()).get(
      '/recipes?ingredients=frango&ingredients=batata',
    )

    expect(response.statusCode).toBe(200)
    // TODO: tirar esse spec expect — shape de search result e match ALL já estão no unit.
    expect(response.body.items[0]).toEqual(
      expect.objectContaining({
        name: 'Chicken Potato Stew',
        author: 'ingredients_author',
        prepTimeInMinutes: expect.anything(),
        difficultyLevel: expect.any(String),
      }),
    )
  })

  test('[GET] /recipes?ingredientMatch= with invalid value returns 400', async () => {
    const response = await request(app.getHttpServer()).get(
      '/recipes?ingredients=frango&ingredientMatch=PARTIAL',
    )

    expect(response.statusCode).toBe(400)
  })
})
