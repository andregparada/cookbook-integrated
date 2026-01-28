import { ChefsRepository } from '@/domain/application/repositories/chefs-repository'
import { Chef } from '@/domain/enterprise/entities/chef'

export class InMemoryChefsRepository implements ChefsRepository {
  public items: Chef[] = []

  async findById(id: string) {
    const chef = this.items.find((item) => item.id.toString() === id)

    if (!chef) {
      return null
    }

    return chef
  }

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

  async save(chef: Chef) {
    const itemIndex = this.items.findIndex((item) => item.id === chef.id)

    this.items[itemIndex] = chef
  }
}
