import { Platform } from "react-native"
import { normalizePrecision } from "./convert"

export const applyScaleFactor = (
  { x, y },
  source,
  target,
  resizeMode = "cover",
) => {
  "worklet"

  const ratio = {
    width: target.width / source.width,
    height: target.height / source.height,
  }

  let scaleFactor
  if (resizeMode === "contain") {
    scaleFactor = Math.min(ratio.width, ratio.height)
  } else if (resizeMode === "cover") {
    scaleFactor = Math.max(ratio.width, ratio.height)
  } else {
    throw new Error(`無效的調整模式：${resizeMode}`)
  }

  let newX = x * scaleFactor
  let newY = y * scaleFactor

  if (
    (ratio.width < ratio.height && resizeMode === "contain") ||
    (ratio.width > ratio.height && resizeMode === "cover")
  ) {
    newY += (target.height - source.height * scaleFactor) / 2
  } else {
    newX += (target.width - source.width * scaleFactor) / 2
  }

  return { x: normalizePrecision(newX), y: normalizePrecision(newY) }
}

export const applyTransformation = ({ x, y }, { width, height }, orientation) => {
  "worklet"

  if (Platform.OS === "android") {
    switch (orientation) {
      case "portrait":
        return { x: height - y, y: x }
      default:
        console.warn(`不支持的方向：${orientation}`)
        return { x, y }
    }
  } else if (Platform.OS === "ios") {
    switch (orientation) {
      case "portrait":
        return { x: height - y, y: width - x }
      case "landscape-left":
        return { x: width - x, y }
      case "landscape-right":
        return { x, y: height - y }
      case "portrait-upside-down":
        return { x: y, y: x }
      default:
        console.warn(`不支持的方向：${orientation}`)
        return { x, y }
    }
  } else {
    throw new Error(`不支持的平台：${Platform.OS}`)
  }
}
