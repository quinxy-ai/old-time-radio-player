import { useRef, useCallback } from 'react';

// Returns pointer event handlers for horizontal drag across the dial face.
// onPositionChange(newPosition: number 0-1) is called during drag.
// sensitivity: how many "dial widths" of drag covers the full 0-1 range.
//   1.0 = dragging across the full component width sweeps the whole band.
//   2.0 = you need to drag 2x the component width to sweep the whole band (slower).
export function useDial(onPositionChange, sensitivity = 1.5) {
  const startXRef = useRef(null);
  const startPositionRef = useRef(null);

  const onPointerDown = useCallback(
    (e, currentPosition) => {
      e.preventDefault();
      startXRef.current = e.clientX;
      startPositionRef.current = currentPosition;
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    []
  );

  const onPointerMove = useCallback(
    (e, componentWidth) => {
      if (startXRef.current === null || componentWidth === 0) return;
      const dx = e.clientX - startXRef.current;
      const deltaPos = dx / (componentWidth * sensitivity);
      const newPos = Math.max(0, Math.min(1, startPositionRef.current + deltaPos));
      onPositionChange(newPos);
    },
    [onPositionChange, sensitivity]
  );

  const onPointerUp = useCallback(() => {
    startXRef.current = null;
    startPositionRef.current = null;
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp };
}
