/**
 * Post dates are plain `YYYY-MM-DD` strings, which `new Date` reads as UTC
 * midnight. Formatting one in the build machine's local zone therefore lands
 * on the previous day anywhere behind UTC, so every formatter here pins the
 * zone back to UTC and renders the date that was actually written down.
 */
const TIME_ZONE = 'UTC'

/** `2023-02-11` — used for listings and the search index. */
export const formatIsoDate = (date: string) =>
  new Date(date).toLocaleDateString('en-CA', { timeZone: TIME_ZONE })

/** `11 February 2023` — used for the dateline on a post. */
export const formatLongDate = (date: string) =>
  new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: TIME_ZONE,
  })
