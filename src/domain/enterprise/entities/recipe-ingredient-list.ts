import { WatchedList } from '@/core/entities/watched-list'
import { RecipeIngredient } from './recipe-ingredient'

export class RecipeIngredientList extends WatchedList<RecipeIngredient> {
  compareItems(a: RecipeIngredient, b: RecipeIngredient): boolean {
    return (
      a.ingredientId.equals(b.ingredientId) &&
      a.amount === b.amount &&
      a.unit === b.unit
    )
  }
}
