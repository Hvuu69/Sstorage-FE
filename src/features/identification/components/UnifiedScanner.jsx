import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Field, Select } from '../../../shared/ui/index.js'
import { identificationApi } from '../api/identificationApi.js'
import {
  cameraErrorMessage,
  captureCanvasBlob,
  createBrowserScanner,
  createCameraFrameDecoder,
  createScanDeduper,
  createVideoConstraints,
  decodeImageFile,
  decodeImageFileDetailed,
  isRoutineDecodeError,
  listCameraDevices,
  SCANNER_FORMAT_NAMES,
  startVideoFrameScanner,
  stopScanner,
  waitForVideoDimensions,
} from '../scanner/scannerRuntime.js'
import ManualCodeInput from './ManualCodeInput.jsx'

const debugEnabled = import.meta.env.DEV

function debugInfo(message, details) {
  if (!debugEnabled) return
  if (details === undefined) console.info(`[UnifiedScanner] ${message}`)
  else console.info(`[UnifiedScanner] ${message}`, details)
}

function debugError(message, error) {
  if (!debugEnabled) return
  console.error(`[UnifiedScanner] ${message}`, {
    name: error?.name,
    message: error?.message,
    stack: error?.stack,
    error,
  })
}

function lookupErrorMessage(error) {
  if (error?.errorCode === 'IDENTIFIER_NOT_FOUND') return 'Không tìm thấy sản phẩm với mã này.'
  if (error?.errorCode === 'IDENTIFIER_INACTIVE') return 'Mã nhận diện không còn hiệu lực.'
  if (error?.errorCode === 'PRODUCT_INACTIVE') return 'Sản phẩm đã ngừng hoạt động.'
  return error?.message || 'Không thể kết nối Backend.'
}

