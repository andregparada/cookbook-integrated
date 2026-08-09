import { MeasurementUnit } from '@/domain/enterprise/entities/recipe-ingredient'
import {
  formatMeasurementAmount,
  formatMeasurementUnitLabel,
  MEASUREMENT_UNIT_LABELS_PT_BR,
} from './index'

describe('Measurement unit labels (pt-BR)', () => {
  it('should define labels for every measurement unit', () => {
    const enumValues = Object.values(MeasurementUnit)
    const labelKeys = Object.keys(MEASUREMENT_UNIT_LABELS_PT_BR)

    expect(labelKeys).toHaveLength(enumValues.length)
    enumValues.forEach((unit) => {
      expect(MEASUREMENT_UNIT_LABELS_PT_BR[unit]).toBeDefined()
      expect(MEASUREMENT_UNIT_LABELS_PT_BR[unit].singular).not.toBe('')
      expect(MEASUREMENT_UNIT_LABELS_PT_BR[unit].plural).not.toBe('')
    })
  })

  it('should pluralize countable units based on amount', () => {
    expect(formatMeasurementUnitLabel(MeasurementUnit.TABLESPOON, 1)).toBe(
      'colher de sopa',
    )
    expect(formatMeasurementUnitLabel(MeasurementUnit.TABLESPOON, 2)).toBe(
      'colheres de sopa',
    )
    expect(formatMeasurementUnitLabel(MeasurementUnit.TO_TASTE, null)).toBe(
      'a gosto',
    )
  })

  it('should format amount and unit together', () => {
    expect(formatMeasurementAmount(MeasurementUnit.CUP, 2)).toBe('2 xícaras')
    expect(formatMeasurementAmount(MeasurementUnit.TO_TASTE, null)).toBe(
      'a gosto',
    )
  })
})
