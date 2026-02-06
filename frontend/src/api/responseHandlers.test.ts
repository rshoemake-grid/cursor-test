/**
 * Response Handler Utilities Tests
 * Tests for API response processing utilities
 */

import type { AxiosResponse } from 'axios'
import { extractData, extractDataAsync } from './responseHandlers'

describe('responseHandlers', () => {
  describe('extractData', () => {
    it('should extract data from axios response', () => {
      const mockResponse = {
        data: { id: '1', name: 'Test' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as AxiosResponse

      const result = extractData(mockResponse)
      expect(result).toEqual({ id: '1', name: 'Test' })
    })

    it('should handle array responses', () => {
      const mockResponse = {
        data: [1, 2, 3],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as AxiosResponse

      const result = extractData(mockResponse)
      expect(result).toEqual([1, 2, 3])
    })

    it('should handle string responses', () => {
      const mockResponse = {
        data: 'test string',
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as AxiosResponse

      const result = extractData(mockResponse)
      expect(result).toBe('test string')
    })

    it('should handle null data', () => {
      const mockResponse = {
        data: null,
        status: 204,
        statusText: 'No Content',
        headers: {},
        config: {} as any,
      } as AxiosResponse

      const result = extractData(mockResponse)
      expect(result).toBeNull()
    })
  })

  describe('extractDataAsync', () => {
    it('should extract data from promise resolving to axios response', async () => {
      const mockResponse = {
        data: { id: '1', name: 'Test' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as AxiosResponse

      const promise = Promise.resolve(mockResponse)
      const result = await extractDataAsync(promise)

      expect(result).toEqual({ id: '1', name: 'Test' })
    })

    it('should handle async errors', async () => {
      const promise = Promise.reject(new Error('Network error'))

      await expect(extractDataAsync(promise)).rejects.toThrow('Network error')
    })
  })
})
