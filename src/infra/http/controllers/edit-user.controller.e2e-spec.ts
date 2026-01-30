import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ChefFactory } from 'test/factories/make-chef'

describe('Edit user (E2E)', () => {
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

  test('[PUT] /user/me', async () => {
    const user = await chefFactory.makePrismaChef({
      userName: 'old_username',
    })

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .put('/user/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        userName: 'new_username',
      })

    expect(response.statusCode).toBe(204)

    const chefOnDatabase = await prisma.user.findFirst({
      where: {
        id: user.id.toString(),
      },
    })

    expect(chefOnDatabase).toBeTruthy()
    expect(chefOnDatabase?.userName).toBe('new_username')
  })
})
