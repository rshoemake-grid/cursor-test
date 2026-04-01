import { useRef, useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";

const ScrollArea = styled.div`
  overflow: auto;
  height: ${(p) => p.$height}px;
  width: 100%;
`;

const Inner = styled.div`
  position: relative;
  width: 100%;
  height: ${(p) => p.$total}px;
`;

const Row = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  transform: translateY(${(p) => p.$y}px);
`;

function computeLayout(items, itemHeight) {
  if (typeof itemHeight === "number") {
    const heights = items.map(() => itemHeight);
    const offsets = [0];
    for (let i = 0; i < heights.length; i += 1) {
      offsets.push(offsets[i] + heights[i]);
    }
    return { heights, offsets, total: offsets[offsets.length - 1] || 0 };
  }
  const heights = items.map((_, i) => itemHeight(i));
  const offsets = [0];
  for (let i = 0; i < heights.length; i += 1) {
    offsets.push(offsets[i] + heights[i]);
  }
  return { heights, offsets, total: offsets[offsets.length - 1] || 0 };
}

function VirtualizedList({ items, itemHeight, renderItem, containerHeight = 600, className = "", overscan = 5 }) {
  const parentRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const { offsets, total } = useMemo(() => computeLayout(items, itemHeight), [items, itemHeight]);

  const onScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const scrollBottom = scrollTop + containerHeight;
  let start = 0;
  let end = -1;
  if (items.length > 0) {
    for (let i = 0; i < items.length; i += 1) {
      if (offsets[i + 1] > scrollTop) {
        start = Math.max(0, i - overscan);
        break;
      }
    }
    end = start;
    for (let j = start; j < items.length; j += 1) {
      if (offsets[j] >= scrollBottom && j > start) {
        end = j - 1;
        break;
      }
      end = j;
    }
    end = Math.min(items.length - 1, end + overscan);
  }

  return (
    <ScrollArea ref={parentRef} $height={containerHeight} className={className} onScroll={onScroll}>
      <Inner $total={total}>
        {items.length > 0 &&
          Array.from({ length: end - start + 1 }, (_, k) => start + k).map((index) => (
            <Row key={items[index]?.id ?? `row-${index}`} $y={offsets[index]}>
              {renderItem(items[index], index)}
            </Row>
          ))}
      </Inner>
    </ScrollArea>
  );
}

VirtualizedList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
  itemHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.func]).isRequired,
  renderItem: PropTypes.func.isRequired,
  containerHeight: PropTypes.number,
  className: PropTypes.string,
  overscan: PropTypes.number,
};

export { VirtualizedList as default };
