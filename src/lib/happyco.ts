const DEFAULT_BASE_URL = 'https://externalgraph.happyco.com'

type HappyCoGraphqlResponse<T> = {
  data?: T
  errors?: { message?: string }[]
}

export const getHappyCoConfig = () => {
  const envBaseUrl = import.meta.env.VITE_HAPPYCO_BASE_URL
  const baseUrl = envBaseUrl && envBaseUrl.trim().length > 0 ? envBaseUrl : DEFAULT_BASE_URL
  const token = import.meta.env.VITE_HAPPYCO_TOKEN

  return {
    baseUrl,
    hasToken: Boolean(token),
  }
}

export async function happyCoGraphql<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: { baseUrl?: string }
): Promise<T> {
  const envBaseUrl = import.meta.env.VITE_HAPPYCO_BASE_URL
  const resolvedBaseUrl =
    (options?.baseUrl && options.baseUrl.trim().length > 0 ? options.baseUrl : null) ??
    (envBaseUrl && envBaseUrl.trim().length > 0 ? envBaseUrl : null) ??
    DEFAULT_BASE_URL
  const token = import.meta.env.VITE_HAPPYCO_TOKEN

  if (!token) {
    throw new Error('Missing HappyCo token. Set VITE_HAPPYCO_TOKEN in .env.local.')
  }

  const response = await fetch(resolvedBaseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  })

  const rawText = await response.text()
  const payload = rawText
    ? (JSON.parse(rawText) as HappyCoGraphqlResponse<T>)
    : ({} as HappyCoGraphqlResponse<T>)

  if (!response.ok) {
    const errorMessage =
      payload.errors?.map((error) => error.message).filter(Boolean).join(', ') ||
      rawText ||
      `HappyCo request failed (${response.status})`
    throw new Error(errorMessage)
  }

  if (payload.errors && payload.errors.length > 0) {
    throw new Error(payload.errors[0]?.message ?? 'HappyCo request failed')
  }

  if (!payload.data) {
    throw new Error('HappyCo request returned no data.')
  }

  return payload.data
}
