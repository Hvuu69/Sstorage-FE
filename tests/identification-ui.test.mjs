import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { BarcodeFormat, QRCodeWriter } from '@zxing/library'
import { cameraErrorMessage, captureCanvasBlob, createBrowserScanner, createCameraFrameDecoder, createScanDeduper, createVideoConstraints, decodeImageFile, decodeImageFileDetailed, isRoutineDecodeError, listCameraDevices, SCANNER_FORMAT_NAMES, startVideoFrameScanner, stopScanner, waitForVideoDimensions } from '../src/features/identification/scanner/scannerRuntime.js'

let server
let components

const EAN_L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011']
const EAN_G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111']
const EAN_PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL']

function renderEan13Rgba(value, scale = 4, height = 160) {
  const digits = [...value].map(Number)
  const left = digits.slice(1, 7).map((digit, index) => EAN_PARITY[digits[0]][index] === 'L' ? EAN_L[digit] : EAN_G[digit]).join('')
  const right = digits.slice(7).map((digit) => [...EAN_L[digit]].map((bit) => bit === '0' ? '1' : '0').join('')).join('')
  const bits = `0000000000${`101${left}01010${right}101`}0000000000`
  const width = bits.length * scale
  const rgba = new Uint8ClampedArray(width * height * 4).fill(255)
  for (let y = 0; y < height; y += 1) {
    for (let module = 0; module < bits.length; module += 1) {
      if (bits[module] !== '1') continue
      for (let offsetX = 0; offsetX < scale; offsetX += 1) {
        const offset = ((y * width) + (module * scale) + offsetX) * 4
        rgba[offset] = 0
        rgba[offset + 1] = 0
        rgba[offset + 2] = 0
      }
    }
  }
  return { rgba, width, height }
}

function canvasFromRgba(rgba, width, height) {
  const context = { getImageData: () => ({ data: rgba }) }
  return { width, height, getContext: () => context }
}

test.before(async () => {
  server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  components = {
    IdentificationPage: (await server.ssrLoadModule('/src/features/identification/pages/IdentificationPage.jsx')).default,
    ProductScanResult: (await server.ssrLoadModule('/src/features/identification/components/ProductScanResult.jsx')).default,
  }
})

test.after(async () => server.close())

test('scanner page provides camera, manual and USB keyboard fallback states', () => {
  const html = renderToStaticMarkup(createElement(components.IdentificationPage))
  assert.match(html, /Bật camera/)
  assert.match(html, /Nhập hoặc quét mã/)
  assert.match(html, /máy quét USB/i)
  assert.match(html, /Mã vừa quét/)
  assert.match(html, /Đọc QR\/Barcode từ ảnh/)
  assert.match(html, /Chụp frame đang quét/)
  assert.match(html, /image\/png,image\/jpeg,image\/webp/)
  assert.match(html, /không thay đổi tồn kho/i)
})

test('scan result renders product identity without internal stock', () => {
  const html = renderToStaticMarkup(createElement(components.ProductScanResult, { product: {
    sku: 'SP-01', productName: 'Sản phẩm', categoryName: 'Thực phẩm', unitName: 'Thùng', unitSymbol: 'th',
    status: 'ACTIVE', identifierType: 'QR', identifierValue: 'QR-SP-01',
  } }))
  assert.match(html, /Nhận diện thành công/)
  assert.match(html, /QR-SP-01/)
  assert.doesNotMatch(html, /Tồn kho/)
})

test('duplicate scan debounce allows the same code only after it leaves the frame', () => {
  let now = 1000
  const accept = createScanDeduper(2000, () => now)
  assert.equal(accept(' QR-01 '), true)
  now = 1500
  assert.equal(accept('QR-01'), false)
  assert.equal(accept('QR-02'), true)
  now = 4000
  assert.equal(accept('QR-02'), false)
  now = 6100
  accept.markAbsent()
  assert.equal(accept('QR-02'), true)
})

