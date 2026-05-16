import { useRef, useCallback } from 'react';

// Returns pointer event handlers for a circular-drag knob.
// onDelta(delta: number) is called with a normalized delta (-1 to +1 per full rotation).
export function useKnob(onDelta) {
  const startAngleRef = useRef(null);
  const centerRef = useRef({ x: 0, y: 0 });

  const getAngle = (clientX, clientY) =>
    Math.atan2(clientY - centerRef.current.y, clientX - centerRef.current.x);

  const onPointerDown = useCallback(
    (e) => {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      startAngleRef.current = getAngle(e.clientX, e.clientY);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    []
  );

  const onPointerMove = useCallback(
    (e) => {
      if (startAngleRef.current === null) return;
      const currentAngle = getAngle(e.clientX, e.clientY);
      let delta = currentAngle - startAngleRef.current;
      // Wrap-around correction
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;
      startAngleRef.current = currentAngle;
      // Normalize: full rotation (2π) = 1.0
      onDelta(delta / (2 * Math.PI));
    },
    [onDelta]
  );

  const onPointerUp = useCallback(() => {
    startAngleRef.current = null;
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp };
}
