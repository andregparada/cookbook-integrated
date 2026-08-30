import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'

export interface ChefProps {
  firstName: string
  lastName: string
  userName: string
  email: string
  hashedPassword: string
  avatarId: string | null
  bio: string | null
  createdAt: Date
  updatedAt?: Date | null
}

export type UpdateChefProps = {
  firstName?: string
  lastName?: string
  userName?: string
  email?: string
  hashedPassword?: string
  avatarId?: string | null
  bio?: string | null
}

export class Chef extends Entity<ChefProps> {
  get firstName() {
    return this.props.firstName
  }

  get lastName() {
    return this.props.lastName
  }

  get userName() {
    return this.props.userName
  }

  get email() {
    return this.props.email
  }

  get hashedPassword() {
    return this.props.hashedPassword
  }

  get avatarId() {
    return this.props.avatarId
  }

  get bio() {
    return this.props.bio
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  updateInfo(update: UpdateChefProps) {
    let changed = false

    if (update.firstName !== undefined) {
      this.props.firstName = update.firstName
      changed = true
    }

    if (update.lastName !== undefined) {
      this.props.lastName = update.lastName
      changed = true
    }

    if (update.userName !== undefined) {
      this.props.userName = update.userName
      changed = true
    }

    if (update.email !== undefined) {
      this.props.email = update.email
      changed = true
    }

    if (update.hashedPassword !== undefined) {
      this.props.hashedPassword = update.hashedPassword
      changed = true
    }

    if (update.avatarId !== undefined) {
      this.props.avatarId = update.avatarId
      changed = true
    }

    if (update.bio !== undefined) {
      this.props.bio = update.bio
      changed = true
    }

    if (changed) {
      this.touch()
    }
  }

  static create(
    props: Optional<ChefProps, 'avatarId' | 'bio' | 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    const chef = new Chef(
      {
        ...props,
        avatarId: props.avatarId ?? null,
        bio: props.bio ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return chef
  }
}
