function isProviderValid(provider) {
  return provider != null;
}
function isProviderEnabled(provider) {
  if (!isProviderValid(provider)) {
    return false;
  }
  return provider.enabled === true;
}
function hasProviderModels(provider) {
  if (!isProviderValid(provider)) {
    return false;
  }
  const models = provider.models;
  return models != null && Array.isArray(models) && models.length > 0;
}
function canExtractModelsFromProvider(provider) {
  return (
    isProviderValid(provider) &&
    isProviderEnabled(provider) &&
    hasProviderModels(provider)
  );
}
function isValidProvidersArray(providers) {
  return Array.isArray(providers);
}
function isValidData(data) {
  return data != null;
}
function hasProviders(providers) {
  if (!isValidProvidersArray(providers)) {
    return false;
  }
  return providers.length > 0;
}
export {
  canExtractModelsFromProvider,
  hasProviderModels,
  hasProviders,
  isProviderEnabled,
  isProviderValid,
  isValidData,
  isValidProvidersArray,
};
