type Params = {
  appendChar: (nextChar: string) => void
  charDelayMs?: number
}

type TypewriterStream = {
  pushDelta: (delta: string) => void
  waitUntilIdle: () => Promise<void>
  dispose: () => void
}

export function createTypewriterStream({ appendChar, charDelayMs = 14 }: Params): TypewriterStream {
  const delay = Math.max(6, Math.floor(charDelayMs))
  let queue = ''
  let timer: ReturnType<typeof setTimeout> | null = null
  let disposed = false
  let idleResolvers: Array<() => void> = []

  function resolveIdleIfNeeded() {
    if (queue.length > 0 || timer) return
    const pending = idleResolvers
    idleResolvers = []
    pending.forEach((resolve) => resolve())
  }

  function tick() {
    timer = null
    if (disposed) {
      resolveIdleIfNeeded()
      return
    }
    if (queue.length === 0) {
      resolveIdleIfNeeded()
      return
    }
    const nextChar = queue[0]
    queue = queue.slice(1)
    appendChar(nextChar)
    timer = setTimeout(tick, delay)
  }

  function ensureTick() {
    if (disposed || timer || queue.length === 0) return
    timer = setTimeout(tick, delay)
  }

  return {
    pushDelta(delta: string) {
      if (disposed) return
      const chunk = String(delta || '')
      if (!chunk) return
      queue += chunk
      ensureTick()
    },
    waitUntilIdle() {
      if (disposed || (queue.length === 0 && !timer)) return Promise.resolve()
      return new Promise<void>((resolve) => {
        idleResolvers.push(resolve)
      })
    },
    dispose() {
      disposed = true
      queue = ''
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      resolveIdleIfNeeded()
    },
  }
}
