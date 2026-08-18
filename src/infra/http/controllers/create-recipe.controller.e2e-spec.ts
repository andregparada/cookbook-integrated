import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ChefFactory } from 'test/factories/make-chef'
import { makeCreateRecipeHttpBody } from 'test/factories/make-recipe'

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
      .send(makeCreateRecipeHttpBody())

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
    expect(recipeOnDatabase?.tags).toHaveLength(2)
    expect(recipeOnDatabase?.ingredients).toHaveLength(2)
  })
})
