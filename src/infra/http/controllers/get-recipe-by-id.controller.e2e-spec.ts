import { AppModule } from '@/infra/app.module'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import { randomUUID } from 'node:crypto'
import { ChefFactory } from 'test/factories/make-chef'
import { RecipeFactory } from 'test/factories/make-recipe'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { RecipeStatus } from '@/domain/enterprise/entities/recipe'

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

  test('[GET] /recipes/:id for published recipe', async () => {
    const user = await chefFactory.makePrismaChef({
      userName: 'johndoe',
    })

    const recipe = await recipeFactory.makePrismaRecipe({
      authorId: user.id,
      name: 'Receita 01',
      status: RecipeStatus.PUBLISHED,
      publishedAt: new Date(),
    })

    const response = await request(app.getHttpServer()).get(
      `/recipes/${recipe.id.toString()}`,
    )

    expect(response.statusCode).toBe(200)

    // TODO: tirar author/slug/status — já estão em get-recipe-by-id.spec.ts.
    // Manter só smoke do envelope HTTP (`recipe` + name) para provar presenter + Prisma.
    expect(response.body).toEqual({
      recipe: expect.objectContaining({
        name: 'Receita 01',
        author: 'johndoe',
        slug: recipe.slug.value,
        status: RecipeStatus.PUBLISHED,
      }),
    })
  })

  test('[GET] /recipes/:id-:slug for published recipe', async () => {
    const user = await chefFactory.makePrismaChef({
      userName: 'sluguser',
    })

    const recipe = await recipeFactory.makePrismaRecipe({
      authorId: user.id,
      name: 'Bolo de Cenoura',
      status: RecipeStatus.PUBLISHED,
      publishedAt: new Date(),
    })

    const response = await request(app.getHttpServer()).get(
      `/recipes/${recipe.id.toString()}-${recipe.slug.value}`,
    )

    expect(response.statusCode).toBe(200)
    // TODO: tirar author/slug/status — regra de leitura já está no unit.
    // Este spec vale pelo wiring da rota `id-slug` (parseRecipeIdFromRouteParam);
    // smoke: 200 + `recipe.name`.
    expect(response.body).toEqual({
      recipe: expect.objectContaining({
        name: 'Bolo de Cenoura',
        author: 'sluguser',
        slug: recipe.slug.value,
        status: RecipeStatus.PUBLISHED,
      }),
    })
  })

  test('[GET] /recipes/:id for draft recipe by author', async () => {
    const user = await chefFactory.makePrismaChef({
      userName: 'janedoe',
    })

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const recipe = await recipeFactory.makePrismaRecipe({
      authorId: user.id,
      name: 'Draft Recipe',
      status: RecipeStatus.DRAFT,
    })

    const response = await request(app.getHttpServer())
      .get(`/recipes/${recipe.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    // TODO: tirar status DRAFT — “autor lê rascunho” já está no unit.
    // Este spec vale pelo JWT → actorId; smoke: 200 + `recipe.name`.
    expect(response.body).toEqual({
      recipe: expect.objectContaining({
        name: 'Draft Recipe',
        status: RecipeStatus.DRAFT,
      }),
    })
  })

  test('[GET] /recipes/:id should return 404 when recipe does not exist', async () => {
    const response = await request(app.getHttpServer()).get(
      `/recipes/${randomUUID()}`,
    )

    expect(response.statusCode).toBe(404)
  })
})
