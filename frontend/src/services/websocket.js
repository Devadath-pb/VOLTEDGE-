// WebSocket service for live battery readings: /ws/battery
// Falls back gracefully — the hook layer decides when to use demo data.

export function createBatterySocket({ onMessage, onOpen, onClose, onError }) {
  const url = import.meta.env.VITE_WS_URL
  if (!url) {
    onError?.(new Error('VITE_WS_URL is not configured'))
    return null
  }
  let ws
  let closedByUser = false
  let retryTimer = null

  const connect = () => {
    try {
      ws = new WebSocket(url)
    } catch (e) {
      onError?.(e)
      return
    }
    ws.onopen = () => onOpen?.()
    ws.onmessage = (ev) => {
      try { onMessage?.(JSON.parse(ev.data)) } catch { /* ignore malformed frame */ }
    }
    ws.onerror = (e) => onError?.(e)
    ws.onclose = () => {
      onClose?.()
      if (!closedByUser) retryTimer = setTimeout(connect, 4000)
    }
  }

  connect()

  return {
    close() {
      closedByUser = true
      clearTimeout(retryTimer)
      ws?.close()
    },
    get readyState() { return ws?.readyState ?? WebSocket.CLOSED },
  }
}
