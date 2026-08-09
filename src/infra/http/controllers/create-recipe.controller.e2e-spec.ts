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
          { name: 'Ingredient 1', amount: 2, unit: 'cup', note: 'picado fino' },
          { name: 'Ingredient 2', amount: 1, unit: 'tablespoon' },
        ],
      })

    expect(response.statusCode).toBe(201)

    const recipeOnDatabase = await prisma.recipe.findFirst({
      where: {
        authorId: user.id.toString(),
      },
      include: {
        tags: true,
        ingredients: true,
      },
    })

    expect(recipeOnDatabase).toBeTruthy()
    expect(recipeOnDatabase?.status).toBe('Draft')
    expect(recipeOnDatabase?.publishedAt).toBeNull()
    expect(recipeOnDatabase?.tags).toHaveLength(2)
    expect(recipeOnDatabase?.ingredients).toHaveLength(2)
    expect(recipeOnDatabase?.ingredients[0].unit).toBe('Cup')
    expect(recipeOnDatabase?.ingredients[0].position).toBe(0)
    expect(recipeOnDatabase?.ingredients[0].note).toBe('picado fino')
    expect(recipeOnDatabase?.ingredients[1].unit).toBe('Tablespoon')
    expect(recipeOnDatabase?.ingredients[1].position).toBe(1)
    expect(recipeOnDatabase?.ingredients[1].note).toBeNull()
  })

  test('[POST] /recipes without timing and servings', async () => {
    const user = await chefFactory.makePrismaChef()

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .post('/recipes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Draft Without Timing',
        instructions: 'Mix and serve.',
        difficultyLevel: 'easy',
      })

    expect(response.statusCode).toBe(201)

    const recipeOnDatabase = await prisma.recipe.findFirst({
      where: {
        authorId: user.id.toString(),
        name: 'Draft Without Timing',
      },
    })

    expect(recipeOnDatabase).toBeTruthy()
    expect(recipeOnDatabase?.prepTime).toBeNull()
    expect(recipeOnDatabase?.cookTime).toBeNull()
    expect(recipeOnDatabase?.servings).toBeNull()
  })
})
