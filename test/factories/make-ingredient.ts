import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Ingredient,
  IngredientProps,
} from '@/domain/enterprise/entities/ingredient'
import { PrismaIngredientMapper } from '@/infra/database/prisma/mappers/prisma-ingredient-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'

export function makeIngredient(
  override: Partial<IngredientProps> = {},
  id?: UniqueEntityID,
) {
  const ingredient = Ingredient.create(
    {
      name: faker.food.ingredient(),
      ...override,
    },
    id,
  )

  return ingredient
}

@Injectable()
export class IngredientFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaIngredient(
    data: Partial<IngredientProps> = {},
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