export default function UnifiedScanner({ onLookupStarted, onProductDetected, createScanner = createBrowserScanner }) {
  const videoRef = useRef(null)
  const frameCanvasRef = useRef(null)
  const controlRef = useRef(null)
  const cameraDecoderRef = useRef(null)
  const imageReaderRef = useRef(null)
  const mountedRef = useRef(true)
  const inFlightRef = useRef(false)
  const startingRef = useRef(false)
  const cameraSessionRef = useRef(0)
  const debugFrameUrlRef = useRef(null)
  const dedupeRef = useRef(createScanDeduper())
  const [cameraState, setCameraState] = useState('idle')
  const [cameras, setCameras] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [lookupState, setLookupState] = useState('idle')
  const [lastDecoded, setLastDecoded] = useState('')
  const [pendingLookup, setPendingLookup] = useState(null)
  const [uploadState, setUploadState] = useState('idle')
  const [scannerStats, setScannerStats] = useState(null)
  const [cameraSettings, setCameraSettings] = useState(null)
  const [debugFrame, setDebugFrame] = useState(null)
  const [message, setMessage] = useState('Bạn có thể bật camera hoặc nhập mã thủ công.')

  const stopCamera = useCallback(() => {
    cameraSessionRef.current += 1
    startingRef.current = false
    stopScanner(controlRef.current, videoRef.current)
    controlRef.current = null
    if (mountedRef.current) setCameraState('idle')
  }, [])

  useEffect(() => {
    mountedRef.current = true
    const videoElement = videoRef.current
    let active = true
    const mediaDevices = globalThis.navigator?.mediaDevices
    const refresh = () => listCameraDevices(mediaDevices)
      .then((devices) => { if (active) setCameras(devices) })
      .catch((error) => {
        if (import.meta.env.DEV) console.warn('[UnifiedScanner] Không thể liệt kê camera.', error)
      })
    refresh()
    mediaDevices?.addEventListener?.('devicechange', refresh)
    return () => {
      active = false
      mountedRef.current = false
      cameraSessionRef.current += 1
      startingRef.current = false
      mediaDevices?.removeEventListener?.('devicechange', refresh)
      stopScanner(controlRef.current, videoElement)
      controlRef.current = null
      if (debugFrameUrlRef.current) globalThis.URL?.revokeObjectURL?.(debugFrameUrlRef.current)
      debugFrameUrlRef.current = null
    }
  }, [])

  const identify = useCallback(async (rawCode) => {
    const code = rawCode?.trim()
    if (inFlightRef.current || !code) return
    inFlightRef.current = true
    onLookupStarted?.()
    setLookupState('loading')
    setMessage('Đang nhận diện…')
    try {
      const product = await identificationApi.lookup(code)
      if (!mountedRef.current) return
      setLookupState('success')
      setMessage(`Đã nhận diện ${product.productName}.`)
      onProductDetected?.(product)
    } catch (error) {
      if (!mountedRef.current) return
      setLookupState('error')
      setMessage(lookupErrorMessage(error))
    } finally {
      inFlightRef.current = false
    }
  }, [onLookupStarted, onProductDetected])

  const processDecoded = useCallback((rawCode, source = 'camera', format = 'UNKNOWN') => {
    const code = rawCode?.trim()
    if (!code) return
    setLastDecoded(code)
    debugInfo('Decoded text.', { source, format, value: code })
    if (inFlightRef.current || !dedupeRef.current(code)) return
    // A passive effect starts lookup only after React commits "Mã vừa quét" to the UI.
    setPendingLookup({ code })
  }, [])

  useEffect(() => {
    if (!pendingLookup) return undefined
    const timeoutId = globalThis.setTimeout(() => identify(pendingLookup.code), 0)
    return () => globalThis.clearTimeout(timeoutId)
  }, [identify, pendingLookup])

  const getReader = useCallback(async (targetRef) => {
    if (!targetRef.current) {
      targetRef.current = await createScanner()
      debugInfo('Scanner initialized.')
      debugInfo('Supported formats.', SCANNER_FORMAT_NAMES)
    }
    return targetRef.current
  }, [createScanner])

  const getCameraDecoder = useCallback(async () => {
    if (!cameraDecoderRef.current) {
      cameraDecoderRef.current = await createCameraFrameDecoder()
      debugInfo('Camera frame decoder initialized.')
      debugInfo('Supported formats.', SCANNER_FORMAT_NAMES)
    }
    return cameraDecoderRef.current
  }, [])

  async function refreshCameras(videoElement) {
    try {
      const devices = await listCameraDevices()
      if (!mountedRef.current) return
      setCameras(devices)
      const activeDeviceId = videoElement?.srcObject?.getVideoTracks?.()[0]?.getSettings?.().deviceId
      if (activeDeviceId) setSelectedDeviceId(activeDeviceId)
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[UnifiedScanner] Không thể cập nhật danh sách camera.', error)
    }
  }

  async function startCamera(deviceId = selectedDeviceId) {
    if (startingRef.current) return
    if (globalThis.isSecureContext === false) {
      setCameraState('error')
      setMessage('Camera chỉ hoạt động trên HTTPS hoặc localhost. Hãy nhập mã thủ công.')
      return
    }
    if (!globalThis.navigator?.mediaDevices?.getUserMedia) {
      setCameraState('error')
      setMessage('Thiết bị hoặc trình duyệt không hỗ trợ camera. Hãy nhập mã thủ công.')
      return
    }
    const videoElement = videoRef.current
    if (!videoElement) {
      const error = new Error('Không tìm thấy phần tử video để gắn camera stream.')
      setCameraState('error')
      setMessage(cameraErrorMessage(error))
      if (import.meta.env.DEV) console.error('[UnifiedScanner] Camera start failed.', error)
      return
    }
    startingRef.current = true
    const session = cameraSessionRef.current + 1
    cameraSessionRef.current = session
    stopScanner(controlRef.current, videoElement)
    controlRef.current = null
    setCameraState('starting')
    setMessage('Đang khởi động camera…')
    try {
      const frameDecoder = await getCameraDecoder()
      const stream = await globalThis.navigator.mediaDevices.getUserMedia(createVideoConstraints(deviceId))
      if (!mountedRef.current || cameraSessionRef.current !== session) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      videoElement.srcObject = stream
      await videoElement.play()
      const settings = stream.getVideoTracks?.()[0]?.getSettings?.() || {}
      setCameraSettings(settings)
      debugInfo('Camera stream started.', settings)
      const dimensions = await waitForVideoDimensions(videoElement)
      debugInfo('Video dimensions.', dimensions)
      const canvasElement = frameCanvasRef.current
      if (!canvasElement) throw new Error('Không tìm thấy canvas dùng để giải mã frame camera.')
      const control = startVideoFrameScanner({
        videoElement,
        canvasElement,
        frameDecoder,
        onResult: (result) => {
          processDecoded(result.getText(), 'camera', String(result.getBarcodeFormat?.() ?? 'UNKNOWN'))
        },
        onMiss: () => {
          dedupeRef.current.markAbsent()
        },
        onError: (error) => {
          debugError('Decoder error.', error)
          if (mountedRef.current && cameraSessionRef.current === session) {
            setMessage(`Decoder gặp lỗi: ${error.name || 'Error'}: ${error.message || 'Không xác định'}`)
            stopScanner(undefined, videoElement)
            controlRef.current = null
            setCameraState('error')
          }
        },
        onStats: debugEnabled ? (stats) => {
          if (!mountedRef.current || cameraSessionRef.current !== session) return
          setScannerStats(stats)
          debugInfo('Scan loop report (5s).', stats)
        } : undefined,
      })
      debugInfo('Decoder started.')
      if (!mountedRef.current || cameraSessionRef.current !== session) {
        stopScanner(control, videoElement)
        return
      }
      controlRef.current = control
      setCameraState('ready')
      setMessage('Camera sẵn sàng. Đưa QR hoặc Barcode vào khung quét.')
      await refreshCameras(videoElement)
    } catch (error) {
      stopScanner(controlRef.current, videoElement)
      controlRef.current = null
      if (mountedRef.current && cameraSessionRef.current === session) {
        setCameraState('error')
        setMessage(cameraErrorMessage(error))
      }
      debugError('Camera/decoder start failed.', error)
    } finally {
      if (cameraSessionRef.current === session) startingRef.current = false
    }
  }

  function changeCamera(event) {
    const deviceId = event.target.value
    setSelectedDeviceId(deviceId)
    if (cameraState === 'ready') startCamera(deviceId)
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploadState('loading')
    setMessage('Đang đọc mã từ ảnh…')
    try {
      const reader = await getReader(imageReaderRef)
      const result = await decodeImageFile(reader, file)
      if (!mountedRef.current) return
      setUploadState('success')
      processDecoded(result.getText(), 'image', String(result.getBarcodeFormat?.() ?? 'UNKNOWN'))
    } catch (error) {
      if (!mountedRef.current) return
      setUploadState('error')
      setMessage(isRoutineDecodeError(error) ? 'Không tìm thấy QR/Barcode hợp lệ trong ảnh.' : `Không thể đọc ảnh: ${error?.message || 'Lỗi không xác định'}`)
      if (!isRoutineDecodeError(error)) debugError('Image decoder error.', error)
    }
  }

  async function captureDebugFrame() {
    const canvasElement = frameCanvasRef.current
    const scannerControl = controlRef.current
    scannerControl?.pause?.()
    try {
      const direct = cameraDecoderRef.current?.decodeCanvasDetailed(canvasElement)
      const blob = await captureCanvasBlob(canvasElement)
      if (debugFrameUrlRef.current) globalThis.URL.revokeObjectURL(debugFrameUrlRef.current)
      const frameUrl = globalThis.URL.createObjectURL(blob)
      debugFrameUrlRef.current = frameUrl
      setDebugFrame({ url: frameUrl, status: 'Đang so sánh canvas trực tiếp và PNG…' })
      const reader = await getReader(imageReaderRef)
      const png = await decodeImageFileDetailed(reader, blob)
      if (!mountedRef.current) return
      const directCode = direct?.result?.getText?.() || null
      const pngCode = png?.result?.getText?.() || null
      const samePixels = direct?.quality?.signature === png?.quality?.signature
        && direct?.quality?.width === png?.quality?.width
        && direct?.quality?.height === png?.quality?.height
      setDebugFrame({
        url: frameUrl,
        status: directCode || pngCode ? `Giải mã thành công: ${directCode || pngCode}` : 'Cả canvas trực tiếp và PNG đều không tìm thấy mã.',
        direct,
        png,
        samePixels,
      })
      const result = direct?.result || png?.result
      if (result) processDecoded(result.getText(), 'captured-frame', String(result.getBarcodeFormat?.() ?? 'UNKNOWN'))
    } catch (error) {
      if (!mountedRef.current) return
      const status = isRoutineDecodeError(error)
        ? 'Không tìm thấy QR/Barcode trong frame đã chụp.'
        : `Lỗi giải mã frame: ${error?.name || 'Error'}: ${error?.message || 'Không xác định'}`
      setDebugFrame((current) => ({ ...current, status }))
      if (!isRoutineDecodeError(error)) debugError('Captured frame decode error.', error)
    } finally {
      scannerControl?.resume?.()
    }
  }

  return <div className="unified-scanner">
    <div className={`camera-frame ${cameraState}`}>
      <video ref={videoRef} autoPlay muted playsInline aria-label="Camera quét mã" />
      <canvas ref={frameCanvasRef} hidden aria-hidden="true" />
      {cameraState !== 'ready' && <div className="camera-placeholder">{cameraState === 'starting' ? 'Đang khởi động camera…' : 'Camera chưa bật'}</div>}
      {cameraState === 'ready' && <div className="scan-guide" aria-hidden="true" />}
    </div>
    <div className="scanner-actions">
      {cameraState === 'ready' ? <Button variant="secondary" onClick={stopCamera}>Tắt camera</Button> : <Button onClick={() => startCamera()} disabled={cameraState === 'starting'}>{cameraState === 'starting' ? 'Đang mở…' : 'Bật camera'}</Button>}
      <span className={`scanner-message ${lookupState === 'error' || cameraState === 'error' ? 'error' : ''}`} role="status">{message}</span>
    </div>
    <div className="last-decoded" aria-live="polite"><strong>Mã vừa quét:</strong> <span>{lastDecoded || 'Chưa có'}</span></div>
    {debugEnabled && <section className="scanner-debug" aria-label="Debug camera scanner">
      <div className="scanner-debug-actions">
        <Button variant="secondary" onClick={captureDebugFrame} disabled={cameraState !== 'ready'}>Chụp frame đang quét</Button>
        {scannerStats && <span>Frames: {scannerStats.frames} · Miss: {scannerStats.misses} · Decode: {scannerStats.decoded} · {scannerStats.width}×{scannerStats.height} · {scannerStats.framesPerSecond.toFixed(1)} fps</span>}
      </div>
      {cameraSettings && <small>Camera settings: {cameraSettings.width || '?'}×{cameraSettings.height || '?'} · {cameraSettings.frameRate || '?'} fps · device {cameraSettings.deviceId || 'default'}</small>}
      {scannerStats?.frameSample && <small>Canvas sample: min {scannerStats.frameSample.minimum}, max {scannerStats.frameSample.maximum}, avg {scannerStats.frameSample.average}, signature {scannerStats.frameSample.signature}</small>}
      {scannerStats?.lastDiagnostic?.quality && <small>Decoder input: contrast {scannerStats.lastDiagnostic.quality.contrast}, sharpness {scannerStats.lastDiagnostic.quality.sharpness}, avg {scannerStats.lastDiagnostic.quality.average}, signature {scannerStats.lastDiagnostic.quality.signature} · errors {scannerStats.lastDiagnostic.errors.length}</small>}
      {debugFrame?.url && <div className="scanner-debug-frame">
        <img src={debugFrame.url} alt="Frame camera đang được decoder xử lý" />
        <span>{debugFrame.status}</span>
        {debugFrame.direct && <small>Canvas trực tiếp: {debugFrame.direct.result?.getText?.() || 'không nhận diện'} · decoder {debugFrame.direct.decoder || 'none'} · signature {debugFrame.direct.quality?.signature}</small>}
        {debugFrame.png && <small>PNG tải lại: {debugFrame.png.result?.getText?.() || 'không nhận diện'} · decoder {debugFrame.png.decoder || 'none'} · signature {debugFrame.png.quality?.signature}</small>}
        {typeof debugFrame.samePixels === 'boolean' && <small>Pixel input tương đương: {debugFrame.samePixels ? 'Có' : 'Không'}</small>}
        <a href={debugFrame.url} download="smart-warehouse-scanner-frame.png">Tải frame</a>
      </div>}
      {debugFrame && !debugFrame.url && <span>{debugFrame.status}</span>}
    </section>}
    {cameras.length > 0 && <Field label="Camera">
      <Select value={selectedDeviceId} onChange={changeCamera} disabled={cameraState === 'starting'}>
        {!selectedDeviceId && <option value="">Camera mặc định</option>}
        {cameras.map((camera, index) => <option key={camera.deviceId || `camera-${index}`} value={camera.deviceId}>{camera.label || `Camera ${index + 1}`}</option>)}
      </Select>
    </Field>}
    <Field label="Đọc QR/Barcode từ ảnh" hint="Hỗ trợ PNG, JPG và WebP.">
      <input className="image-code-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadImage} disabled={uploadState === 'loading'} />
    </Field>
    <ManualCodeInput onSubmit={(code) => processDecoded(code, 'manual')} disabled={lookupState === 'loading'} />
  </div>
}
