const fs = require("fs")
const path = require("path")
const https = require("https")

function readDotEnv(filePath) {
  const out = {}
  if (!fs.existsSync(filePath)) return out
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/)
  for (const raw of lines) {
    const line = String(raw || "").trim()
    if (!line || line.startsWith("#")) continue
    const eq = line.indexOf("=")
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    const value = line.slice(eq + 1).trim()
    out[key] = value
  }
  return out
}

function getSetting(name, fileEnv) {
  const runtime = String(process.env[name] || "").trim()
  if (runtime) return runtime
  return String(fileEnv[name] || "").trim()
}

function mask(value, start = 8, end = 4) {
  const text = String(value || "")
  if (text.length <= start + end) return text
  return `${text.slice(0, start)}...${text.slice(-end)}`
}

const envPath = path.resolve(__dirname, ".env")
const fileEnv = readDotEnv(envPath)

const baseUrl = getSetting("OVH_KMS_BASE_URL", fileEnv).replace(/\/+$/, "")
const serviceKeyFromArg = String(process.argv[2] || "").trim()
const serviceKeyId = serviceKeyFromArg || getSetting("OVH_KMS_SERVICE_KEY_ID", fileEnv)
const context = getSetting("OVH_KMS_CONTEXT", fileEnv) || "coachscribe-user-ark"
const certPath = getSetting("OVH_KMS_CLIENT_CERT_PATH", fileEnv)
const keyPath = getSetting("OVH_KMS_CLIENT_KEY_PATH", fileEnv)
const caPath = getSetting("OVH_KMS_CA_PATH", fileEnv)

if (!baseUrl || !serviceKeyId || !certPath || !keyPath) {
  console.error("Missing OVH KMS settings. Expected at least:")
  console.error("OVH_KMS_BASE_URL, OVH_KMS_SERVICE_KEY_ID, OVH_KMS_CLIENT_CERT_PATH, OVH_KMS_CLIENT_KEY_PATH")
  process.exit(1)
}

if (!fs.existsSync(certPath)) {
  console.error(`Cert file not found: ${certPath}`)
  process.exit(1)
}
if (!fs.existsSync(keyPath)) {
  console.error(`Key file not found: ${keyPath}`)
  process.exit(1)
}

const cert = fs.readFileSync(certPath)
const key = fs.readFileSync(keyPath)
const ca = caPath && fs.existsSync(caPath) ? fs.readFileSync(caPath) : undefined

const url = `${baseUrl}/v1/servicekey/${encodeURIComponent(serviceKeyId)}/encrypt`
const body = JSON.stringify({ plaintext: "dGVzdA==", context })

console.log("OVH probe request:")
console.log(`  baseUrl: ${baseUrl}`)
console.log(`  serviceKeyId: ${mask(serviceKeyId)}`)
console.log(`  context: ${context}`)
console.log(`  certPath: ${certPath}`)
console.log(`  keyPath: ${keyPath}`)

const req = https.request(
  url,
  {
    method: "POST",
    cert,
    key,
    ca,
    headers: {
      "content-type": "application/json",
      "content-length": Buffer.byteLength(body),
    },
  },
  (res) => {
    let data = ""
    res.on("data", (chunk) => {
      data += chunk
    })
    res.on("end", () => {
      console.log(`HTTP ${res.statusCode}`)
      console.log(data)
      process.exit(res.statusCode >= 200 && res.statusCode < 300 ? 0 : 2)
    })
  },
)

req.on("error", (err) => {
  console.error(String(err && err.message ? err.message : err))
  process.exit(1)
})

req.write(body)
req.end()
