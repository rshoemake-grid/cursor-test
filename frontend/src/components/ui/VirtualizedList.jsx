import { jsx } from "react/jsx-runtime";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
function VirtualizedList({
  items,
  itemHeight,
  renderItem,
  containerHeight = 600,
  className = "",
  overscan = 5
}) {
  const parentRef = useRef(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: typeof itemHeight === "function" ? itemHeight : () => itemHeight,
    overscan
  });
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: parentRef,
      className: `overflow-auto ${className}`,
      style: { height: containerHeight },
      children: /* @__PURE__ */ jsx(
        "div",
        {
          style: {
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative"
          },
          children: virtualizer.getVirtualItems().map((virtualItem) => /* @__PURE__ */ jsx(
            "div",
            {
              "data-index": virtualItem.index,
              ref: virtualizer.measureElement,
              style: {
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`
              },
              children: renderItem(items[virtualItem.index], virtualItem.index)
            },
            virtualItem.key
          ))
        }
      )
    }
  );
}
export {
  VirtualizedList as default
};
