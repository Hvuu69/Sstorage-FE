import { BrowserMultiFormatOneDReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library'
import jsQR from 'jsqr'

const DUPLICATE_WINDOW_MS = 2000

export const SCANNER_FORMAT_NAMES = ['QR_CODE', 'EAN_13', 'UPC_A', 'CODE_128']
const ROUTINE_DECODE_ERRORS = new Set(['NotFoundException', 'ChecksumException', 'FormatException'])

export function createScanDeduper(windowMs = DUPLICATE_WINDOW_MS, now = () => Date.now()) {
  let previousCode = null
  let lastSeenAt = 0
  const accept = (rawCode) => {
    const code = rawCode?.trim()
    if (!code) return false
    const current = now()
    if (code === previousCode) {
      lastSeenAt = current
      return false
    }
    previousCode = code
    lastSeenAt = current
    return true
  }
  accept.markAbsent = () => {
    if (previousCode && now() - lastSeenAt >= windowMs) previousCode = null
  }
  accept.reset = () => { previousCode = null }
  return accept
}

export function cameraErrorMessage(error) {
  const detail = [error?.name, error?.message].filter(Boolean).join(': ')
  const withDetail = (message) => detail ? `${message} (${detail})` : message
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
    return withDetail('Không có quyền dùng camera. Hãy cấp quyền camera hoặc nhập mã thủ công.')
  }
  if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError') {
    return withDetail('Không tìm thấy camera phù hợp trên thiết bị.')
  }
  if (error?.name === 'NotReadableError') {
    return withDetail('Camera đang được ứng dụng khác sử dụng.')
  }
  if (error?.name === 'AbortError') {
    return withDetail('Trình duyệt đã hủy quá trình khởi động camera.')
  }
  return withDetail('Không thể khởi động camera.')
}

export function stopScanner(control, videoElement) {
  control?.stop?.()
  const stream = videoElement?.srcObject
  stream?.getTracks?.().forEach((track) => track.stop())
  if (videoElement) videoElement.srcObject = null
}

export function isRoutineDecodeError(error) {
  return ROUTINE_DECODE_ERRORS.has(error?.name) || ROUTINE_DECODE_ERRORS.has(error?.constructor?.name)
}

export function waitForVideoDimensions(videoElement, timeoutMs = 5000) {
  if (!videoElement) return Promise.reject(new Error('Không tìm thấy phần tử video để khởi tạo decoder.'))
  if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
    return Promise.resolve({ width: videoElement.videoWidth, height: videoElement.videoHeight })
  }

  return new Promise((resolve, reject) => {
    const events = ['loadedmetadata', 'canplay', 'resize']
    let timeoutId
    const cleanup = () => {
      clearTimeout(timeoutId)
      events.forEach((eventName) => videoElement.removeEventListener?.(eventName, checkDimensions))
    }
    const checkDimensions = () => {
      if (videoElement.videoWidth <= 0 || videoElement.videoHeight <= 0) return
      cleanup()
      resolve({ width: videoElement.videoWidth, height: videoElement.videoHeight })
    }
    events.forEach((eventName) => videoElement.addEventListener?.(eventName, checkDimensions))
    timeoutId = setTimeout(() => {
      cleanup()
      reject(new Error('Camera đã mở nhưng video chưa cung cấp kích thước frame hợp lệ.'))
    }, timeoutMs)
    checkDimensions()
  })
}

export async function decodeImageFile(reader, file, urlApi = globalThis.URL) {
  if (!file) throw new Error('Chưa chọn ảnh QR/Barcode.')
  if (!urlApi?.createObjectURL || !urlApi?.revokeObjectURL) {
    throw new Error('Trình duyệt không hỗ trợ đọc ảnh đã chọn.')
  }
  const imageUrl = urlApi.createObjectURL(file)
  try {
    return await reader.decodeFromImageUrl(imageUrl)
  } finally {
    urlApi.revokeObjectURL(imageUrl)
  }
}

export async function decodeImageFileDetailed(reader, file, urlApi = globalThis.URL) {
  if (!file) throw new Error('Chưa có frame ảnh để giải mã.')
  if (!reader?.decodeFromImageUrlDetailed) throw new Error('Decoder không hỗ trợ chẩn đoán ảnh.')
  const imageUrl = urlApi.createObjectURL(file)
  try {
    return await reader.decodeFromImageUrlDetailed(imageUrl)
  } finally {
    urlApi.revokeObjectURL(imageUrl)
  }
}

