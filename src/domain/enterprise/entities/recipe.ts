import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { Slug } from './value-objects/slug'

export interface RecipeProps {
  title: string
  slug: Slug
  description: string
  instructions: string
  prepTimeInMinutes: number
  cookTimeInMinutes: number
  servings: number
  difficultyLevel: 'easy' | 'medium' | 'hard'
  authorId: UniqueEntityID
  tags: UniqueEntityID[]
  recipeIngredients?: UniqueEntityID[]
  createdAt: Date
  updatedAt?: Date | null
}

export class Recipe extends Entity<RecipeProps> {
  get title() {
    return this.props.title
  }

  get slug() {
    return this.props.slug
  }

  get description() {
    return this.props.description
  }

  get instructions() {
    return this.props.instructions
  }

  get prepTimeInMinutes() {
    return this.props.prepTimeInMinutes
  }

  get cookTimeInMinutes() {
    return this.props.cookTimeInMinutes
  }

  get servings() {
    return this.props.servings
  }

  get authorId() {
    return this.props.authorId
  }

  get tags() {
    return this.props.tags
  }

  get recipeIngredients() {
    return this.props.recipeIngredients
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
    props: Optional<
      RecipeProps,
      | 'slug'
      | 'createdAt'
      | 'tags'
      | 'recipeIngredients'
      | 'prepTimeInMinutes'
      | 'cookTimeInMinutes'
      | 'servings'
    >,
    id?: UniqueEntityID,
  ) {
    const recipe = new Recipe(
      {
        ...props,
        slug: props.slug ?? Slug.createFromText(props.title),
        tags: props.tags ?? [],
        recipeIngredients: props.recipeIngredients ?? [],
        prepTimeInMinutes: props.prepTimeInMinutes ?? 0,
        cookTimeInMinutes: props.cookTimeInMinutes ?? 0,
        servings: props.servings ?? 1,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
    return recipe
  }
}

// import { Entity } from '@/core/entities/entity'
// import { UniqueEntityID } from '@/core/entities/unique-entity-id'
// import { Optional } from '@/core/types/optional'
// import { Slug } from './value-objects/slug'
// import { Ingredient } from './ingredient'

// export interface RecipeProps {
//   title: string
//   slug: Slug
//   description: string
//   instructions: string
//   ingredients: Ingredient[]
//   authorId: UniqueEntityID
//   createdAt: Date
//   updatedAt?: Date | null
// }

// export class Recipe extends Entity<RecipeProps> {
//   get title() {
//     return this.props.title
//   }

//   get slug() {
//     return this.props.slug
//   }

//   get description() {
//     return this.props.description
//   }

//   get instructions() {
//     return this.props.instructions
//   }

//   get authorId() {
//     return this.props.authorId
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
//     props: Optional<RecipeProps, 'slug' | 'createdAt'>,
//     id?: UniqueEntityID,
//   ) {
//     const recipe = new Recipe(
//       {
//         ...props,
//         slug: props.slug ?? Slug.createFromText(props.title),
//         createdAt: props.createdAt ?? new Date(),
//       },
//       id,
//     )
//     return recipe
//   }
// }
