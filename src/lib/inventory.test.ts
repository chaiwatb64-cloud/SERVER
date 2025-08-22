import { describe, it, expect } from 'vitest'
import { computeStatus, toCSV, fromJSON, filterAndSort, SEED, runSelfTestsCore } from './inventory'

describe('inventory core', () => {
  it('self tests should pass', () => {
    expect(() => runSelfTestsCore()).not.toThrow()
  })
  it('computeStatus works', () => {
    expect(computeStatus(0,1)).toBe('หมด')
    expect(computeStatus(1,1)).toBe('ใกล้หมด')
    expect(computeStatus(5,1)).toBe('ปกติ')
  })
  it('CSV and JSON import interop', () => {
    const csv = toCSV(SEED.slice(0,2))
    expect(csv.split('\n').length).toBe(3)
    const imported = fromJSON(JSON.stringify(SEED.slice(0,2)))
    expect(imported?.length).toBe(2)
  })
  it('filterAndSort can filter low items', () => {
    const out = filterAndSort(SEED, { onlyLow: true }, { key: 'id', asc: true })
    expect(out.every(i => i.status !== 'ปกติ')).toBe(true)
  })
})
