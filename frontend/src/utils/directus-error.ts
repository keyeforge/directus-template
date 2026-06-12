interface DirectusErrorShape {
  response?: { status?: number }
  errors?: Array<{ extensions?: { code?: string } }>
}

export function isForbiddenError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const candidate = error as DirectusErrorShape

  if (candidate.response?.status === 403) return true

  return candidate.errors?.some(
    (item) => item.extensions?.code === 'FORBIDDEN',
  ) ?? false
}
