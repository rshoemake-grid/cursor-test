/**
 * Input Editor Helper Functions Tests
 * Tests for input editor helper functions to ensure mutation resistance
 */

import {
  createTextInputHandler,
  createSelectHandler,
  createCheckboxHandler
} from './inputEditorHelpers'

describe('inputEditorHelpers', () => {
  describe('createTextInputHandler', () => {
    it('should create handler that updates value and calls onConfigUpdate', () => {
      const setValue = jest.fn()
      const onConfigUpdate = jest.fn()
      const configField = 'input_config'
      const field = 'name'

      const handler = createTextInputHandler(
        setValue,
        onConfigUpdate,
        configField,
        field
      )

      const event = {
        target: { value: 'test-value' }
      } as React.ChangeEvent<HTMLInputElement>

      handler(event)

      expect(setValue).toHaveBeenCalledWith('test-value')
      expect(onConfigUpdate).toHaveBeenCalledWith(configField, field, 'test-value')
    })

    it('should handle empty string value', () => {
      const setValue = jest.fn()
      const onConfigUpdate = jest.fn()

      const handler = createTextInputHandler(
        setValue,
        onConfigUpdate,
        'input_config',
        'name'
      )

      const event = {
        target: { value: '' }
      } as React.ChangeEvent<HTMLInputElement>

      handler(event)

      expect(setValue).toHaveBeenCalledWith('')
      expect(onConfigUpdate).toHaveBeenCalledWith('input_config', 'name', '')
    })

    it('should handle textarea elements', () => {
      const setValue = jest.fn()
      const onConfigUpdate = jest.fn()

      const handler = createTextInputHandler(
        setValue,
        onConfigUpdate,
        'input_config',
        'description'
      )

      const event = {
        target: { value: 'textarea value' }
      } as React.ChangeEvent<HTMLTextAreaElement>

      handler(event)

      expect(setValue).toHaveBeenCalledWith('textarea value')
      expect(onConfigUpdate).toHaveBeenCalledWith('input_config', 'description', 'textarea value')
    })

    it('should use correct configField and field parameters', () => {
      const setValue = jest.fn()
      const onConfigUpdate = jest.fn()

      const handler = createTextInputHandler(
        setValue,
        onConfigUpdate,
        'custom_config',
        'custom_field'
      )

      const event = {
        target: { value: 'value' }
      } as React.ChangeEvent<HTMLInputElement>

      handler(event)

      expect(onConfigUpdate).toHaveBeenCalledWith('custom_config', 'custom_field', 'value')
    })
  })

  describe('createSelectHandler', () => {
    it('should create handler that updates value and calls onConfigUpdate', () => {
      const setValue = jest.fn()
      const onConfigUpdate = jest.fn()
      const configField = 'input_config'
      const field = 'region'

      const handler = createSelectHandler(
        setValue,
        onConfigUpdate,
        configField,
        field
      )

      const event = {
        target: { value: 'us-west-1' }
      } as React.ChangeEvent<HTMLSelectElement>

      handler(event)

      expect(setValue).toHaveBeenCalledWith('us-west-1')
      expect(onConfigUpdate).toHaveBeenCalledWith(configField, field, 'us-west-1')
    })

    it('should handle empty string value', () => {
      const setValue = jest.fn()
      const onConfigUpdate = jest.fn()

      const handler = createSelectHandler(
        setValue,
        onConfigUpdate,
        'input_config',
        'region'
      )

      const event = {
        target: { value: '' }
      } as React.ChangeEvent<HTMLSelectElement>

      handler(event)

      expect(setValue).toHaveBeenCalledWith('')
      expect(onConfigUpdate).toHaveBeenCalledWith('input_config', 'region', '')
    })

    it('should use correct configField and field parameters', () => {
      const setValue = jest.fn()
      const onConfigUpdate = jest.fn()

      const handler = createSelectHandler(
        setValue,
        onConfigUpdate,
        'custom_config',
        'custom_field'
      )

      const event = {
        target: { value: 'option1' }
      } as React.ChangeEvent<HTMLSelectElement>

      handler(event)

      expect(onConfigUpdate).toHaveBeenCalledWith('custom_config', 'custom_field', 'option1')
    })
  })

  describe('createCheckboxHandler', () => {
    it('should create handler that updates value and calls onConfigUpdate', () => {
      const setValue = jest.fn()
      const onConfigUpdate = jest.fn()
      const configField = 'input_config'
      const field = 'overwrite'

      const handler = createCheckboxHandler(
        setValue,
        onConfigUpdate,
        configField,
        field
      )

      const event = {
        target: { checked: true }
      } as React.ChangeEvent<HTMLInputElement>

      handler(event)

      expect(setValue).toHaveBeenCalledWith(true)
      expect(onConfigUpdate).toHaveBeenCalledWith(configField, field, true)
    })

    it('should handle false checkbox value', () => {
      const setValue = jest.fn()
      const onConfigUpdate = jest.fn()

      const handler = createCheckboxHandler(
        setValue,
        onConfigUpdate,
        'input_config',
        'overwrite'
      )

      const event = {
        target: { checked: false }
      } as React.ChangeEvent<HTMLInputElement>

      handler(event)

      expect(setValue).toHaveBeenCalledWith(false)
      expect(onConfigUpdate).toHaveBeenCalledWith('input_config', 'overwrite', false)
    })

    it('should use correct configField and field parameters', () => {
      const setValue = jest.fn()
      const onConfigUpdate = jest.fn()

      const handler = createCheckboxHandler(
        setValue,
        onConfigUpdate,
        'custom_config',
        'custom_field'
      )

      const event = {
        target: { checked: true }
      } as React.ChangeEvent<HTMLInputElement>

      handler(event)

      expect(onConfigUpdate).toHaveBeenCalledWith('custom_config', 'custom_field', true)
    })

    it('should handle multiple checkbox toggles', () => {
      const setValue = jest.fn()
      const onConfigUpdate = jest.fn()

      const handler = createCheckboxHandler(
        setValue,
        onConfigUpdate,
        'input_config',
        'overwrite'
      )

      // First toggle to true
      const event1 = {
        target: { checked: true }
      } as React.ChangeEvent<HTMLInputElement>
      handler(event1)

      expect(setValue).toHaveBeenCalledWith(true)
      expect(onConfigUpdate).toHaveBeenCalledWith('input_config', 'overwrite', true)

      // Second toggle to false
      const event2 = {
        target: { checked: false }
      } as React.ChangeEvent<HTMLInputElement>
      handler(event2)

      expect(setValue).toHaveBeenCalledWith(false)
      expect(onConfigUpdate).toHaveBeenCalledWith('input_config', 'overwrite', false)
    })
  })
})
