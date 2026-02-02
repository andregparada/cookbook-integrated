import { Module } from '@nestjs/common'
import { CreateAccountController } from './controllers/create-account.controller'
import { DatabaseModule } from '../database/database.module'
import { RegisterChefUseCase } from '@/domain/application/use-cases/register-chef'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { AuthenticateController } from './controllers/authenticate.controller'
import { AuthenticateChefUseCase } from '@/domain/application/use-cases/authenticate-chef'
import { EditUserController } from './controllers/edit-user.controller'
import { EditChefUseCase } from '@/domain/application/use-cases/edit-chef'
import { CreateRecipeController } from './controllers/create-recipe.controller'
import { CreateRecipeUseCase } from '@/domain/application/use-cases/create-recipe'

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    EditUserController,
    CreateRecipeController,
  ],
  providers: [
    RegisterChefUseCase,
    AuthenticateChefUseCase,
    EditChefUseCase,
    CreateRecipeUseCase,
  ],
})
export class HttpModule {}
