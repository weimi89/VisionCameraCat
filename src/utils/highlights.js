import { computeBoundingBoxFromCornerPoints, applyScaleFactor, applyTransformation } from "@mgcrea/vision-camera-barcode-scanner"

export const computeHighlights = (
  barcodes,
  frame,
  layout,
  resizeMode = "cover",
) => {
  "worklet"

  // 如果佈局尚未知曉，我們無法計算高亮
  if (layout.width === 0 || layout.height === 0) {
    console.warn(`遇到空佈局：${JSON.stringify(layout)}`)
    return []
  }

  /* iOS:
   * "portrait" -> "landscape-right"
   * "portrait-upside-down" -> "landscape-left"
   * "landscape-left" -> "portrait"
   * "landscape-right" -> "portrait-upside-down"
   */
  const adjustedLayout =
    ["portrait", "portrait-upside-down"].includes(frame.orientation)
      ? {
        width: layout.height,
        height: layout.width,
      }
      : layout

  const highlights = barcodes.map(({ value, cornerPoints }, index) => {
    let translatedCornerPoints = cornerPoints

    translatedCornerPoints = translatedCornerPoints
      ? translatedCornerPoints.map((point) =>
        applyScaleFactor(point, frame, adjustedLayout, resizeMode)
      )
      : []

    translatedCornerPoints = translatedCornerPoints
      ? translatedCornerPoints.map((point) =>
        applyTransformation(point, adjustedLayout, frame.orientation)
      )
      : []

    const valueFromCornerPoints = computeBoundingBoxFromCornerPoints(
      translatedCornerPoints
    )

    return {
      key: `${value}.${index}`,
      corners: translatedCornerPoints,
      ...valueFromCornerPoints,
    }
  })

  // console.log(JSON.stringify(highlights, null, 2))
  return highlights
}
