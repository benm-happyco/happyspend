const DEFAULT_BASE_URL = 'https://manage.staging.happyco.com/graph'

type HappyCoGraphqlResponse<T> = {
  data?: T
  errors?: { message?: string }[]
}

export const getHappyCoConfig = () => {
  const baseUrl = import.meta.env.VITE_HAPPYCO_BASE_URL || DEFAULT_BASE_URL
  const token = import.meta.env.VITE_HAPPYCO_TOKEN

  return {
    baseUrl,
    hasToken: Boolean(token),
  }
}

export async function happyCoGraphql<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const baseUrl = import.meta.env.VITE_HAPPYCO_BASE_URL || DEFAULT_BASE_URL
  const token = import.meta.env.VITE_HAPPYCO_TOKEN

  if (!token) {
    throw new Error('Missing HappyCo token. Set VITE_HAPPYCO_TOKEN in .env.local.')
  }

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`HappyCo request failed (${response.status})`)
  }

  const payload = (await response.json()) as HappyCoGraphqlResponse<T>
  if (payload.errors && payload.errors.length > 0) {
    throw new Error(payload.errors[0]?.message ?? 'HappyCo request failed')
  }

  if (!payload.data) {
    throw new Error('HappyCo request returned no data.')
  }

  return payload.data
}
