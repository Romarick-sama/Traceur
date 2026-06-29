const DEFAULT_CLUSTER_DISTANCE = 80;

/**
 * Returns the size of the connected group `target` belongs to among
 * `rects` (same-type decoration hitboxes, eg. every bush in the current
 * room): two rects are in the same cluster if their centers are within
 * `distance` of each other, transitively. Used so an isolated bush/
 * thornbush doesn't count the same as a dense patch of them - a dog only
 * reacts to a real "groupement", not a single plant.
 * @param {Array<{x: number, y: number, width: number, height: number}>} rects
 * @param {{x: number, y: number, width: number, height: number}} target
 * @param {number} [distance=80]
 * @return {number}
 */
export function getClusterSize(rects, target, distance = DEFAULT_CLUSTER_DISTANCE) {
  const center = (rect) => ({
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  });

  const VISITED = new Set([target]);
  const QUEUE = [target];

  while (QUEUE.length > 0) {
    const CURRENT = QUEUE.pop();
    const CURRENT_CENTER = center(CURRENT);

    rects.forEach((rect) => {
      if (VISITED.has(rect)) {
        return;
      };

      const RECT_CENTER = center(rect);
      const DISTANCE = Math.hypot(
        RECT_CENTER.x - CURRENT_CENTER.x,
        RECT_CENTER.y - CURRENT_CENTER.y,
      );
      if (DISTANCE <= distance) {
        VISITED.add(rect);
        QUEUE.push(rect);
      };
    });
  }

  return VISITED.size;
}