test('camera errors distinguish denied, unavailable and unsupported failures', () => {
  assert.match(cameraErrorMessage({ name: 'NotAllowedError', message: 'Permission denied' }), /NotAllowedError: Permission denied/)
  assert.match(cameraErrorMessage({ name: 'NotFoundError', message: 'No camera' }), /NotFoundError: No camera/)
  assert.match(cameraErrorMessage({ name: 'TypeError', message: 'Decoder initialization failed' }), /TypeError: Decoder initialization failed/)
  assert.doesNotMatch(cameraErrorMessage({ name: 'TypeError', message: 'Decoder initialization failed' }), /HTTPS\/localhost/)
})

test('shared browser decoder initializes with camera and image entry points', async () => {
  const reader = await createBrowserScanner()
  assert.equal(typeof reader.decodeCanvas, 'function')
  assert.equal(typeof reader.decodeFromImageUrl, 'function')
  assert.deepEqual(SCANNER_FORMAT_NAMES, ['QR_CODE', 'EAN_13', 'UPC_A', 'CODE_128'])
})

test('independent jsQR camera decoder reads the required webcam payload', async () => {
  const size = 300
  const matrix = new QRCodeWriter().encode('QR-SW-VPP-010', BarcodeFormat.QR_CODE, size, size, new Map())
  const rgba = new Uint8ClampedArray(size * size * 4)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = ((y * size) + x) * 4
      const color = matrix.get(x, y) ? 0 : 255
      rgba[offset] = color
      rgba[offset + 1] = color
      rgba[offset + 2] = color
      rgba[offset + 3] = 255
    }
  }
  const decoder = await createCameraFrameDecoder()
  const detailed = decoder.decodeCanvasDetailed(canvasFromRgba(rgba, size, size))
  assert.equal(detailed.result.getText(), 'QR-SW-VPP-010')
  assert.equal(detailed.decoder, 'jsQR')
  assert.ok(detailed.quality.contrast > 200)
  assert.ok(detailed.quality.sharpness > 0)
})

test('camera frame decoder treats a blank frame as a miss without console warnings', async () => {
  const decoder = await createCameraFrameDecoder()
  const originalWarn = console.warn
  let warnings = 0
  console.warn = () => { warnings += 1 }
  try {
    const rgba = new Uint8ClampedArray(64 * 64 * 4).fill(255)
    assert.equal(decoder.decodeCanvas(canvasFromRgba(rgba, 64, 64)), null)
    assert.equal(warnings, 0)
  } finally {
    console.warn = originalWarn
  }
})

test('camera frame decoder reads EAN-13 and normalizes UPC-A', async () => {
  const decoder = await createCameraFrameDecoder()
  const ean = renderEan13Rgba('5901234123457')
  const upca = renderEan13Rgba('0036000291452')
  const eanResult = decoder.decodeCanvas(canvasFromRgba(ean.rgba, ean.width, ean.height))
  const upcaResult = decoder.decodeCanvas(canvasFromRgba(upca.rgba, upca.width, upca.height))
  assert.equal(eanResult.getText(), '5901234123457')
  assert.equal(eanResult.getBarcodeFormat(), BarcodeFormat.EAN_13)
  assert.equal(upcaResult.getText(), '036000291452')
  assert.equal(upcaResult.getBarcodeFormat(), BarcodeFormat.UPC_A)
})

test('camera scan loop reuses one canvas and stops all scheduled work', () => {
  const scheduled = []
  const cancelled = []
  let drawCount = 0
  let decodeCount = 0
  let finalStats
  const context = {
    drawImage: () => { drawCount += 1 },
    getImageData: () => ({ data: new Uint8ClampedArray(32 * 32 * 4) }),
  }
  const canvas = { width: 0, height: 0, getContext: () => context }
  const control = startVideoFrameScanner({
    videoElement: { videoWidth: 640, videoHeight: 480 },
    canvasElement: canvas,
    frameDecoder: { decodeCanvas: () => { decodeCount += 1; return null } },
    onStats: (stats) => { finalStats = stats },
    schedule: (callback) => { scheduled.push(callback); return scheduled.length },
    cancel: (id) => { cancelled.push(id) },
  })
  scheduled.shift()()
  assert.equal(drawCount, 1)
  assert.equal(decodeCount, 1)
  assert.deepEqual([canvas.width, canvas.height], [640, 480])
  control.pause()
  const scheduledBeforeResume = scheduled.length
  control.resume()
  assert.equal(scheduled.length, scheduledBeforeResume + 1)
  scheduled.pop()()
  assert.equal(decodeCount, 2)
  control.stop()
  assert.equal(cancelled.length, 2)
  assert.equal(finalStats.frames, 2)
  assert.equal(finalStats.misses, 2)
  assert.equal(finalStats.running, false)
})

