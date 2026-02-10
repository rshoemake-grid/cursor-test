import {
  buildHeaders,
  buildAuthHeaders,
  buildJsonHeaders,
  buildUploadHeaders,
  extractApiErrorMessage,
  isApiResponseOk,
  parseJsonResponse,
} from './apiUtils'

describe('apiUtils', () => {
  describe('buildHeaders', () => {
    it('should build headers with token', () => {
      const headers = buildHeaders({ token: 'test-token' })
      expect(headers['Authorization']).toBe('Bearer test-token')
    })

    it('should build headers without token', () => {
      const headers = buildHeaders({})
      expect(headers['Authorization']).toBeUndefined()
    })

    it('should build headers with contentType', () => {
      const headers = buildHeaders({ contentType: 'application/json' })
      expect(headers['Content-Type']).toBe('application/json')
    })

    it('should omit Content-Type when contentType is null', () => {
      const headers = buildHeaders({ contentType: null })
      expect(headers['Content-Type']).toBeUndefined()
    })

    it('should omit Content-Type when contentType is undefined', () => {
      const headers = buildHeaders({ contentType: undefined })
      expect(headers['Content-Type']).toBeUndefined()
    })

    it('should include additional headers', () => {
      const headers = buildHeaders({
        additionalHeaders: { 'X-Custom': 'value' },
      })
      expect(headers['X-Custom']).toBe('value')
    })

    it('should combine token, contentType, and additional headers', () => {
      const headers = buildHeaders({
        token: 'test-token',
        contentType: 'application/json',
        additionalHeaders: { 'X-Custom': 'value' },
      })
      expect(headers['Authorization']).toBe('Bearer test-token')
      expect(headers['Content-Type']).toBe('application/json')
      expect(headers['X-Custom']).toBe('value')
    })

    it('should handle empty options', () => {
      const headers = buildHeaders()
      expect(Object.keys(headers).length).toBe(0)
    })
  })

  describe('buildAuthHeaders', () => {
    it('should build headers with token and JSON content type', () => {
      const headers = buildAuthHeaders({ token: 'test-token' })
      expect(headers['Authorization']).toBe('Bearer test-token')
      expect(headers['Content-Type']).toBe('application/json')
    })

    it('should build headers without token', () => {
      const headers = buildAuthHeaders({})
      expect(headers['Authorization']).toBeUndefined()
      expect(headers['Content-Type']).toBe('application/json')
    })

    it('should allow custom contentType override', () => {
      const headers = buildAuthHeaders({ token: 'test-token', contentType: 'text/plain' })
      expect(headers['Content-Type']).toBe('text/plain')
    })

    it('should include additional headers', () => {
      const headers = buildAuthHeaders({
        token: 'test-token',
        additionalHeaders: { 'X-Custom': 'value' },
      })
      expect(headers['X-Custom']).toBe('value')
    })
  })

  describe('buildJsonHeaders', () => {
    it('should build headers with JSON content type', () => {
      const headers = buildJsonHeaders()
      expect(headers['Content-Type']).toBe('application/json')
    })

    it('should include additional headers', () => {
      const headers = buildJsonHeaders({ 'X-Custom': 'value' })
      expect(headers['Content-Type']).toBe('application/json')
      expect(headers['X-Custom']).toBe('value')
    })

    it('should not include authorization by default', () => {
      const headers = buildJsonHeaders()
      expect(headers['Authorization']).toBeUndefined()
    })
  })

  describe('buildUploadHeaders', () => {
    it('should build headers without Content-Type', () => {
      const headers = buildUploadHeaders()
      expect(headers['Content-Type']).toBeUndefined()
    })

    it('should include additional headers', () => {
      const headers = buildUploadHeaders({ 'X-Custom': 'value' })
      expect(headers['X-Custom']).toBe('value')
      expect(headers['Content-Type']).toBeUndefined()
    })

    it('should not include authorization by default', () => {
      const headers = buildUploadHeaders()
      expect(headers['Authorization']).toBeUndefined()
    })
  })

  describe('extractApiErrorMessage', () => {
    it('should extract message from string error', () => {
      expect(extractApiErrorMessage('Simple error')).toBe('Simple error')
    })

    it('should extract message from Error object', () => {
      const error = new Error('Error message')
      expect(extractApiErrorMessage(error)).toBe('Error message')
    })

    it('should extract detail from API error response', () => {
      const error = {
        response: {
          data: {
            detail: 'API error detail',
          },
        },
      }
      expect(extractApiErrorMessage(error)).toBe('API error detail')
    })

    it('should extract message from API error response', () => {
      const error = {
        response: {
          data: {
            message: 'API error message',
          },
        },
      }
      expect(extractApiErrorMessage(error)).toBe('API error message')
    })

    it('should prefer detail over message in API response', () => {
      const error = {
        response: {
          data: {
            detail: 'Detail message',
            message: 'Regular message',
          },
        },
      }
      expect(extractApiErrorMessage(error)).toBe('Detail message')
    })

    it('should extract message from error object with message property', () => {
      const error = { message: 'Custom error' }
      expect(extractApiErrorMessage(error)).toBe('Custom error')
    })

    it('should return default message for unknown error', () => {
      expect(extractApiErrorMessage({})).toBe('An error occurred')
      expect(extractApiErrorMessage(null)).toBe('An error occurred')
    })

    it('should use custom default message', () => {
      expect(extractApiErrorMessage({}, 'Custom default')).toBe('Custom default')
    })

    it('should handle Error with empty message', () => {
      const error = new Error('')
      expect(extractApiErrorMessage(error, 'Default')).toBe('Default')
    })

    it('should handle nested error structures', () => {
      const error = {
        error: {
          message: 'Nested error',
        },
      }
      expect(extractApiErrorMessage(error)).toBe('An error occurred')
    })

    it('should handle Error object with no message property', () => {
      const error = new Error()
      delete (error as any).message
      expect(extractApiErrorMessage(error, 'Default')).toBe('Default')
    })

    it('should handle Error object that is not instanceof Error but has message', () => {
      const error = Object.create(null)
      error.message = 'Custom message'
      expect(extractApiErrorMessage(error)).toBe('Custom message')
    })

    it('should handle error with response.data but no detail or message', () => {
      const error = {
        response: {
          data: {},
        },
      }
      expect(extractApiErrorMessage(error)).toBe('An error occurred')
    })

    it('should handle error with response but no data', () => {
      const error = {
        response: {},
      }
      expect(extractApiErrorMessage(error)).toBe('An error occurred')
    })
  })

  describe('isApiResponseOk', () => {
    it('should return true for 200 status', () => {
      const response = { ok: true, status: 200 } as Response
      expect(isApiResponseOk(response)).toBe(true)
    })

    it('should return true for 299 status', () => {
      const response = { ok: true, status: 299 } as Response
      expect(isApiResponseOk(response)).toBe(true)
    })

    it('should return false for 199 status', () => {
      const response = { ok: false, status: 199 } as Response
      expect(isApiResponseOk(response)).toBe(false)
    })

    it('should return false for 300 status', () => {
      const response = { ok: false, status: 300 } as Response
      expect(isApiResponseOk(response)).toBe(false)
    })

    it('should return false for 400 status', () => {
      const response = { ok: false, status: 400 } as Response
      expect(isApiResponseOk(response)).toBe(false)
    })

    it('should return false for 500 status', () => {
      const response = { ok: false, status: 500 } as Response
      expect(isApiResponseOk(response)).toBe(false)
    })

    it('should handle response with ok=false even if status is 200', () => {
      const response = { ok: false, status: 200 } as Response
      expect(isApiResponseOk(response)).toBe(false)
    })

    it('should return true for 201 status (created)', () => {
      const response = { ok: true, status: 201 } as Response
      expect(isApiResponseOk(response)).toBe(true)
    })

    it('should return true for 204 status (no content)', () => {
      const response = { ok: true, status: 204 } as Response
      expect(isApiResponseOk(response)).toBe(true)
    })

    it('should return false for 400 status (bad request)', () => {
      const response = { ok: false, status: 400 } as Response
      expect(isApiResponseOk(response)).toBe(false)
    })

    it('should return false for 401 status (unauthorized)', () => {
      const response = { ok: false, status: 401 } as Response
      expect(isApiResponseOk(response)).toBe(false)
    })

    it('should return false for 404 status (not found)', () => {
      const response = { ok: false, status: 404 } as Response
      expect(isApiResponseOk(response)).toBe(false)
    })

    it('should return true for 202 status (accepted)', () => {
      const response = { ok: true, status: 202 } as Response
      expect(isApiResponseOk(response)).toBe(true)
    })
  })

  describe('parseJsonResponse', () => {
    it('should parse valid JSON response', async () => {
      const response = {
        text: async () => JSON.stringify({ key: 'value' }),
      } as Response

      const result = await parseJsonResponse(response)
      expect(result).toEqual({ key: 'value' })
    })

    it('should return null for empty response', async () => {
      const response = {
        text: async () => '',
      } as Response

      const result = await parseJsonResponse(response)
      expect(result).toBeNull()
    })

    it('should return null for invalid JSON', async () => {
      const response = {
        text: async () => 'invalid json',
      } as Response

      const result = await parseJsonResponse(response)
      expect(result).toBeNull()
    })

    it('should handle parsing errors gracefully', async () => {
      const response = {
        text: async () => {
          throw new Error('Parse error')
        },
      } as Response

      const result = await parseJsonResponse(response)
      expect(result).toBeNull()
    })

    it('should parse complex JSON structures', async () => {
      const complexData = {
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' },
        },
      }
      const response = {
        text: async () => JSON.stringify(complexData),
      } as Response

      const result = await parseJsonResponse(response)
      expect(result).toEqual(complexData)
    })

    it('should handle null JSON values', async () => {
      const response = {
        text: async () => 'null',
      } as Response

      const result = await parseJsonResponse(response)
      expect(result).toBeNull()
    })

    it('should handle array JSON', async () => {
      const response = {
        text: async () => JSON.stringify([1, 2, 3]),
      } as Response

      const result = await parseJsonResponse(response)
      expect(result).toEqual([1, 2, 3])
    })

    it('should handle whitespace-only response', async () => {
      const response = {
        text: async () => '   ',
      } as Response

      const result = await parseJsonResponse(response)
      expect(result).toBeNull()
    })

    it('should handle response with only newlines', async () => {
      const response = {
        text: async () => '\n\n',
      } as Response

      const result = await parseJsonResponse(response)
      expect(result).toBeNull()
    })

    it('should handle malformed JSON with trailing comma', async () => {
      const response = {
        text: async () => '{"key": "value",}',
      } as Response

      const result = await parseJsonResponse(response)
      expect(result).toBeNull()
    })

    it('should handle JSON with escaped characters', async () => {
      const response = {
        text: async () => JSON.stringify({ message: 'Hello\nWorld\tTest' }),
      } as Response

      const result = await parseJsonResponse(response)
      expect(result).toEqual({ message: 'Hello\nWorld\tTest' })
    })

    it('should handle response.text() returning undefined', async () => {
      const response = {
        text: async () => undefined as any,
      } as Response

      const result = await parseJsonResponse(response)
      expect(result).toBeNull()
    })
  })
})
