/** Unique ids without pulling in a uuid dependency. */
export const createId = (prefix = 'id'): string =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`