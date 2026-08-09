import { WatchedList } from '@/core/entities/watched-list'
import { RecipeIngredient } from './recipe-ingredient'

export class RecipeIngredientList extends WatchedList<RecipeIngredient> {
  compareItems(a: RecipeIngredient, b: RecipeIngredient): boolean {
    return a.id.equals(b.id)
  }
}
