import { Chef } from '@/domain/enterprise/entities/chef'

export abstract class ChefsRepository {
  abstract findById(id: string): Promise<Chef | null>
  abstract findByEmail(email: string): Promise<Chef | null>
  abstract create(chef: Chef): Promise<void>
  abstract save(chef: Chef): Promise<void>
}
