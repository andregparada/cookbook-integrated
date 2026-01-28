import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { ChefsRepository } from '@/domain/application/repositories/chefs-repository'
import { PrismaChefsRepository } from './prisma/repositories/prisma-chefs-repository'

@Module({
  providers: [
    PrismaService,
    { provide: ChefsRepository, useClass: PrismaChefsRepository },
  ],
  exports: [PrismaService, ChefsRepository],
})
export class DatabaseModule {}
