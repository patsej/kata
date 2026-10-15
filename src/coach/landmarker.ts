import { FaceLandmarker, FilesetResolver, PoseLandmarker, type FaceLandmarkerResult, type PoseLandmarkerResult } from '@mediapipe/tasks-vision'
import type { CoachMode } from './types'

/**
 * MediaPipe runs entirely in the browser: images never leave the device.
 * The WebAssembly runtime is served by the app itself (see scripts/copy-mediapipe.mjs);
 * the models are fetched once from Google's public model storage and cached by the browser.
 */
const WASM_PATH = new URL('mediapipe/wasm', document.baseURI).href.replace(/\/$/, '')
const POSE_MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task'
const FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task'

type RunningMode = 'IMAGE' | 'VIDEO'

let fileset: ReturnType<typeof FilesetResolver.forVisionTasks> | null = null
const getFileset = () => (fileset ??= FilesetResolver.forVisionTasks(WASM_PATH))

async function withGpuFallback<T>(create: (delegate: 'GPU' | 'CPU') => Promise<T>): Promise<T> {
  try {
    return await create('GPU')
  } catch {
    return create('CPU')
  }
}

let posePromise: Promise<PoseLandmarker> | null = null
let poseMode: RunningMode = 'VIDEO'
let facePromise: Promise<FaceLandmarker> | null = null
let faceMode: RunningMode = 'VIDEO'

function getPose() {
  posePromise ??= getFileset().then((fs) =>
    withGpuFallback((delegate) =>
      PoseLandmarker.createFromOptions(fs, {
        baseOptions: { modelAssetPath: POSE_MODEL, delegate },
        runningMode: 'VIDEO',
        numPoses: 1,
      }),
    ),
  )
  posePromise.catch(() => (posePromise = null))
  return posePromise
}

function getFace() {
  facePromise ??= getFileset().then((fs) =>
    withGpuFallback((delegate) =>
      FaceLandmarker.createFromOptions(fs, {
        baseOptions: { modelAssetPath: FACE_MODEL, delegate },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true,
      }),
    ),
  )
  facePromise.catch(() => (facePromise = null))
  return facePromise
}

export type Detection =
  | { mode: 'body'; result: PoseLandmarkerResult }
  | { mode: 'face'; result: FaceLandmarkerResult }

export interface Detector {
  mode: CoachMode
  detectVideo(video: HTMLVideoElement, timestamp: number): Promise<Detection>
  detectImage(image: HTMLImageElement | HTMLCanvasElement): Promise<Detection>
}

export async function loadDetector(mode: CoachMode): Promise<Detector> {
  if (mode === 'body') {
    const lm = await getPose()
    const ensure = async (m: RunningMode) => {
      if (poseMode !== m) {
        await lm.setOptions({ runningMode: m })
        poseMode = m
      }
    }
    return {
      mode,
      async detectVideo(video, ts) {
        await ensure('VIDEO')
        return { mode, result: lm.detectForVideo(video, ts) }
      },
      async detectImage(image) {
        await ensure('IMAGE')
        return { mode, result: lm.detect(image) }
      },
    }
  }
  const lm = await getFace()
  const ensure = async (m: RunningMode) => {
    if (faceMode !== m) {
      await lm.setOptions({ runningMode: m })
      faceMode = m
    }
  }
  return {
    mode,
    async detectVideo(video, ts) {
      await ensure('VIDEO')
      return { mode, result: lm.detectForVideo(video, ts) }
    },
    async detectImage(image) {
      await ensure('IMAGE')
      return { mode, result: lm.detect(image) }
    },
  }
}

export const POSE_CONNECTIONS = PoseLandmarker.POSE_CONNECTIONS
export const FACE_CONNECTIONS = [
  ...FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
  ...FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
  ...FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
  ...FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
  ...FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
  ...FaceLandmarker.FACE_LANDMARKS_LIPS,
]
