import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Chef } from '@/domain/enterprise/entities/chef'
import { Prisma, User as PrismaUser } from '@prisma/client'

export class PrismaChefMapper {
  static toDomain(raw: PrismaUser): Chef {
    return Chef.create(
      {
        firstName: raw.firstName,
        lastName: raw.lastName,
        userName: raw.userName,
        email: raw.email,
        hashedPassword: raw.password,
        bio: raw.bio,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(chef: Chef): Prisma.UserUncheckedCreateInput {
    return {
      id: chef.id.toString(),
      firstName: chef.firstName.toString(),
      lastName: chef.lastName.toString(),
      userName: chef.userName.toString(),
      email: chef.email.toString(),
      password: chef.hashedPassword,
      bio: chef.bio,
    }
  }
}
