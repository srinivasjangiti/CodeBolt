module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Support any OpenAI-compatible provider (NVIDIA, Gemini, OpenAI, Custom)
  const targetBaseUrl = req.headers['x-base-url'] || 'https://integrate.api.nvidia.com/v1'
  const apiKey = req.headers['x-api-key'] || req.headers['x-nvidia-api-key'] || process.env.VITE_NVIDIA_API_KEY

  if (!apiKey) {
    return res.status(400).json({ error: 'API key not configured. Please provide your API key in Settings or environment.' })
  }

  try {
    const { apiKey: clientApiKey, ...bodyWithoutKey } = req.body || {}
    const requestBody = clientApiKey && !process.env.VITE_NVIDIA_API_KEY ? bodyWithoutKey : req.body

    const response = await fetch(`${targetBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return res.status(response.status).json({ error: errorText })
    }

    const contentType = response.headers.get('content-type') || 'text/event-stream'
    res.status(response.status)
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')

    if (!response.body) {
      const text = await response.text()
      return res.send(text)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(decoder.decode(value, { stream: true }))
      }
    } finally {
      reader.releaseLock()
      res.end()
    }
  } catch (error) {
    console.error('Completions proxy error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) })
  }
}