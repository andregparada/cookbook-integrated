import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Ingredient,
  IngredientProps,
} from '@/domain/enterprise/entities/ingredient'
import { CatalogDisplayName } from '@/domain/enterprise/entities/value-objects/catalog-display-name'
import { PrismaIngredientMapper } from '@/infra/database/prisma/mappers/prisma-ingredient-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'
import { makeCatalogDisplayNameForIngredient } from './make-catalog-display-name'

type MakeIngredientOverride = Partial<Omit<IngredientProps, 'name'>> & {
  name?: string | CatalogDisplayName
}

export function makeIngredient(
  override: MakeIngredientOverride = {},
  id?: UniqueEntityID,
) {
  const { name: nameOverride, ...rest } = override

  const ingredient = Ingredient.create(
    {
      name: nameOverride
        ? makeCatalogDisplayNameForIngredient(nameOverride)
        : makeCatalogDisplayNameForIngredient(faker.food.ingredient()),
      ...rest,
    },
    id,
  )

  return ingredient
}

@Injectable()
export class IngredientFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaIngredient(
    data: MakeIngredientOverride = {},
    id?: UniqueEntityID,
  ) {
    const ingredient = makeIngredient(data, id)

    const existingIngredient = await this.prisma.ingredient.findUnique({
      where: { normalizedName: ingredient.normalizedName.value },
    })

    if (existingIngredient) {
      return PrismaIngredientMapper.toDomain(existingIngredient)
    }

    await this.prisma.ingredient.create({
      data: PrismaIngredientMapper.toPrisma(ingredient),
    })

    return ingredient
  }
}
