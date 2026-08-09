import { MeasurementUnit } from '@/domain/enterprise/entities/recipe-ingredient'
import { MEASUREMENT_UNIT_LABELS_PT_BR } from './pt-br-labels'

export function formatMeasurementUnitLabel(
  unit: MeasurementUnit,
  amount: number | null,
): string {
  const label = MEASUREMENT_UNIT_LABELS_PT_BR[unit]

  if (unit === MeasurementUnit.TO_TASTE) {
    return label.singular
  }

  if (amount === null || amount === 1) {
    return label.singular
  }

  return label.plural
}

export function formatMeasurementAmount(
  unit: MeasurementUnit,
  amount: number | null,
): string {
  if (unit === MeasurementUnit.TO_TASTE) {
    return formatMeasurementUnitLabel(unit, amount)
  }

  if (amount === null) {
    return formatMeasurementUnitLabel(unit, amount)
  }

  return `${amount} ${formatMeasurementUnitLabel(unit, amount)}`
}
