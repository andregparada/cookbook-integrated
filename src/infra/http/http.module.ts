import { Module } from '@nestjs/common'
import { CreateAccountController } from './controllers/create-account.controller'
import { AuthenticateController } from './controllers/authenticate.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [CreateAccountController, AuthenticateController],
  providers: [PrismaService],
})
export class HttpModule {}
