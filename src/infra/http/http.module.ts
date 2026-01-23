import { Module } from '@nestjs/common'
import { CreateAccountController } from './controllers/create-account.controller'
import { DataBaseModule } from '../database/database.module'
import { RegisterChefUseCase } from '@/domain/application/use-cases/register-chef'
import { CryptographyModule } from '../cryptography/cryptography.module'

@Module({
  imports: [DataBaseModule, CryptographyModule],
  controllers: [CreateAccountController],
  providers: [RegisterChefUseCase],
})
export class HttpModule {}
