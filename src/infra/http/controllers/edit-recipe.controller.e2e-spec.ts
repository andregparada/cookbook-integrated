import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ChefFactory } from 'test/factories/make-chef'
import { RecipeFactory } from 'test/factories/make-recipe'

describe('Edit recipe (E2E)', () => {
  let app: INestApplication
  let chefFactory: ChefFactory
  let recipeFactory: RecipeFactory
  let prisma: PrismaService
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [ChefFactory, RecipeFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    chefFactory = moduleRef.get(ChefFactory)
    recipeFactory = moduleRef.get(RecipeFactory)
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[PUT] /recipes/:id', async () => {
    const user = await chefFactory.makePrismaChef()

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const recipe = await recipeFactory.makePrismaRecipe({
      authorId: user.id,
    })

    const recipeId = recipe.id.toString()

    const response = await request(app.getHttpServer())
      .put(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'New Recipe',
        description: 'This is a new recipe',
        instructions: '1. Do this. 2. Do that.',
        prepTimeInMinutes: 15,
        cookTimeInMinutes: 30,
        servings: 4,
        difficultyLevel: 'medium',
        tags: ['dinner', 'easy'],
        recipeIngredients: [
          { name: 'Ingredient 1', amount: 2, unit: 'cups' },
          { name: 'Ingredient 2', amount: 1, unit: 'tbsp' },
        ],
      })

    expect(response.statusCode).toBe(204)

    const recipeOnDatabase = await prisma.recipe.findFirst({
      where: {
        name: 'New Recipe',
        description: 'This is a new recipe',
      },
    })

    expect(recipeOnDatabase).toBeTruthy()
  })
})
