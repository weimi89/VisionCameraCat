import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Camera, useCameraDevices, useCameraFormat, useCodeScanner } from 'react-native-vision-camera'
import { requestCameraPermission } from './utils'

export default function App() {
  // Ask for camera permission
  const [hasPermission, setHasPermission] = useState(false)
  useEffect(() => {
    const runEffect = async () => {
      const status = await requestCameraPermission()
      setHasPermission(status === 'granted')
    }
    runEffect()
  }, [])

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'code-128', 'code-39'],
    onCodeScanned: (codes) => {
      console.log(JSON.stringify(codes))
    }
  })

  const devices = useCameraDevices()
  const device = devices.find(({ position }) => position === 'back')
  const format = useCameraFormat(device, [
    { videoResolution: { width: 1920, height: 1080 } },
  ])
  if (!device || !hasPermission) {
    return null
  }

  return (
    <View style={styles.container}>
      <Camera
        enableFpsGraph
        orientation="landscape-right"
        style={StyleSheet.absoluteFill}
        device={device}
        format={format}
        codeScanner={codeScanner}
        resizeMode="contain"
        isActive
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'gray',
    position: 'relative',
    // height: 640, // 1920 / 5
    // width: 320', // 1080 / 5
    // height: 384, // 1920 / 5
    // width: 384, // 1080 / 5
  },
})
