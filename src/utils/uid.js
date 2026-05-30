/** Generate a short random ID */
export const uid = () => Math.random().toString(36).slice(2, 10)
