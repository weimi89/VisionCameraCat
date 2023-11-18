import React, { useEffect, useState } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native'
import { Camera, useCameraDevices } from 'react-native-vision-camera'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import SafeAreaView from 'react-native-safe-area-view'
import { CameraHighlights } from '@mgcrea/vision-camera-barcode-scanner'

import { requestCameraPermission } from './utils'
import { useBarcodeScanner } from './hooks/useBarcodeScanner'

export default function App() {

  const [codeValue, setCodeValue] = useState('')

  const [isCloseScanner, setIsCloseScanner] = useState(false)

  // Ask for camera permission
  const [hasPermission, setHasPermission] = useState(false)

  const { props: cameraProps, highlights } = useBarcodeScanner({
    fps: 5,
    barcodeTypes: ['qr', 'code-128', 'code-39'],
    scanMode: 'continuous',
    onBarcodeScanned: (barcodes) => {
      'worklet'
      if (barcodes.length > 0) {

        // console.log(
        //   `掃描到 ${barcodes.length} 個條碼，值為=${JSON.stringify(
        //     barcodes.map((barcode) => `${barcode.type}:${barcode.value}`),
        //   )} !`,
        // )
      }
    },
  })

  const devices = useCameraDevices()
  const device = devices.find(({ position }) => position === 'back')

  useEffect(() => {
    const runEffect = async () => {
      const status = await requestCameraPermission()
      setHasPermission(status === 'granted')
    }
    runEffect()
  }, [])

  useEffect(() => {
    console.log(JSON.stringify(highlights, null, 2))
  }, [highlights])

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
          <View style={styles.overlay}>
            <View style={styles.unfocusedArea} />
            <View style={styles.focusedArea}>
              <View style={styles.unfocusedArea} />
              <View style={styles.clearArea} />
              <View style={styles.unfocusedArea} />
            </View>
            <View style={styles.unfocusedArea} />
          </View>
          <CameraHighlights highlights={highlights} color="#000" />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 40, marginBottom: 20, color: 'green' }}>{codeValue}</Text>
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