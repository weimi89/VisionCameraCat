import { Alert, PermissionsAndroid, Platform } from 'react-native'
import { Camera } from 'react-native-vision-camera'

const APP_NAME = '我的應用'

export const requestCameraPermission = async () => {
  const cameraPermission = await Camera.getCameraPermissionStatus()
  console.log({ cameraPermission })
  if (Platform.OS === 'android') {
    return await requestAndroidCameraPermission()
  }
  if (cameraPermission === 'not-determined') {
    const newCameraPermission = await Camera.requestCameraPermission()
    if (newCameraPermission !== 'granted') {
      Alert.alert('請前往設置中啟用它！')
    }
    return newCameraPermission
  }
  return cameraPermission
}

export const requestAndroidCameraPermission = async () => {
  try {
    const checkResult = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.CAMERA
    )
    if (checkResult) {
      console.log('相機權限已經授予')
      return PermissionsAndroid.RESULTS.GRANTED
    }
    const requestResult = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: `${APP_NAME} 相機權限`,
        message: `${APP_NAME} 需要訪問您的相機以掃描條形碼。`,
        buttonNeutral: '以後再問',
        buttonNegative: '取消',
        buttonPositive: '好的',
      }
    )
    if (requestResult === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('相機權限已經授予')
    } else {
      console.log('相機權限已被拒絕')
    }
    return requestResult
  } catch (err) {
    console.warn(err)
    return PermissionsAndroid.RESULTS.DENIED
  }
}
