import { Module } from '@nestjs/common'
import { CreateAccountController } from './controllers/create-account.controller'
import { DataBaseModule } from '../database/database.module'
import { RegisterChefUseCase } from '@/domain/application/use-cases/register-chef'

@Module({
  imports: [DataBaseModule],
  controllers: [CreateAccountController],
  providers: [RegisterChefUseCase],
})
export class HttpModule {}
