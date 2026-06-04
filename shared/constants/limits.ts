// Pagination limits for the Signal Feed API.
//
// `FEED_PAGE_SIZE` is the default page size used when the client omits `?limit=`.
// `FEED_PAGE_SIZE_MAX` is the hard cap enforced by `signalQuerySchema`; requests
// above this are rejected with a 400 by the feed endpoint.
export const FEED_PAGE_SIZE = 10

export const FEED_PAGE_SIZE_MAX = 50
