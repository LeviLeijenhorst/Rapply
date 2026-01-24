const isDev = typeof __DEV__ !== "undefined" && __DEV__

type LogMethod = (...args: any[]) => void

function noop(): void {}

function pick(method: "log" | "warn" | "error"): LogMethod {
  if (!isDev) return noop
  const fn = (console as any)?.[method]
  if (typeof fn === "function") return fn.bind(console)
  return noop
}

export const logger = {
  debug: pick("log"),
  info: pick("log"),
  warn: pick("warn"),
  error: pick("error"),
}



