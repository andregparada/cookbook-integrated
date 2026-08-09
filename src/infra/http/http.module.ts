import { Module } from '@nestjs/common'
import { CreateAccountController } from './controllers/create-account.controller'
import { DatabaseModule } from '../database/database.module'
import { RegisterChefUseCase } from '@/domain/application/use-cases/register-chef'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { AuthenticateController } from './controllers/authenticate.controller'
import { AuthenticateChefUseCase } from '@/domain/application/use-cases/authenticate-chef'
import { EditChefController } from './controllers/edit-chef.controller'
import { EditChefUseCase } from '@/domain/application/use-cases/edit-chef'
import { CreateRecipeController } from './controllers/create-recipe.controller'
import { CreateRecipeUseCase } from '@/domain/application/use-cases/create-recipe'
import { EditRecipeController } from './controllers/edit-recipe.controller'
import { EditRecipeUseCase } from '@/domain/application/use-cases/edit-recipe'
import { GetRecipeByIdController } from './controllers/get-recipe-by-id.controller'
import { GetRecipeByIdUseCase } from '@/domain/application/use-cases/get-recipe-by-id'
import { PublishRecipeController } from './controllers/publish-recipe.controller'
import { UnpublishRecipeController } from './controllers/unpublish-recipe.controller'
import { PublishRecipeUseCase } from '@/domain/application/use-cases/publish-recipe'
import { UnpublishRecipeUseCase } from '@/domain/application/use-cases/unpublish-recipe'
import { RecipeCatalogResolver } from '@/domain/application/services/recipe-catalog-resolver'

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    EditChefController,
    CreateRecipeController,
    EditRecipeController,
    GetRecipeByIdController,
    PublishRecipeController,
    UnpublishRecipeController,
  ],
  providers: [
    RegisterChefUseCase,
    AuthenticateChefUseCase,
    EditChefUseCase,
    CreateRecipeUseCase,
    EditRecipeUseCase,
    GetRecipeByIdUseCase,
    PublishRecipeUseCase,
    UnpublishRecipeUseCase,
    RecipeCatalogResolver,
  ],
})
export class HttpModule {}
