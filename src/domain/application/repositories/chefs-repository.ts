import { Chef } from '@/domain/enterprise/entities/chef'

export abstract class ChefsRepository {
  abstract create(chef: Chef): Promise<void>
  abstract findById(id: string): Promise<Chef | null>
  abstract findByEmail(email: string): Promise<Chef | null>
  abstract findByUserName(userName: string): Promise<Chef | null>
  abstract save(chef: Chef): Promise<void>
}
