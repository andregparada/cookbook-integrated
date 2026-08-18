import { AppModule } from '@/infra/app.module'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import { ChefFactory } from 'test/factories/make-chef'
import { IngredientFactory } from 'test/factories/make-ingredient'
import { TagFactory } from 'test/factories/make-tag'
import { RecipeFactory } from 'test/factories/make-recipe'
import { makeRecipeIngredient } from 'test/factories/make-recipe-ingredient'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { RecipeStatus } from '@/domain/enterprise/entities/recipe'
import { RecipeIngredientList } from '@/domain/enterprise/entities/recipe-ingredient-list'
import { MeasurementUnit } from '@/domain/enterprise/entities/recipe-ingredient'

describe('Search recipes (E2E)', () => {
  let app: INestApplication
  let chefFactory: ChefFactory
  let ingredientFactory: IngredientFactory
  let recipeFactory: RecipeFactory
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [ChefFactory, TagFactory, IngredientFactory, RecipeFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    chefFactory = moduleRef.get(ChefFactory)
    ingredientFactory = moduleRef.get(IngredientFactory)
    recipeFactory = moduleRef.get(RecipeFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[GET] /recipes returns published recipes without authentication', async () => {
    const user = await chefFactory.makePrismaChef()

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
        }),
      ]),
      meta: expect.any(Object),
    })
  })

  test('[GET] /recipes?scope=mine returns own draft recipes with JWT', async () => {
    const user = await chefFactory.makePrismaChef()

    const accessToken = jwt.sign({ sub: user.id.toString() })

    await recipeFactory.makePrismaRecipe({
      authorId: user.id,
      name: 'My Draft',
    })

    const response = await request(app.getHttpServer())
      .get('/recipes?scope=mine')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      items: expect.arrayContaining([
        expect.objectContaining({
          name: 'My Draft',
        }),
      ]),
      meta: expect.any(Object),
    })
  })

  test('[GET] /recipes?scope=mine without token returns 401', async () => {
    const response = await request(app.getHttpServer()).get(
      '/recipes?scope=mine',
    )

    expect(response.statusCode).toBe(401)
  })

  test('[GET] /recipes?query= returns search result shape', async () => {
    const user = await chefFactory.makePrismaChef()

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
    expect(response.body.items[0]).toEqual(
      expect.objectContaining({
        name: 'Bolo de Cenoura',
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

  test('[GET] /recipes?ingredients= returns search result shape', async () => {
    const user = await chefFactory.makePrismaChef()

    const chicken = await ingredientFactory.makePrismaIngredient({
      name: 'Frango',
    })
    const potato = await ingredientFactory.makePrismaIngredient({
      name: 'Batata',
    })

    await recipeFactory.makePrismaRecipe({
      authorId: user.id,
      name: 'Chicken Potato Stew',
      status: RecipeStatus.PUBLISHED,
      publishedAt: new Date(),
      ingredients: new RecipeIngredientList([
        makeRecipeIngredient({
          ingredientId: chicken.id,
          unit: MeasurementUnit.GRAM,
        }),
        makeRecipeIngredient({
          ingredientId: potato.id,
          unit: MeasurementUnit.UNIT,
        }),
      ]),
    })

    const response = await request(app.getHttpServer()).get(
      '/recipes?ingredients=frango&ingredients=batata',
    )

    expect(response.statusCode).toBe(200)
    expect(response.body.items[0]).toEqual(
      expect.objectContaining({
        name: 'Chicken Potato Stew',
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
