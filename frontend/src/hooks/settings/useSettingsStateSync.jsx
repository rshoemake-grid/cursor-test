import { useEffect } from "react";
function useSettingsStateSync(options) {
  const {
    loadedProviders,
    loadedIterationLimit,
    loadedDefaultModel,
    providers,
    iterationLimit,
    defaultModel,
    settingsLoaded,
    setProviders,
    setIterationLimit,
    setDefaultModel,
    setSettingsLoaded,
    onLoadComplete
  } = options;
  useEffect(() => {
    if (loadedProviders.length > 0 && providers.length === 0) {
      setProviders(loadedProviders);
    }
  }, [loadedProviders, providers.length, setProviders]);
  useEffect(() => {
    if (typeof loadedIterationLimit === "number" && iterationLimit === 10) {
      setIterationLimit(loadedIterationLimit);
    }
  }, [loadedIterationLimit, iterationLimit, setIterationLimit]);
  useEffect(() => {
    if (loadedDefaultModel && !defaultModel) {
      setDefaultModel(loadedDefaultModel);
    }
  }, [loadedDefaultModel, defaultModel, setDefaultModel]);
  useEffect(() => {
    if (onLoadComplete && loadedProviders.length > 0 && !settingsLoaded) {
      onLoadComplete({
        providers: loadedProviders,
        iteration_limit: loadedIterationLimit,
        default_model: loadedDefaultModel
      });
      setSettingsLoaded(true);
    }
  }, [
    loadedProviders,
    loadedIterationLimit,
    loadedDefaultModel,
    onLoadComplete,
    setSettingsLoaded,
    settingsLoaded
  ]);
}
export {
  useSettingsStateSync
};
