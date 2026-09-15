export interface RingPosition {
  angle: number;
  opacity: number;
  radius: number;
}

const RING_RADIUS = 260;
const MAX_RING_ANGLE = 72;

function getRelativeIndex(itemIndex: number, activeIndex: number, count: number) {
  const difference = itemIndex - activeIndex;
  return ((difference + count / 2) % count + count) % count - count / 2;
}

export function getRingPosition(itemIndex: number, activeIndex: number, count: number): RingPosition {
  if (!Number.isInteger(itemIndex) || !Number.isInteger(activeIndex) || !Number.isInteger(count) || count < 1 || itemIndex < 0 || itemIndex >= count || activeIndex < 0 || activeIndex >= count) {
    return { angle: 0, opacity: 1, radius: 0 };
  }

  if (count === 1) return { angle: 0, opacity: 1, radius: 0 };

  const relativeIndex = getRelativeIndex(itemIndex, activeIndex, count);
  const angleStep = count === 2 ? 56 : MAX_RING_ANGLE / (count / 2);
  const angle = relativeIndex * angleStep;
  const opacity = angle === 0
    ? 1
    : count === 2
      ? 0.68
      : Math.max(0.52, 1 - Math.abs(angle) / 180);

  return { angle, opacity, radius: RING_RADIUS };
}

export function getRingCssProperties(itemIndex: number, activeIndex: number, count: number) {
  const position = getRingPosition(itemIndex, activeIndex, count);

  return {
    "--ring-angle": `${position.angle}deg`,
    "--ring-opacity": `${position.opacity}`,
    "--ring-radius": `${position.radius}px`,
  };
}