export async function createCameraFrameDecoder() {
  const barcodeHints = new Map([[
    DecodeHintType.POSSIBLE_FORMATS,
    [BarcodeFormat.EAN_13, BarcodeFormat.UPC_A, BarcodeFormat.CODE_128],
  ]])
  const barcodeReader = new BrowserMultiFormatOneDReader(barcodeHints)
  let imageCanvas = null

  const analyzeFrame = (data, width, height) => {
    const pixelCount = width * height
    const step = Math.max(1, Math.floor(pixelCount / 4096))
    let minimum = 255
    let maximum = 0
    let total = 0
    let count = 0
    let signature = 0
    let edgeTotal = 0
    let edgeCount = 0
    for (let pixel = 0; pixel < pixelCount; pixel += step) {
      const offset = pixel * 4
      const luma = Math.round((data[offset] + data[offset + 1] + data[offset + 2]) / 3)
      minimum = Math.min(minimum, luma)
      maximum = Math.max(maximum, luma)
      total += luma
      signature = ((signature * 31) + luma) >>> 0
      count += 1
      const x = pixel % width
      const y = Math.floor(pixel / width)
      if (x + 1 < width) {
        const rightOffset = offset + 4
        const rightLuma = Math.round((data[rightOffset] + data[rightOffset + 1] + data[rightOffset + 2]) / 3)
        edgeTotal += Math.abs(luma - rightLuma)
        edgeCount += 1
      }
      if (y + 1 < height) {
        const downOffset = offset + (width * 4)
        const downLuma = Math.round((data[downOffset] + data[downOffset + 1] + data[downOffset + 2]) / 3)
        edgeTotal += Math.abs(luma - downLuma)
        edgeCount += 1
      }
    }
    return {
      width,
      height,
      minimum,
      maximum,
      contrast: maximum - minimum,
      average: Math.round(total / count),
      sharpness: Math.round((edgeTotal / Math.max(edgeCount, 1)) * 10) / 10,
      signature,
    }
  }

  const decodeCanvasDetailed = (canvasElement) => {
    if (!canvasElement || canvasElement.width <= 0 || canvasElement.height <= 0) {
      throw new Error('Canvas camera không có kích thước hợp lệ.')
    }
    const context = canvasElement.getContext('2d', { willReadFrequently: true }) || canvasElement.getContext('2d')
    if (!context) throw new Error('Không thể đọc pixel từ canvas camera.')
    const width = canvasElement.width
    const height = canvasElement.height
    const imageData = context.getImageData(0, 0, width, height)
    const quality = analyzeFrame(imageData.data, width, height)
    let qrError = null
    try {
      const qrResult = jsQR(imageData.data, width, height, { inversionAttempts: 'attemptBoth' })
      if (qrResult?.data) {
        return {
          result: { getText: () => qrResult.data, getBarcodeFormat: () => BarcodeFormat.QR_CODE },
          decoder: 'jsQR',
          quality,
          errors: [],
        }
      }
    } catch (error) {
      qrError = error
    }

    try {
      const barcodeResult = barcodeReader.decodeFromCanvas(canvasElement)
      return { result: barcodeResult, decoder: 'ZXing-1D', quality, errors: qrError ? [qrError] : [] }
    } catch (error) {
      if (!isRoutineDecodeError(error)) throw error
      return {
        result: null,
        decoder: null,
        quality,
        errors: [qrError, error].filter(Boolean).map((item) => ({ name: item?.name, message: item?.message })),
      }
    }
  }

  return {
    decodeCanvas(canvasElement) {
      return decodeCanvasDetailed(canvasElement).result
    },
    decodeCanvasDetailed,
    async decodeFromImageUrlDetailed(imageUrl) {
      if (!globalThis.Image || !globalThis.document?.createElement) throw new Error('Trình duyệt không hỗ trợ giải mã ảnh.')
      const image = new globalThis.Image()
      image.decoding = 'async'
      await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = () => reject(new Error('Không thể tải ảnh để giải mã.'))
        image.src = imageUrl
      })
      if (!imageCanvas) imageCanvas = globalThis.document.createElement('canvas')
      imageCanvas.width = image.naturalWidth || image.width
      imageCanvas.height = image.naturalHeight || image.height
      const context = imageCanvas.getContext('2d', { willReadFrequently: true }) || imageCanvas.getContext('2d')
      if (!context) throw new Error('Không thể tạo canvas cho ảnh tải lên.')
      context.drawImage(image, 0, 0, imageCanvas.width, imageCanvas.height)
      return decodeCanvasDetailed(imageCanvas)
    },
    async decodeFromImageUrl(imageUrl) {
      const detailed = await this.decodeFromImageUrlDetailed(imageUrl)
      if (detailed.result) return detailed.result
      throw new NotFoundException('Không tìm thấy QR/Barcode trong ảnh.')
    },
  }
}

export function captureCanvasBlob(canvasElement, type = 'image/png') {
  if (!canvasElement?.toBlob || canvasElement.width <= 0 || canvasElement.height <= 0) {
    return Promise.reject(new Error('Canvas chưa có frame camera hợp lệ.'))
  }
  return new Promise((resolve, reject) => {
    canvasElement.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Không thể xuất frame camera thành ảnh.'))
    }, type)
  })
}

