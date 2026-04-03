function createTextInputHandler(setValue, onConfigUpdate, configField, field) {
  return (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    onConfigUpdate(configField, field, newValue);
  };
}
function createSelectHandler(setValue, onConfigUpdate, configField, field) {
  return (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    onConfigUpdate(configField, field, newValue);
  };
}
function createCheckboxHandler(setValue, onConfigUpdate, configField, field) {
  return (e) => {
    const newValue = e.target.checked;
    setValue(newValue);
    onConfigUpdate(configField, field, newValue);
  };
}
export { createCheckboxHandler, createSelectHandler, createTextInputHandler };
