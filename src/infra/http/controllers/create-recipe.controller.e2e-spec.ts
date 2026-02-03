import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ChefFactory } from 'test/factories/make-chef'

describe('Create recipe (E2E)', () => {
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

  test('[POST] /recipes', async () => {
    const user = await chefFactory.makePrismaChef()

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .post('/recipes')
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

    expect(response.statusCode).toBe(201)

    const recipeOnDatabase = await prisma.recipe.findFirst({
      where: {
        authorId: user.id.toString(),
      },
    })

    expect(recipeOnDatabase).toBeTruthy()
  })
})
