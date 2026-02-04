/**
 * Tests for Confirmation Utilities
 */

import {
  confirmUnsavedChanges,
  confirmDelete,
  confirmAction,
} from './confirmations'
import { showConfirm } from '../../utils/confirm'

jest.mock('../../utils/confirm', () => ({
  showConfirm: jest.fn(),
}))

const mockShowConfirm = showConfirm as jest.MockedFunction<typeof showConfirm>

describe('confirmations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('confirmUnsavedChanges', () => {
    it('should call onConfirm when user confirms', async () => {
      mockShowConfirm.mockResolvedValue(true)
      const onConfirm = jest.fn()

      await confirmUnsavedChanges(onConfirm)

      expect(mockShowConfirm).toHaveBeenCalledWith(
        'This workflow has unsaved changes. Close anyway?',
        {
          title: 'Unsaved Changes',
          confirmText: 'Close',
          cancelText: 'Cancel',
          type: 'warning',
        }
      )
      expect(onConfirm).toHaveBeenCalled()
    })

    it('should not call onConfirm when user cancels', async () => {
      mockShowConfirm.mockResolvedValue(false)
      const onConfirm = jest.fn()

      await confirmUnsavedChanges(onConfirm)

      expect(mockShowConfirm).toHaveBeenCalled()
      expect(onConfirm).not.toHaveBeenCalled()
    })

    it('should handle async onConfirm', async () => {
      mockShowConfirm.mockResolvedValue(true)
      const onConfirm = jest.fn().mockResolvedValue(undefined)

      await confirmUnsavedChanges(onConfirm)

      expect(onConfirm).toHaveBeenCalled()
    })
  })

  describe('confirmDelete', () => {
    it('should call onConfirm when user confirms', async () => {
      mockShowConfirm.mockResolvedValue(true)
      const onConfirm = jest.fn()

      await confirmDelete('Test Item', onConfirm)

      expect(mockShowConfirm).toHaveBeenCalledWith(
        'Are you sure you want to delete "Test Item"?',
        {
          title: 'Delete',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          type: 'danger',
        }
      )
      expect(onConfirm).toHaveBeenCalled()
    })

    it('should not call onConfirm when user cancels', async () => {
      mockShowConfirm.mockResolvedValue(false)
      const onConfirm = jest.fn()

      await confirmDelete('Test Item', onConfirm)

      expect(onConfirm).not.toHaveBeenCalled()
    })

    it('should use custom options when provided', async () => {
      mockShowConfirm.mockResolvedValue(true)
      const onConfirm = jest.fn()

      await confirmDelete('Test Item', onConfirm, {
        title: 'Custom Title',
        confirmText: 'Yes',
        cancelText: 'No',
      })

      expect(mockShowConfirm).toHaveBeenCalledWith(
        'Are you sure you want to delete "Test Item"?',
        {
          title: 'Custom Title',
          confirmText: 'Yes',
          cancelText: 'No',
          type: 'danger',
        }
      )
    })

    it('should handle empty item name', async () => {
      mockShowConfirm.mockResolvedValue(true)
      const onConfirm = jest.fn()

      await confirmDelete('', onConfirm)

      expect(mockShowConfirm).toHaveBeenCalledWith(
        'Are you sure you want to delete ""?',
        expect.any(Object)
      )
    })
  })

  describe('confirmAction', () => {
    it('should call onConfirm when user confirms', async () => {
      mockShowConfirm.mockResolvedValue(true)
      const onConfirm = jest.fn()

      await confirmAction(
        'Custom message',
        {
          title: 'Custom Title',
          confirmText: 'OK',
          cancelText: 'Cancel',
          type: 'info',
        },
        onConfirm
      )

      expect(mockShowConfirm).toHaveBeenCalledWith('Custom message', {
        title: 'Custom Title',
        confirmText: 'OK',
        cancelText: 'Cancel',
        type: 'info',
      })
      expect(onConfirm).toHaveBeenCalled()
    })

    it('should not call onConfirm when user cancels', async () => {
      mockShowConfirm.mockResolvedValue(false)
      const onConfirm = jest.fn()

      await confirmAction('Custom message', { type: 'warning' }, onConfirm)

      expect(onConfirm).not.toHaveBeenCalled()
    })

    it('should handle all type options', async () => {
      mockShowConfirm.mockResolvedValue(true)
      const onConfirm = jest.fn()

      await confirmAction('Test', { type: 'info' }, onConfirm)
      expect(mockShowConfirm).toHaveBeenCalledWith('Test', { type: 'info' })

      await confirmAction('Test', { type: 'warning' }, onConfirm)
      expect(mockShowConfirm).toHaveBeenCalledWith('Test', { type: 'warning' })

      await confirmAction('Test', { type: 'danger' }, onConfirm)
      expect(mockShowConfirm).toHaveBeenCalledWith('Test', { type: 'danger' })
    })

    it('should handle async onConfirm', async () => {
      mockShowConfirm.mockResolvedValue(true)
      const onConfirm = jest.fn().mockResolvedValue(undefined)

      await confirmAction('Test', { type: 'info' }, onConfirm)

      expect(onConfirm).toHaveBeenCalled()
    })
  })
})
