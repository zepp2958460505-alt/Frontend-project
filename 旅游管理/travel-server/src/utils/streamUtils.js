export const createStreamResponse = (res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders?.()

  const write = (event, data) => {
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  return {
    send: (data, event = 'message') => {
      try {
        write(event, data)
      } catch (error) {
        console.error('发送流式数据失败:', error)
      }
    },
    end: (data = { type: 'done', done: true }) => {
      try {
        write('done', data)
        res.end()
      } catch (error) {
        console.error('流式结束失败:', error)
      }
    },
    error: (message) => {
      try {
        write('error', { type: 'error', error: message })
        res.end()
      } catch (error) {
        console.error('流式数据错误:', error)
      }
    }
  }
}
