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
  avatarId?: string | null
  bio?: string | null
}

export class Chef extends Entity<ChefProps> {
  get firstName() {
    return this.props.firstName
  }

  set firstName(firstName: string) {
    this.props.firstName = firstName
    this.touch()
  }

  get lastName() {
    return this.props.lastName
  }

  set lastName(lastName: string) {
    this.props.lastName = lastName
    this.touch()
  }

  get userName() {
    return this.props.userName
  }

  set userName(userName: string) {
    this.props.userName = userName
    this.touch()
  }

  get email() {
    return this.props.email
  }

  set email(email: string) {
    this.props.email = email
    this.touch()
  }

  get hashedPassword() {
    return this.props.hashedPassword
  }

  set hashedPassword(hashedPassword: string) {
    this.props.hashedPassword = hashedPassword
    this.touch()
  }

  get avatarId() {
    return this.props.avatarId
  }

  set avatarId(avatarId: string | null) {
    this.props.avatarId = avatarId
    this.touch()
  }

  get bio() {
    return this.props.bio
  }

  set bio(bio: string | null) {
    this.props.bio = bio
    this.touch()
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
    if (update.firstName !== undefined) {
      this.props.firstName = update.firstName
    }

    if (update.lastName !== undefined) {
      this.props.lastName = update.lastName
    }

    if (update.userName !== undefined) {
      this.props.userName = update.userName
    }

    if (update.email !== undefined) {
      this.props.email = update.email
    }

    if (update.avatarId !== undefined) {
      this.props.avatarId = update.avatarId
    }

    if (update.bio !== undefined) {
      this.props.bio = update.bio
    }

    if (
      update.firstName !== undefined ||
      update.lastName !== undefined ||
      update.userName !== undefined ||
      update.email !== undefined ||
      update.avatarId !== undefined ||
      update.bio !== undefined
    ) {
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
