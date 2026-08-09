import { MeasurementUnit } from '@/domain/enterprise/entities/recipe-ingredient'
import { MeasurementUnitLabel } from './measurement-unit-label'

export const MEASUREMENT_UNIT_LABELS_PT_BR: Record<
  MeasurementUnit,
  MeasurementUnitLabel
> = {
  [MeasurementUnit.GRAM]: { singular: 'grama', plural: 'gramas' },
  [MeasurementUnit.KILOGRAM]: { singular: 'quilograma', plural: 'quilogramas' },
  [MeasurementUnit.MILLILITER]: {
    singular: 'mililitro',
    plural: 'mililitros',
  },
  [MeasurementUnit.LITER]: { singular: 'litro', plural: 'litros' },
  [MeasurementUnit.CUP]: { singular: 'xícara', plural: 'xícaras' },
  [MeasurementUnit.TABLESPOON]: {
    singular: 'colher de sopa',
    plural: 'colheres de sopa',
  },
  [MeasurementUnit.TEASPOON]: {
    singular: 'colher de chá',
    plural: 'colheres de chá',
  },
  [MeasurementUnit.PINCH]: { singular: 'pitada', plural: 'pitadas' },
  [MeasurementUnit.DASH]: { singular: 'fio', plural: 'fios' },
  [MeasurementUnit.DROP]: { singular: 'gota', plural: 'gotas' },
  [MeasurementUnit.GLASS]: { singular: 'copo', plural: 'copos' },
  [MeasurementUnit.BOWL]: { singular: 'tigela', plural: 'tigelas' },
  [MeasurementUnit.UNIT]: { singular: 'unidade', plural: 'unidades' },
  [MeasurementUnit.CLOVE]: { singular: 'dente', plural: 'dentes' },
  [MeasurementUnit.SLICE]: { singular: 'fatia', plural: 'fatias' },
  [MeasurementUnit.PIECE]: { singular: 'pedaço', plural: 'pedaços' },
  [MeasurementUnit.BUNCH]: { singular: 'maço', plural: 'maços' },
  [MeasurementUnit.SPRIG]: { singular: 'raminho', plural: 'raminhos' },
  [MeasurementUnit.HEAD]: { singular: 'cabeça', plural: 'cabeças' },
  [MeasurementUnit.STALK]: { singular: 'talo', plural: 'talos' },
  [MeasurementUnit.CAN]: { singular: 'lata', plural: 'latas' },
  [MeasurementUnit.JAR]: { singular: 'pote', plural: 'potes' },
  [MeasurementUnit.BOTTLE]: { singular: 'garrafa', plural: 'garrafas' },
  [MeasurementUnit.BOX]: { singular: 'caixa', plural: 'caixas' },
  [MeasurementUnit.PACKAGE]: { singular: 'pacote', plural: 'pacotes' },
  [MeasurementUnit.SACHET]: { singular: 'sachê', plural: 'sachês' },
  [MeasurementUnit.TO_TASTE]: { singular: 'a gosto', plural: 'a gosto' },
}
