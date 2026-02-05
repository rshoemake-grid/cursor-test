import { getNestedValue, setNestedValue, hasNestedValue } from './formUtils'

describe('formUtils', () => {
  describe('getNestedValue', () => {
    const testObj = {
      user: {
        profile: {
          name: 'John',
          age: 30,
        },
        settings: {
          theme: 'dark',
        },
      },
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ],
    }

    it('should get nested value using dot notation', () => {
      expect(getNestedValue(testObj, 'user.profile.name')).toBe('John')
      expect(getNestedValue(testObj, 'user.profile.age')).toBe(30)
    })

    it('should get nested value using array path', () => {
      expect(getNestedValue(testObj, ['user', 'profile', 'name'])).toBe('John')
      expect(getNestedValue(testObj, ['user', 'settings', 'theme'])).toBe('dark')
    })

    it('should return default value when path not found', () => {
      expect(getNestedValue(testObj, 'user.profile.email', 'default')).toBe('default')
      expect(getNestedValue(testObj, 'nonexistent.path', 'default')).toBe('default')
    })

    it('should return undefined when path not found and no default', () => {
      expect(getNestedValue(testObj, 'user.profile.email')).toBeUndefined()
      expect(getNestedValue(testObj, 'nonexistent.path')).toBeUndefined()
    })

    it('should handle null object', () => {
      expect(getNestedValue(null, 'user.name', 'default')).toBe('default')
      expect(getNestedValue(null, 'user.name')).toBeUndefined()
    })

    it('should handle undefined object', () => {
      expect(getNestedValue(undefined, 'user.name', 'default')).toBe('default')
      expect(getNestedValue(undefined, 'user.name')).toBeUndefined()
    })

    it('should handle empty path', () => {
      expect(getNestedValue(testObj, '', 'default')).toBe('default')
      expect(getNestedValue(testObj, [])).toBeUndefined()
    })

    it('should handle single key path', () => {
      expect(getNestedValue(testObj, 'user')).toEqual(testObj.user)
    })

    it('should handle null intermediate values', () => {
      const objWithNull = { user: { profile: null } }
      expect(getNestedValue(objWithNull, 'user.profile.name')).toBeUndefined()
    })

    it('should handle undefined intermediate values', () => {
      const objWithUndefined = { user: { profile: undefined } }
      expect(getNestedValue(objWithUndefined, 'user.profile.name')).toBeUndefined()
    })

    it('should handle array indices in path', () => {
      expect(getNestedValue(testObj, 'items.0.name')).toBe('Item 1')
      expect(getNestedValue(testObj, ['items', '1', 'name'])).toBe('Item 2')
    })
  })

  describe('setNestedValue', () => {
    it('should set nested value using dot notation', () => {
      const obj = { user: { profile: { name: 'John' } } }
      const result = setNestedValue(obj, 'user.profile.name', 'Jane')

      expect(result.user.profile.name).toBe('Jane')
      expect(obj.user.profile.name).toBe('John') // Original unchanged
    })

    it('should set nested value using array path', () => {
      const obj = { user: { settings: { theme: 'light' } } }
      const result = setNestedValue(obj, ['user', 'settings', 'theme'], 'dark')

      expect(result.user.settings.theme).toBe('dark')
    })

    it('should create intermediate objects', () => {
      const obj = {}
      const result = setNestedValue(obj, 'user.profile.name', 'John')

      expect(result.user.profile.name).toBe('John')
    })

    it('should not mutate original object', () => {
      const obj = { user: { profile: { name: 'John' } } }
      const result = setNestedValue(obj, 'user.profile.name', 'Jane')

      expect(result).not.toBe(obj)
      expect(result.user).not.toBe(obj.user)
      expect(result.user.profile).not.toBe(obj.user.profile)
    })

    it('should handle single key path', () => {
      const obj = { name: 'John' }
      const result = setNestedValue(obj, 'name', 'Jane')

      expect(result.name).toBe('Jane')
    })

    it('should return original object for invalid path', () => {
      const obj = { user: { name: 'John' } }
      const result = setNestedValue(obj, '', 'value')

      expect(result).toBe(obj)
    })

    it('should return original object for null object', () => {
      const obj = null as any
      const result = setNestedValue(obj, 'user.name', 'John')

      expect(result).toBe(obj)
    })

    it('should handle null values', () => {
      const obj = { user: { name: 'John' } }
      const result = setNestedValue(obj, 'user.name', null)

      expect(result.user.name).toBeNull()
    })

    it('should handle undefined values', () => {
      const obj = { user: { name: 'John' } }
      const result = setNestedValue(obj, 'user.name', undefined)

      expect(result.user.name).toBeUndefined()
    })

    it('should handle invalid intermediate path', () => {
      const obj = { user: { profile: 'not an object' } }
      const result = setNestedValue(obj, 'user.profile.name', 'John')

      expect(result).toBe(obj) // Should return original when path is invalid
    })

    it('should handle array intermediate values', () => {
      const obj = { items: ['a', 'b'] }
      const result = setNestedValue(obj, 'items.0', 'c')

      // Arrays are objects, so this should work
      expect(result.items[0]).toBe('c')
    })

    it('should clone nested objects', () => {
      const obj = { user: { profile: { name: 'John', age: 30 } } }
      const result = setNestedValue(obj, 'user.profile.name', 'Jane')

      expect(result.user.profile.age).toBe(30) // Other properties preserved
      expect(result.user.profile).not.toBe(obj.user.profile) // Cloned
    })
  })

  describe('hasNestedValue', () => {
    const testObj = {
      user: {
        profile: {
          name: 'John',
        },
      },
      items: [1, 2, 3],
    }

    it('should return true for existing nested value', () => {
      expect(hasNestedValue(testObj, 'user.profile.name')).toBe(true)
      expect(hasNestedValue(testObj, ['user', 'profile', 'name'])).toBe(true)
    })

    it('should return false for non-existent path', () => {
      expect(hasNestedValue(testObj, 'user.profile.email')).toBe(false)
      expect(hasNestedValue(testObj, 'nonexistent.path')).toBe(false)
    })

    it('should return false for null object', () => {
      expect(hasNestedValue(null, 'user.name')).toBe(false)
    })

    it('should return false for undefined object', () => {
      expect(hasNestedValue(undefined, 'user.name')).toBe(false)
    })

    it('should return false for empty path', () => {
      expect(hasNestedValue(testObj, '')).toBe(false)
      expect(hasNestedValue(testObj, [])).toBe(false)
    })

    it('should return true for undefined value', () => {
      const obj = { user: { name: undefined } }
      expect(hasNestedValue(obj, 'user.name')).toBe(true) // Key exists, value is undefined
    })

    it('should return false when intermediate value is null', () => {
      const obj = { user: { profile: null } }
      expect(hasNestedValue(obj, 'user.profile.name')).toBe(false)
    })

    it('should handle array indices', () => {
      expect(hasNestedValue(testObj, 'items.0')).toBe(true)
      expect(hasNestedValue(testObj, 'items.5')).toBe(false)
    })
  })
})
