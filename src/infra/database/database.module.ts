import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { ChefsRepository } from '@/domain/application/repositories/chefs-repository'
import { PrismaUsersRepository } from './prisma/repositories/prisma-users-repository'
import { RecipesRepository } from '@/domain/application/repositories/recipes-repository'
import { PrismaRecipesRepository } from './prisma/repositories/prisma-recipes-repository'
import { IngredientsRepository } from '@/domain/application/repositories/ingredients-repository'
import { PrismaIngredientsRepository } from './prisma/repositories/prisma-ingredients-repository'
import { TagsRepository } from '@/domain/application/repositories/tags-repository'
import { PrismaTagsRepository } from './prisma/repositories/prisma-tags-repository'
import { PrismaRecipeIngredientsRepository } from './prisma/repositories/prisma-recipe-ingredients-repository'
import { RecipeIngredientsRepository } from '@/domain/application/repositories/recipe-ingredients-repository'

@Module({
  providers: [
    PrismaService,
    { provide: ChefsRepository, useClass: PrismaUsersRepository },
    { provide: RecipesRepository, useClass: PrismaRecipesRepository },
    { provide: IngredientsRepository, useClass: PrismaIngredientsRepository },
    { provide: TagsRepository, useClass: PrismaTagsRepository },
    {
      provide: RecipeIngredientsRepository,
      useClass: PrismaRecipeIngredientsRepository,
    },
  ],
  exports: [
    PrismaService,
    ChefsRepository,
    RecipesRepository,
    IngredientsRepository,
    TagsRepository,
    RecipeIngredientsRepository,
  ],
})
export class DatabaseModule {}
