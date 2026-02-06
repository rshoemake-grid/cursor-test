/**
 * Input Editor Helper Functions
 * Extracted common onChange handlers to improve DRY compliance
 * Single Responsibility: Only handles input field change handlers
 */

/**
 * Create onChange handler for text input fields
 * DRY: Reusable handler pattern for all text inputs
 */
export function createTextInputHandler(
  setValue: (value: string) => void,
  onConfigUpdate: (configField: string, field: string, value: unknown) => void,
  configField: string,
  field: string
) {
  return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    onConfigUpdate(configField, field, newValue)
  }
}

/**
 * Create onChange handler for select fields
 * DRY: Reusable handler pattern for all select inputs
 */
export function createSelectHandler(
  setValue: (value: string) => void,
  onConfigUpdate: (configField: string, field: string, value: unknown) => void,
  configField: string,
  field: string
) {
  return (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    onConfigUpdate(configField, field, newValue)
  }
}

/**
 * Create onChange handler for checkbox fields
 * DRY: Reusable handler pattern for all checkbox inputs
 */
export function createCheckboxHandler(
  setValue: (value: boolean) => void,
  onConfigUpdate: (configField: string, field: string, value: unknown) => void,
  configField: string,
  field: string
) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked
    setValue(newValue)
    onConfigUpdate(configField, field, newValue)
  }
}
