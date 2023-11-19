import React, { useEffect, useState } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, Dimensions } from 'react-native'
import { Camera, useCameraDevices } from 'react-native-vision-camera'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import SafeAreaView from 'react-native-safe-area-view'
import { Canvas, DiffRect, Points, Path, Skia, rrect, rect, vec } from '@shopify/react-native-skia'
import { Worklets } from 'react-native-worklets-core'

import { requestCameraPermission } from './utils'
import { useBarcodeScanner } from './hooks/useBarcodeScanner'

export default function App() {

  const [codes, setCodes] = useState([])
  const setCodesJS = Worklets.createRunInJsFn(setCodes)

  const [isCloseScanner, setIsCloseScanner] = useState(false)

  // Ask for camera permission
  const [hasPermission, setHasPermission] = useState(false)

  const devices = useCameraDevices()
  const device = devices.find(({ position }) => position === 'back')
  const { width: viewportWidth } = Dimensions.get('window')

  const { props: cameraProps, highlights } = useBarcodeScanner({
    fps: 5,
    barcodeTypes: ['qr', 'code-128', 'code-39'],
    scanMode: 'continuous',
    regionOfInterest: { x: 0, y: 0, width: viewportWidth, height: 250 },
    isScanEnabled: !isCloseScanner,
    onBarcodeScanned: (barcodes) => {
      'worklet'
      setCodesJS(barcodes)
    },
  })

  useEffect(() => {
    const runEffect = async () => {
      const status = await requestCameraPermission()
      setHasPermission(status === 'granted')
    }
    runEffect()
  }, [])

  useEffect(() => {
    console.log(
      `掃描到 ${codes.length} 個條碼，值為=${JSON.stringify(
        codes.map((barcode) => `${barcode.type}:${barcode.value}`),
      )} !`,
    )
  }, [codes])

  const calculatePath = (corners) => {
    const path = Skia.Path.Make()
    if (corners.length > 0) {
      const { x, y } = corners[0]
      path.moveTo(x, y)
      for (let i = 1; i < corners.length; i++) {
        const { x, y } = corners[i]
        path.lineTo(x, y)
      }
      path.close()
    }
    return path
  }

  if (!device || !hasPermission) {
    return null
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor="transparent"
        translucent={true}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} forceInset={{ top: 'never', bottom: 'never' }}>
        <View style={styles.container}>
          <Camera
            // enableFpsGraph
            style={{ width: '100%', height: '100%' }}
            device={device}
            isActive={true}
            {...cameraProps}
          />
          <Canvas style={styles.overlay}>
            {highlights.map(({ key, corners }) => (
              <Path
                key={key}
                path={calculatePath(corners)}
                color="rgba(255, 0, 0, 0.3)"
              />
              // <Points
              //   key={key}
              //   points={[...corners.map(({ x, y }) => vec(x, y)), vec(corners[0].x, corners[0].y)]}
              //   mode="polygon"
              //   color="red"
              //   style="stroke"
              //   strokeWidth={1}
              // />
            ))}
            <DiffRect
              inner={rrect(rect(50, 50, viewportWidth - 100, 250 - 100), 0, 0)}
              outer={rrect(rect(0, 0, viewportWidth, 250), 0, 0)}
              color="rgba(0, 0, 0, 0.2)"
            />
          </Canvas>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {/* <Text style={{ fontSize: 40, marginBottom: 20, color: 'green' }}>{codeValue}</Text> */}
          <TouchableOpacity onPress={() => setIsCloseScanner(true)} style={{ backgroundColor: 'green', padding: 20, borderRadius: 10, marginBottom: 8 }}>
            <Text style={{ color: 'white' }}>暫停掃描</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsCloseScanner(false)} style={{ backgroundColor: 'green', padding: 20, borderRadius: 10, }}>
            <Text style={{ color: 'white', }}>開始掃描</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'gray',
    height: 250,
    position: 'relative',
  },
  overlay: {
    flex: 1,
    flexDirection: 'column',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  unfocusedArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)', // 淺藍色
  },
  focusedArea: {
    flex: 2,
    flexDirection: 'row',
  },
  clearArea: {
    flex: 8,
    borderColor: 'peachpuff', // 淺粉色
    borderWidth: 2,
    // backgroundColor: 'transparent',
  },
  instructions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 32,
    backgroundColor: 'rgba(0,0,0,0.5)', // 淺藍色
  },
  instructionsText: {
    color: '#fff', // 淺粉色
    textAlign: 'center',
    fontWeight: '400',
    fontSize: 18,
  },
})