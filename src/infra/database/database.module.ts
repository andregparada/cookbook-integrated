import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { ChefsRepository } from '@/domain/application/repositories/chefs-repository'
import { PrismaUsersRepository } from './prisma/repositories/prisma-users-repository'

@Module({
  providers: [
    PrismaService,
    { provide: ChefsRepository, useClass: PrismaUsersRepository },
  ],
  exports: [PrismaService, ChefsRepository],
})
export class DatabaseModule {}
