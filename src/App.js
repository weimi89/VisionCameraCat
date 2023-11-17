import React, { useEffect, useState } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native'
import { Camera, useCameraDevices, useCameraFormat, useCodeScanner, useFrameProcessor } from 'react-native-vision-camera'
import { requestCameraPermission } from './utils'

export default function App() {
  const [codeTypes, setCodeTypes] = useState(['qr', 'code-128', 'code-39'])
  const [codeValue, setCodeValue] = useState('')
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
    codeTypes: codeTypes,
    onCodeScanned: (codes) => {
      if(codes[0]?.value === codeValue) return
      setCodeValue(codes[0]?.value || '') 
      console.log(JSON.stringify(codes, null, 2))
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
    <SafeAreaView style={{ flex: 1, }}>
      <StatusBar
        barStyle={'light-content'}
      />
      <View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: 250 }}>
        <Camera
          enableFpsGraph
          orientation="portrait"
          style={{ height: '100%', width: '100%' }}
          device={device}
          format={format}
          codeScanner={codeScanner}
          resizeMode="cover"
          isActive={true}
        />
        <View style={{ position: 'absolute', borderWidth: 4, borderColor: 'red', width: '80%', height: 150 }}></View>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 40, marginBottom: 20, color: 'green'}}>{codeValue}</Text>
        <TouchableOpacity onPress={() => setCodeTypes([])} style={{ backgroundColor: 'green', padding: 20, borderRadius: 10, marginBottom: 8}}>
          <Text style={{ color: 'white' }}>暫停掃描</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCodeTypes(['qr', 'code-128', 'code-39'])} style={{ backgroundColor: 'green', padding: 20, borderRadius: 10, }}>
          <Text style={{ color: 'white', }}>開始掃描</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