test('debug frame capture exports the exact reusable canvas as PNG', async () => {
  const blob = new Blob(['frame'], { type: 'image/png' })
  const result = await captureCanvasBlob({ width: 640, height: 480, toBlob: (callback, type) => {
    assert.equal(type, 'image/png')
    callback(blob)
  } })
  assert.equal(result, blob)
})

test('decoder starts only with valid intrinsic video dimensions', async () => {
  assert.deepEqual(await waitForVideoDimensions({ videoWidth: 1280, videoHeight: 720 }), { width: 1280, height: 720 })
})

test('routine no-code frame errors are distinguished from real decoder failures', () => {
  assert.equal(isRoutineDecodeError({ name: 'NotFoundException' }), true)
  assert.equal(isRoutineDecodeError({ constructor: { name: 'ChecksumException' } }), true)
  assert.equal(isRoutineDecodeError({ name: 'TypeError' }), false)
})

test('uploaded image is decoded and its object URL is always released', async () => {
  let revoked
  const result = { getText: () => 'QR-SW-DOUONG-008' }
  const reader = { decodeFromImageUrl: async (url) => {
    assert.equal(url, 'blob:test-image')
    return result
  } }
  const decoded = await decodeImageFile(reader, { name: 'qr.png' }, {
    createObjectURL: () => 'blob:test-image',
    revokeObjectURL: (url) => { revoked = url },
  })
  assert.equal(decoded.getText(), 'QR-SW-DOUONG-008')
  assert.equal(revoked, 'blob:test-image')
})

test('captured PNG diagnostic pipeline returns detailed decoder evidence and releases its URL', async () => {
  let revoked
  const evidence = { result: null, quality: { signature: 123, width: 640, height: 480 }, errors: [] }
  const decoded = await decodeImageFileDetailed({ decodeFromImageUrlDetailed: async () => evidence }, new Blob(['frame']), {
    createObjectURL: () => 'blob:captured-frame',
    revokeObjectURL: (url) => { revoked = url },
  })
  assert.equal(decoded, evidence)
  assert.equal(revoked, 'blob:captured-frame')
})

test('camera constraints select an exact device or use environment-facing fallback', () => {
  assert.deepEqual(createVideoConstraints('camera-2'), { audio: false, video: {
    width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 }, deviceId: { exact: 'camera-2' },
  } })
  assert.deepEqual(createVideoConstraints(''), { audio: false, video: {
    width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 }, facingMode: { ideal: 'environment' },
  } })
})

test('camera enumeration exposes only video input devices', async () => {
  const devices = await listCameraDevices({ enumerateDevices: async () => [
    { kind: 'audioinput', deviceId: 'mic-1' },
    { kind: 'videoinput', deviceId: 'cam-1', label: 'Webcam' },
    { kind: 'audiooutput', deviceId: 'speaker-1' },
  ] })
  assert.deepEqual(devices.map((device) => device.deviceId), ['cam-1'])
})

test('scanner cleanup stops decoder and every media track', () => {
  let decoderStopped = 0
  let tracksStopped = 0
  const video = { srcObject: { getTracks: () => [{ stop: () => { tracksStopped += 1 } }, { stop: () => { tracksStopped += 1 } }] } }
  stopScanner({ stop: () => { decoderStopped += 1 } }, video)
  assert.equal(decoderStopped, 1)
  assert.equal(tracksStopped, 2)
  assert.equal(video.srcObject, null)
})
