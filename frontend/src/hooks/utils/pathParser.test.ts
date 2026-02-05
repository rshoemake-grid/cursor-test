import { parsePath, validatePath, hasArrayIndices } from './pathParser'

describe('pathParser', () => {
  describe('parsePath', () => {
    it('should parse dot-notation string', () => {
      expect(parsePath('a.b.c')).toEqual(['a', 'b', 'c'])
    })

    it('should parse array path', () => {
      expect(parsePath(['a', 'b', 'c'])).toEqual(['a', 'b', 'c'])
    })

    it('should filter empty strings from dot notation', () => {
      expect(parsePath('a..b')).toEqual(['a', 'b'])
      expect(parsePath('.a.b')).toEqual(['a', 'b'])
      expect(parsePath('a.b.')).toEqual(['a', 'b'])
    })

    it('should filter empty strings from array', () => {
      expect(parsePath(['a', '', 'b'])).toEqual(['a', 'b'])
      expect(parsePath(['', 'a', 'b'])).toEqual(['a', 'b'])
      expect(parsePath(['a', 'b', ''])).toEqual(['a', 'b'])
    })

    it('should return empty array for empty string', () => {
      expect(parsePath('')).toEqual([])
    })

    it('should return empty array for empty array', () => {
      expect(parsePath([])).toEqual([])
    })

    it('should return empty array for invalid input', () => {
      expect(parsePath(null as any)).toEqual([])
      expect(parsePath(undefined as any)).toEqual([])
      expect(parsePath(123 as any)).toEqual([])
    })

    it('should handle single key', () => {
      expect(parsePath('a')).toEqual(['a'])
      expect(parsePath(['a'])).toEqual(['a'])
    })

    it('should handle paths with numbers', () => {
      expect(parsePath('a.0.b')).toEqual(['a', '0', 'b'])
      expect(parsePath(['a', '0', 'b'])).toEqual(['a', '0', 'b'])
    })
  })

  describe('validatePath', () => {
    it('should validate correct dot-notation path', () => {
      expect(validatePath('a.b.c')).toBe(true)
    })

    it('should validate correct array path', () => {
      expect(validatePath(['a', 'b', 'c'])).toBe(true)
    })

    it('should return false for empty path', () => {
      expect(validatePath('')).toBe(false)
      expect(validatePath([])).toBe(false)
      expect(validatePath('.')).toBe(false)
    })

    it('should return false for path with only empty strings', () => {
      expect(validatePath('..')).toBe(false)
      expect(validatePath(['', ''])).toBe(false)
    })

    it('should validate single key path', () => {
      expect(validatePath('a')).toBe(true)
      expect(validatePath(['a'])).toBe(true)
    })

    it('should validate paths with numeric indices', () => {
      expect(validatePath('a.0.b')).toBe(true)
      expect(validatePath(['a', '0', 'b'])).toBe(true)
    })

    it('should return false for invalid input', () => {
      expect(validatePath(null as any)).toBe(false)
      expect(validatePath(undefined as any)).toBe(false)
    })
  })

  describe('hasArrayIndices', () => {
    it('should detect numeric indices in dot notation', () => {
      expect(hasArrayIndices('a.0.b')).toBe(true)
      expect(hasArrayIndices('items.5.name')).toBe(true)
    })

    it('should detect numeric indices in array', () => {
      expect(hasArrayIndices(['a', '0', 'b'])).toBe(true)
      expect(hasArrayIndices(['items', '5', 'name'])).toBe(true)
    })

    it('should return false for paths without numeric indices', () => {
      expect(hasArrayIndices('a.b.c')).toBe(false)
      expect(hasArrayIndices(['a', 'b', 'c'])).toBe(false)
    })

    it('should return false for empty path', () => {
      expect(hasArrayIndices('')).toBe(false)
      expect(hasArrayIndices([])).toBe(false)
    })

    it('should detect multiple numeric indices', () => {
      expect(hasArrayIndices('a.0.b.1')).toBe(true)
      expect(hasArrayIndices(['a', '0', 'b', '1'])).toBe(true)
    })

    it('should handle single numeric index', () => {
      expect(hasArrayIndices('0')).toBe(true)
      expect(hasArrayIndices(['0'])).toBe(true)
    })

    it('should not treat non-numeric strings as indices', () => {
      expect(hasArrayIndices('a.b0.c')).toBe(false)
      expect(hasArrayIndices('a.0b.c')).toBe(false)
    })
  })
})
