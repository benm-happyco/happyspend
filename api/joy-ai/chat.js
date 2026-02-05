/**
 * Minimal JOYAI → OpenAI bridge (Vercel Serverless Function).
 *
 * Set env var:
 * - OPENAI_API_KEY
 * Optional:
 * - OPENAI_MODEL (default: gpt-4o-mini)
 */
export default async function handler(req, res) {
  // Basic CORS (same-origin in Vercel, but harmless)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(204).end()

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return res.status(501).json({ error: 'OPENAI_API_KEY is not configured' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const messages = Array.isArray(body?.messages) ? body.messages : []
    const mode = body?.mode === 'workflows' ? 'workflows' : 'general'

    const system =
      mode === 'workflows'
        ? 'You are JOYAI, an assistant that helps property teams design operational workflows. Be concise, practical, and structured.'
        : 'You are JOYAI, an assistant for property and portfolio analysis. Be concise, pragmatic, and ask clarifying questions when needed.'

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

    const payload = {
      model,
      temperature: 0.4,
      messages: [{ role: 'system', content: system }, ...messages].slice(-25),
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return res.status(502).json({ error: 'OpenAI request failed', status: response.status, details: text.slice(0, 2000) })
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) {
      return res.status(502).json({ error: 'Empty response from OpenAI' })
    }

    return res.status(200).json({ content })
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: String(err?.message || err) })
  }
}

