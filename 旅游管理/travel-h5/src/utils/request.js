import axios from 'axios'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api/travel').replace(/\/$/, '')

const request = axios.create({
  baseURL: apiBaseUrl,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
})

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || '网络请求失败'
    return Promise.reject(new Error(message))
  }
)

export function post(url, data) {
  return request.post(url, data).then((data) => {
    if (data?.success === false) {
      throw new Error(data.message || data.error || '请求失败')
    }
    return data
  })
}

export function get(url, params) {
  return request.get(url, { params }).then((data) => {
    if (data?.success === false) {
      throw new Error(data.message || data.error || '请求失败')
    }
    return data
  })
}

const buildStreamUrl = (url) => `${apiBaseUrl}/${String(url).replace(/^\//, '')}`

const parseSseBlock = (block) => {
  const lines = block.split('\n').filter(Boolean)
  const event = lines.find((line) => line.startsWith('event:'))?.replace(/^event:\s*/, '') || 'message'
  const dataText = lines
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.replace(/^data:\s*/, ''))
    .join('\n')

  if (!dataText) return null

  try {
    return { event, data: JSON.parse(dataText) }
  } catch (error) {
    return { event, data: { type: 'chunk', content: dataText } }
  }
}

export function fetchStream(url, data, onChunk, onComplete, onError) {
  const controller = new AbortController()

  ;(async () => {
    let buffer = ''
    let completed = false

    try {
      const response = await fetch(buildStreamUrl(url), {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream'
        },
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`请求失败：${response.status}`)
      }

      if (!response.body) {
        throw new Error('当前浏览器不支持流式响应')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const blocks = buffer.split('\n\n')
        buffer = blocks.pop() || ''

        for (const block of blocks) {
          const parsed = parseSseBlock(block)
          if (!parsed) continue

          const { event, data: payload } = parsed
          if (payload.type === 'chunk') {
            onChunk?.(payload.content || '')
          } else if (payload.type === 'complete') {
            if (!completed) {
              completed = true
              onComplete?.(payload.data)
            }
          } else if (payload.type === 'done' || payload.done || event === 'done') {
            if (!completed) {
              completed = true
              onComplete?.(payload.data)
            }
          } else if (payload.type === 'error' || event === 'error') {
            throw new Error(payload.error || '流式响应异常')
          }
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        onError?.(error.message || '流式请求失败')
      }
    }
  })()

  return controller
}
