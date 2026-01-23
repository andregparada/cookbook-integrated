import { ChefsRepository } from '@/domain/application/repositories/chefs-repository'
import { Chef } from '@/domain/enterprise/entities/chef'

export class InMemoryChefsRepository implements ChefsRepository {
  public items: Chef[] = []

  async findByEmail(email: string): Promise<Chef | null> {
    const chef = this.items.find((item) => item.email.toString() === email)

    if (!chef) {
      return null
    }

    return chef
  }

  async create(chef: Chef) {
    this.items.push(chef)
  }
}
