/**
 * Base URL of the backend API. Defaults to `/api` on the current origin, which Next.js
 * proxies to the backend (see next.config.js), so it works from any device.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

/** Origin for files the backend serves outside `/api` (e.g. `/uploads`); empty means same-origin. */
export const API_ORIGIN = /^https?:\/\//.test(API_URL) ? new URL(API_URL).origin : ''
