import { useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { runAtTargetFps, useFrameProcessor } from 'react-native-vision-camera'
import { useSharedValue, Worklets } from 'react-native-worklets-core'
import { scanCodes } from '@mgcrea/vision-camera-barcode-scanner'
import { computeBoundingBoxFromCornerPoints, applyScaleFactor, applyTransformation } from '@mgcrea/vision-camera-barcode-scanner'

const transformCornerPoints = (cornerPoints, frame, adjustedLayout, resizeMode) => {
  'worklet'
  return cornerPoints
    ? cornerPoints.map((point) =>
      applyTransformation(
        applyScaleFactor(point, frame, adjustedLayout, resizeMode),
        adjustedLayout,
        frame.orientation
      )
    )
    : []
}

export const useBarcodeScanner = ({
  barcodeTypes,
  regionOfInterest,
  onBarcodeScanned,
  disableHighlighting,
  defaultResizeMode = 'cover',
  scanMode = 'continuous',
  fps = 2,
  isScanEnabled = true,
}) => {
  const ref = useRef(null)

  // <Camera /> 元件的佈局
  const layoutRef = useSharedValue({ width: 0, height: 0 })
  const onLayout = (event) => {
    const { width, height } = event.nativeEvent.layout
    layoutRef.value = { width, height }
  }

  // 確保 resizeModeRef 有有效值
  const resizeModeRef = useSharedValue(defaultResizeMode)
  if (defaultResizeMode !== undefined) {
    resizeModeRef.value = defaultResizeMode
  }

  useEffect(() => {
    if (ref.current?.props?.resizeMode !== undefined) {
      resizeModeRef.value = ref.current.props.resizeMode
    }
  }, [resizeModeRef, ref.current?.props?.resizeMode])

  const isPristineRef = useSharedValue(true)

  // 與條碼高亮相關的狀態
  const barcodesRef = useSharedValue([])

  // 與條碼高亮相關的狀態
  const highlightsRef = useSharedValue([])
  const [highlights, setHighlights] = useState([])
  const setHighlightsJS = Worklets.createRunInJsFn(setHighlights)

  // Pixel 格式在 Android 上必須是 'yuv'，在 iOS 上必須是 'native'
  const pixelFormat = Platform.OS === 'android' ? 'yuv' : 'native'

  // 用於處理每個幀的處理器
  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet'
      runAtTargetFps(fps, () => {
        'worklet'
        const { value: layout } = layoutRef
        const { value: prevBarcodes } = barcodesRef
        const { value: resizeMode } = resizeModeRef

        /* iOS:
        * 'portrait' -> 'landscape-right'
        * 'portrait-upside-down' -> 'landscape-left'
        * 'landscape-left' -> 'portrait'
        * 'landscape-right' -> 'portrait-upside-down'
        */
        const adjustedLayout =
          ['portrait', 'portrait-upside-down'].includes(frame.orientation)
            ? {
              width: layout.height,
              height: layout.width,
            }
            : layout

        const options = {}
        if (barcodeTypes !== undefined) {
          options.barcodeTypes = barcodeTypes
        }

        const barcodes = scanCodes(frame, options).filter(({ cornerPoints }) => {

          if (!isScanEnabled) {
            return false
          }

          if (regionOfInterest === undefined) {
            return true
          }

          const { x, y, width, height } = regionOfInterest

          const translatedCornerPoints = transformCornerPoints(cornerPoints, frame, adjustedLayout, resizeMode)

          return translatedCornerPoints.every((point) =>
            point.x >= x &&
            point.x <= x + width &&
            point.y >= y &&
            point.y <= y + height
          )
        })

        if (barcodes.length > 0) {
          if (scanMode === 'continuous') {
            onBarcodeScanned(barcodes, frame)
          } else if (scanMode === 'once') {
            const hasChanged =
              prevBarcodes.length !== barcodes.length ||
              JSON.stringify(prevBarcodes.map(({ value }) => value)) !==
              JSON.stringify(barcodes.map(({ value }) => value))
            if (hasChanged) {
              onBarcodeScanned(barcodes, frame)
            }
          }
          barcodesRef.value = barcodes
        }

        if (disableHighlighting !== true && resizeMode !== undefined) {

          if (isPristineRef.value) {
            isPristineRef.value = false
            return
          }

          const highlights = barcodes.map(({ value, cornerPoints }, index) => {
            const translatedCornerPoints = transformCornerPoints(cornerPoints, frame, adjustedLayout, resizeMode)
            const valueFromCornerPoints = computeBoundingBoxFromCornerPoints(translatedCornerPoints)
            return {
              key: `${value}.${index}`,
              corners: translatedCornerPoints,
              ...valueFromCornerPoints,
            }
          })

          setHighlightsJS(highlights)
        }
      })
    },
    [layoutRef, resizeModeRef, highlightsRef, disableHighlighting, isScanEnabled, isScanEnabled],
  )

  return {
    props: {
      pixelFormat,
      frameProcessor,
      onLayout,
      ref,
      resizeMode: defaultResizeMode,
    },
    highlights,
    ref,
  }
}
