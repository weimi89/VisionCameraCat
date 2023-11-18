import { useEffect, useRef, useState } from "react"
import { Platform } from "react-native"
import { runAtTargetFps, useFrameProcessor } from "react-native-vision-camera"
import { useSharedValue, Worklets } from "react-native-worklets-core"
import { scanCodes } from "@mgcrea/vision-camera-barcode-scanner"
import { computeHighlights } from "../utils/highlights"

export const useBarcodeScanner = ({
  barcodeTypes,
  regionOfInterest,
  onBarcodeScanned,
  disableHighlighting,
  defaultResizeMode = "cover",
  scanMode = "continuous",
  fps = 2,
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

  // Pixel 格式在 Android 上必須是 "yuv"，在 iOS 上必須是 "native"
  const pixelFormat = Platform.OS === "android" ? "yuv" : "native"

  // 用於處理每個幀的處理器
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      runAtTargetFps(fps, () => {
        "worklet"
        const { value: layout } = layoutRef
        const { value: prevBarcodes } = barcodesRef
        const { value: resizeMode } = resizeModeRef

        const options = {}
        if (barcodeTypes !== undefined) {
          options.barcodeTypes = barcodeTypes
        }
        if (regionOfInterest !== undefined) {
          const { x, y, width, height } = regionOfInterest
          options.regionOfInterest = [x, y, width, height]
        }
        const barcodes = scanCodes(frame, options)

        if (barcodes.length > 0) {
          if (scanMode === "continuous") {
            onBarcodeScanned(barcodes, frame)
          } else if (scanMode === "once") {
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
          const { value: prevHighlights } = highlightsRef
          const highlights = computeHighlights(
            barcodes,
            frame,
            layout,
            resizeMode,
          )

          if (prevHighlights.length === 0 && highlights.length === 0) {
            return
          }
          setHighlightsJS(highlights)
        }
      })
    },
    [layoutRef, resizeModeRef, highlightsRef, disableHighlighting],
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
