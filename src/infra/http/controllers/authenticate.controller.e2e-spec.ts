import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { hash } from 'bcryptjs'
import request from 'supertest'
import { ChefFactory } from 'test/factories/make-chef'

describe('Authenticate (E2E)', () => {
  let app: INestApplication
  let chefFactory: ChefFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [ChefFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    chefFactory = moduleRef.get(ChefFactory)

    await app.init()
  })

  test('[POST] /sessions', async () => {
    const password = '123456'

    const chef = await chefFactory.makePrismaChef({
      hashedPassword: await hash(password, 8),
    })

    const response = await request(app.getHttpServer()).post('/sessions').send({
      email: chef.email,
      password,
    })

    expect(response.statusCode).toBe(201)
    expect(response.body).toEqual({
      access_token: expect.any(String),
    })
  })
})
