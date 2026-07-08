export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export const TOKEN_KEY = 'bearer_token'

export type CuisineType = 'ASIAN' | 'PIZZA' | 'AMERICAN' | 'MEXICAN'

export interface Restaurant {
  id: string
  name: string
  description: string
  address: string
  neighborhood: string
  image: string
  cuisineType: CuisineType
  latitude: number
  longitude: number
  rating: number
  capacity: number
}

export interface Reservation {
  id: string
  restaurantId: string
  userId: string
  reservationDate: string
  reservationTime: string
  partySize: number
  status: 'CONFIRMED' | 'CANCELLED'
  createdAt: string
}

export interface AvailabilitySlot {
  time: string
  capacity: number
  available: boolean
  remainingCapacity: number
}

export interface Favourite {
  userId: string
  restaurantId: string
}

export interface FavouriteWithRestaurant extends Favourite {
  restaurant: Restaurant
}

export interface Comment {
  id: string
  restaurantId: string
  userId: string
  fullName: string
  rating: number
  body: string
  createdAt: string
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

type ApiErrorPayload = {
  error?: unknown
  message?: unknown
  details?: unknown
}

/** A single field-level validation detail returned by the API. */
export interface ApiErrorDetail {
  field: string
  message: string
}

/**
 * Typed error thrown for all non-2xx API responses.
 * `details` is populated when the server returns validation errors.
 */
export class ApiError extends Error {
  readonly status: number
  readonly details: ApiErrorDetail[]

  constructor(message: string, status: number, details: ApiErrorDetail[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }

  /** Returns the first detail message for a given dot-notation field path, e.g. "body.name". */
  fieldError(field: string): string | undefined {
    return this.details.find(
      (d) => d.field === field || d.field === `body.${field}`,
    )?.message
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  if (!text.trim()) return { ok: true, value: null }
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return { ok: false }
  }
}

function normalizeDetails(details: unknown): ApiErrorDetail[] {
  if (!Array.isArray(details)) return []

  return details
    .filter((detail): detail is Record<string, unknown> => isRecord(detail))
    .map((detail) => ({
      field: typeof detail.field === 'string' ? detail.field : 'unknown',
      message: typeof detail.message === 'string' ? detail.message : 'Invalid value',
    }))
}

function statusFallbackMessage(status: number): string {
  if (status === 400) return 'Invalid request data'
  if (status === 401) return 'Your session has expired. Please sign in again.'
  if (status === 403) return 'You do not have permission to perform this action.'
  if (status === 404) return 'Requested resource was not found.'
  if (status === 409) return 'This action conflicts with the current data state.'
  if (status === 422) return 'Validation failed. Please review your input.'
  if (status >= 500) return 'The server is temporarily unavailable. Please try again.'
  return 'Request failed'
}

function buildApiError(
  response: Response,
  payload: unknown,
  fallbackText: string,
): ApiError {
  const record = isRecord(payload) ? (payload as ApiErrorPayload) : null
  const payloadError = typeof record?.error === 'string' ? record.error : ''
  const payloadMessage = typeof record?.message === 'string' ? record.message : ''
  const message =
    payloadError ||
    payloadMessage ||
    response.statusText ||
    fallbackText ||
    statusFallbackMessage(response.status)
  const details = normalizeDetails(record?.details)

  return new ApiError(message, response.status, details)
}

export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Authenticated fetch that injects the bearer token and optionally a JSON body.
 * Returns parsed JSON, or null for empty (204) responses.
 */
export async function authFetch<T = unknown>(
  url: string,
  method: HttpMethod = 'GET',
  body?: unknown,
): Promise<T> {
  const token = getToken()

  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${url}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      0,
    )
  }

  const rawText = await response.text()
  const parsed = parseJson(rawText)

  if (!response.ok) {
    throw buildApiError(response, parsed.ok ? parsed.value : null, rawText)
  }

  if (response.status === 204) return null as T

  if (!rawText.trim()) return null as T

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    if (!parsed.ok) {
      throw new ApiError(
        'The server returned malformed JSON. Please try again later.',
        response.status,
      )
    }
    return parsed.value as T
  }

  return rawText as T
}

// ---- Restaurants ----
export const getRestaurants = () => authFetch<Restaurant[]>('/api/restaurants')

export const getRestaurant = (id: string) =>
  authFetch<Restaurant>(`/api/restaurants/${id}`)

export const getAvailability = (
  restaurantId: string,
  date: string,
  partySize: number,
) =>
  authFetch<AvailabilitySlot[]>(
    `/api/restaurants/${restaurantId}/availability?date=${encodeURIComponent(
      date,
    )}&partySize=${partySize}`,
  )

// ---- Reservations ----
export const createReservation = (payload: {
  restaurantId: string
  reservationDate: string
  reservationTime: string
  partySize: number
}) => authFetch<Reservation>('/api/reservations', 'POST', payload)

export const getMyReservations = () =>
  authFetch<Reservation[]>('/api/reservations/me')

export const cancelReservation = (reservationId: string) =>
  authFetch<Reservation>(`/api/reservations/${reservationId}/cancel`, 'PATCH')

// ---- Favourites ----
export const getFavourites = () =>
  authFetch<FavouriteWithRestaurant[]>('/api/me/favourites')

export const addFavourite = (restaurantId: string) =>
  authFetch<Favourite>(`/api/me/favourites/${restaurantId}`, 'POST')

export const removeFavourite = (restaurantId: string) =>
  authFetch<null>(`/api/me/favourites/${restaurantId}`, 'DELETE')

// ---- Comments ----
export const getComments = (restaurantId: string) =>
  authFetch<Comment[]>(`/api/restaurants/${restaurantId}/comments`)

export const createComment = (
  restaurantId: string,
  payload: { rating: number; body: string },
) =>
  authFetch<Comment>(
    `/api/restaurants/${restaurantId}/comments`,
    'POST',
    payload,
  )

export const updateComment = (
  restaurantId: string,
  commentId: string,
  payload: { rating: number; body: string },
) =>
  authFetch<Comment>(
    `/api/comments/${commentId}`,
    'PATCH',
    payload,
  )

export const deleteComment = (restaurantId: string, commentId: string) =>
  authFetch<null>(
    `/api/comments/${commentId}`,
    'DELETE',
  )

// ---- Restaurant CRUD ----
export type RestaurantPayload = {
  name: string
  description: string
  address: string
  neighborhood: string
  image: string
  cuisineType: CuisineType
  latitude: number
  longitude: number
  capacity: number
}

export const createRestaurant = (payload: RestaurantPayload) =>
  authFetch<Restaurant>('/api/restaurants', 'POST', payload)

export const updateRestaurant = (id: string, payload: Partial<RestaurantPayload>) =>
  authFetch<Restaurant>(`/api/restaurants/${id}`, 'PATCH', payload)

export const deleteRestaurant = (id: string) =>
  authFetch<null>(`/api/restaurants/${id}`, 'DELETE')
