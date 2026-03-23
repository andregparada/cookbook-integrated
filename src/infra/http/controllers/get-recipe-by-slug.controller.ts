import { GetRecipeBySlugUseCase } from '@/domain/application/use-cases/get-recipe-by-slug'
import { BadRequestException, Controller, Get, Param } from '@nestjs/common'
import { RecipeDetailsPresenter } from '../presenters/receipe-details-presenter'

@Controller('/recipes/:slug')
export class GetRecipeBySlugController {
  constructor(private getRecipeBySlug: GetRecipeBySlugUseCase) {}

  @Get()
  async handle(@Param('slug') slug: string) {
    const result = await this.getRecipeBySlug.execute({
      slug,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    return { recipe: RecipeDetailsPresenter.toHTTP(result.value.recipe) }
  }
}
