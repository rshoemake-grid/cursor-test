import {
  createContext,
  useContext,
  useState,
  useMemo,
} from "react";

const CanvasClipboardContext = createContext(undefined);

function CanvasClipboardProvider({ children }) {
  const [clipboard, setClipboard] = useState(null);

  const value = useMemo(
    () => ({ clipboard, setClipboard }),
    [clipboard],
  );

  return (
    <CanvasClipboardContext.Provider value={value}>
      {children}
    </CanvasClipboardContext.Provider>
  );
}

function useCanvasClipboardStore() {
  return useContext(CanvasClipboardContext);
}

export { CanvasClipboardProvider, useCanvasClipboardStore };
