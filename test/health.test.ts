import { sum } from '../lib/health'

describe('health utils', () => {
  it('sum adds numbers', () => {
    expect(sum(2, 3)).toBe(5)
  })
})
