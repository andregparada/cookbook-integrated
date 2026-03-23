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
import { EditRecipeController } from './controllers/edit-recipe.controller'
import { EditRecipeUseCase } from '@/domain/application/use-cases/edit-recipe'
import { GetRecipeBySlugController } from './controllers/get-recipe-by-slug.controller'
import { GetRecipeBySlugUseCase } from '@/domain/application/use-cases/get-recipe-by-slug'

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    EditUserController,
    CreateRecipeController,
    EditRecipeController,
    GetRecipeBySlugController,
  ],
  providers: [
    RegisterChefUseCase,
    AuthenticateChefUseCase,
    EditChefUseCase,
    CreateRecipeUseCase,
    EditRecipeUseCase,
    GetRecipeBySlugUseCase,
  ],
})
export class HttpModule {}
