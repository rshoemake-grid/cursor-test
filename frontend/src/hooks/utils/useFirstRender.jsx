import { useRef } from "react";
function useFirstRender() {
  const isFirstRenderRef = useRef(true);
  const markAsRendered = () => {
    isFirstRenderRef.current = false;
  };
  return {
    isFirstRender: isFirstRenderRef.current,
    markAsRendered
  };
}
export {
  useFirstRender
};
