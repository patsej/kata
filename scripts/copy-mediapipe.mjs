// Copies MediaPipe's WebAssembly runtime into public/ so the app does not
// depend on a third-party CDN at runtime (works offline once cached).
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'node_modules/@mediapipe/tasks-vision/wasm')
const dest = join(root, 'public/mediapipe/wasm')

if (!existsSync(src)) {
  console.error('MediaPipe wasm introuvable : lance `npm install` d’abord.')
  process.exit(1)
}
mkdirSync(dest, { recursive: true })
cpSync(src, dest, { recursive: true })
console.log('MediaPipe wasm copié dans public/mediapipe/wasm')
