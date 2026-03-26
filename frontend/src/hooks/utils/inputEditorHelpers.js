/**
 * Input Editor Helper Functions
 * Extracted common onChange handlers to improve DRY compliance
 * Single Responsibility: Only handles input field change handlers
 */ /**
 * Create onChange handler for text input fields
 * DRY: Reusable handler pattern for all text inputs
 */ export function createTextInputHandler(setValue, onConfigUpdate, configField, field) {
    return (e)=>{
        const newValue = e.target.value;
        setValue(newValue);
        onConfigUpdate(configField, field, newValue);
    };
}
/**
 * Create onChange handler for select fields
 * DRY: Reusable handler pattern for all select inputs
 */ export function createSelectHandler(setValue, onConfigUpdate, configField, field) {
    return (e)=>{
        const newValue = e.target.value;
        setValue(newValue);
        onConfigUpdate(configField, field, newValue);
    };
}
/**
 * Create onChange handler for checkbox fields
 * DRY: Reusable handler pattern for all checkbox inputs
 */ export function createCheckboxHandler(setValue, onConfigUpdate, configField, field) {
    return (e)=>{
        const newValue = e.target.checked;
        setValue(newValue);
        onConfigUpdate(configField, field, newValue);
    };
}