export function startVideoFrameScanner({
  videoElement,
  canvasElement,
  frameDecoder,
  onResult,
  onMiss,
  onError,
  onStats,
  intervalMs = 400,
  reportIntervalMs = 5000,
  schedule = globalThis.setTimeout,
  cancel = globalThis.clearTimeout,
  now = () => Date.now(),
}) {
  if (!videoElement || !canvasElement || !frameDecoder) throw new Error('Thiếu video, canvas hoặc decoder cho camera scanner.')
  let context
  try {
    context = canvasElement.getContext('2d', { willReadFrequently: true })
  } catch {
    context = canvasElement.getContext('2d')
  }
  if (!context) throw new Error('Không thể tạo Canvas 2D context cho camera scanner.')

  let stopped = false
  let paused = false
  let running = false
  let timerId
  const startedAt = now()
  let lastReportAt = startedAt
  const stats = { frames: 0, misses: 0, decoded: 0, errors: 0, width: 0, height: 0, running: true }
  const sampleFrame = () => {
    if (canvasElement.width <= 0 || canvasElement.height <= 0) return null
    const sampleWidth = Math.min(32, canvasElement.width)
    const sampleHeight = Math.min(32, canvasElement.height)
    const startX = Math.floor((canvasElement.width - sampleWidth) / 2)
    const startY = Math.floor((canvasElement.height - sampleHeight) / 2)
    const pixels = context.getImageData(startX, startY, sampleWidth, sampleHeight).data
    let minimum = 255
    let maximum = 0
    let total = 0
    let signature = 0
    for (let index = 0; index < pixels.length; index += 4) {
      const luma = Math.round((pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3)
      minimum = Math.min(minimum, luma)
      maximum = Math.max(maximum, luma)
      total += luma
      signature = ((signature * 31) + luma) >>> 0
    }
    return { minimum, maximum, average: Math.round(total / (pixels.length / 4)), signature }
  }
  const report = (force = false) => {
    const current = now()
    if (!force && current - lastReportAt < reportIntervalMs) return
    lastReportAt = current
    onStats?.({
      ...stats,
      running: !stopped,
      elapsedMs: current - startedAt,
      framesPerSecond: stats.frames / Math.max((current - startedAt) / 1000, 0.001),
      frameSample: sampleFrame(),
    })
  }
  const stop = () => {
    if (stopped) return
    stopped = true
    cancel(timerId)
    report(true)
  }
  const pause = () => {
    if (stopped || paused) return
    paused = true
    cancel(timerId)
  }
  const resume = () => {
    if (stopped || !paused) return
    paused = false
    timerId = schedule(scanFrame, 0)
  }
  const scanFrame = () => {
    if (stopped || paused || running) return
    const width = videoElement.videoWidth
    const height = videoElement.videoHeight
    if (width <= 0 || height <= 0) {
      stats.misses += 1
      onMiss?.()
      report()
      timerId = schedule(scanFrame, intervalMs)
      return
    }

    running = true
    try {
      if (canvasElement.width !== width || canvasElement.height !== height) {
        canvasElement.width = width
        canvasElement.height = height
      }
      stats.frames += 1
      stats.width = width
      stats.height = height
      context.drawImage(videoElement, 0, 0, width, height)
      const detailed = frameDecoder.decodeCanvasDetailed
        ? frameDecoder.decodeCanvasDetailed(canvasElement)
        : { result: frameDecoder.decodeCanvas(canvasElement) }
      stats.lastDiagnostic = {
        decoder: detailed.decoder || null,
        quality: detailed.quality || null,
        errors: detailed.errors || [],
      }
      const result = detailed.result
      if (result) {
        stats.decoded += 1
        onResult?.(result)
      } else {
        stats.misses += 1
        onMiss?.()
      }
    } catch (error) {
      if (isRoutineDecodeError(error)) {
        stats.misses += 1
        onMiss?.()
      }
      else {
        stats.errors += 1
        stop()
        onError?.(error)
      }
    } finally {
      running = false
      report()
      if (!stopped && !paused) timerId = schedule(scanFrame, intervalMs)
    }
  }

  timerId = schedule(scanFrame, 0)
  return { stop, pause, resume }
}

export function createVideoConstraints(deviceId) {
  const preferredVideo = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  }
  return {
    audio: false,
    video: deviceId
      ? { ...preferredVideo, deviceId: { exact: deviceId } }
      : { ...preferredVideo, facingMode: { ideal: 'environment' } },
  }
}

export async function listCameraDevices(mediaDevices = globalThis.navigator?.mediaDevices) {
  if (!mediaDevices?.enumerateDevices) return []
  const devices = await mediaDevices.enumerateDevices()
  return devices.filter((device) => device.kind === 'videoinput')
}

export async function createBrowserScanner() {
  return createCameraFrameDecoder()
}
