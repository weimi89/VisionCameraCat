import { NativeEventEmitter, NativeModules, Platform } from "react-native"
import { VisionCameraProxy } from "react-native-vision-camera"
import { normalizeNativeBarcode } from "./utils/convert"

const LINKING_ERROR =
  `套件 'vision-camera-code-scanner' 似乎未連結。請確保：\n\n` +
  Platform.select({ ios: "- 你已執行 'pod install'\n", default: "" }) +
  "- 安裝套件後重新構建應用程式\n" +
  "- 未使用 Expo Go\n"

export const VisionCameraCodeScanner = NativeModules.VisionCameraCodeScanner
  ? NativeModules.VisionCameraCodeScanner
  : new Proxy(
    {},
    {
      get() {
        throw new Error(LINKING_ERROR)
      },
    },
  )

const { MODULE_NAME, BARCODE_TYPES, BARCODE_FORMATS } =
  VisionCameraCodeScanner.getConstants()

export { BARCODE_FORMATS, BARCODE_TYPES }

const visionCameraEventEmitter = new NativeEventEmitter(
  VisionCameraCodeScanner,
)

export const onBarcodeDetected = (callback) => {
  visionCameraEventEmitter.addListener("onBarcodeDetected", (nativeBarcode) => {
    callback(nativeBarcode)
  })
}

const visionCameraProcessorPlugin = VisionCameraProxy.initFrameProcessorPlugin(
  MODULE_NAME,
)

export const scanCodes = (frame, options) => {
  "worklet"
  if (visionCameraProcessorPlugin == null) {
    throw new Error(`無法載入 Frame Processor 插件 "${MODULE_NAME}"!`)
  }
  const nativeCodes = visionCameraProcessorPlugin.call(
    frame,
    options,
  )
  if (!Array.isArray(nativeCodes)) {
    console.warn("本地框架處理器未能返回正確的數組！")
    return []
  }
  return nativeCodes.map((nativeBarcode) =>
    normalizeNativeBarcode(nativeBarcode, frame),
  )
}
