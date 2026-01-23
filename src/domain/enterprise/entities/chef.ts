import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { ChefAttachmentsList } from './chef-attachments-list'

export interface ChefProps {
  firstName: string
  lastName: string
  userName: string
  email: string
  hashedPassword: string
  attachments: ChefAttachmentsList
  bio: string | null
  createdAt: Date
  updatedAt?: Date | null
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

  get attachments() {
    return this.props.attachments
  }

  set attachments(attachments: ChefAttachmentsList) {
    this.props.attachments = attachments
    this.touch()
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

  static create(
    props: Optional<ChefProps, 'attachments' | 'bio' | 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    const chef = new Chef(
      {
        ...props,
        bio: props.bio ?? null,
        attachments: props.attachments ?? new ChefAttachmentsList(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return chef
  }
}

// import { Entity } from '@/core/entities/entity'
// import { UniqueEntityID } from '@/core/entities/unique-entity-id'
// import { Optional } from '@/core/types/optional'

// export interface ChefProps {
//   firstName: string
//   lastName: string
//   userName: string
//   email: string
//   hashedPassword: string
//   profilePictureUrl?: string | null
//   bio?: string | null
//   isActive: boolean
//   isVerified: boolean // instalar sistema de e-mail local | sistema de captcha externo
//   verificationToken?: string | null // outra tabela de tokens?
//   resetPasswordToken?: string | null
//   resetPasswordTokenExpiresAt?: Date | null
//   createdAt: Date
//   updatedAt?: Date | null
// }

// export class Chef extends Entity<ChefProps> {
//   get firstName() {
//     return this.props.firstName
//   }

//   get lastName() {
//     return this.props.lastName
//   }

//   get userName() {
//     return this.props.userName
//   }

//   get email() {
//     return this.props.email
//   }

//   get hashedPassword() {
//     return this.props.hashedPassword
//   }

//   get profilePictureUrl() {
//     return this.props.profilePictureUrl
//   }

//   get bio() {
//     return this.props.bio
//   }

//   get isActive() {
//     return this.props.isActive
//   }

//   get isVerified() {
//     return this.props.isVerified
//   }

//   get verificationToken() {
//     return this.props.verificationToken
//   }

//   get resetPasswordToken() {
//     return this.props.resetPasswordToken
//   }

//   get resetPasswordTokenExpiresAt() {
//     return this.props.resetPasswordTokenExpiresAt
//   }

//   get createdAt() {
//     return this.props.createdAt
//   }

//   get updatedAt() {
//     return this.props.updatedAt
//   }

//   private touch() {
//     this.props.updatedAt = new Date()
//   }

//   static create(
//     props: Optional<
//       ChefProps,
//       | 'profilePictureUrl'
//       | 'bio'
//       | 'isActive'
//       | 'isVerified'
//       | 'verificationToken'
//       | 'resetPasswordToken'
//       | 'resetPasswordTokenExpiresAt'
//       | 'createdAt'
//       | 'updatedAt'
//     >,
//     id?: UniqueEntityID,
//   ) {
//     const chef = new Chef(
//       {
//         ...props,
//         isActive: props.isActive ?? true,
//         isVerified: props.isVerified ?? false,
//         createdAt: props.createdAt ?? new Date(),
//       },
//       id,
//     )

//     return chef
//   }
// }
