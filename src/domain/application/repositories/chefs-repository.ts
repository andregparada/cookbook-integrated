import { Chef } from '@/domain/enterprise/entities/chef'

export abstract class ChefsRepository {
  abstract findByEmail(email: string): Promise<Chef | null>
  abstract create(chef: Chef): Promise<void>
}
