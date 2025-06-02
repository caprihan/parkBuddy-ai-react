import "dotenv/config";

export default {
  "expo": {
    "name": "ParkBuddyAI",
    "slug": "ParkBuddyAI",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.gauravcaprihan.parkbuddyai"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.gauravcaprihan.parkbuddyai"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ],
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.446588187248-60j0laehq7dvuu37vudb4i3ph00ug0hu"
        }
      ],
      "expo-secure-store"
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "eas": {
        "projectId": "b9a64d0f-bf99-4db8-ae29-028cf9c288eb"
      },
        webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
        mcpClientURL: process.env.EXPO_PUBLIC_MCP_CLIENT_URL,
        mobileClientUsername: process.env.EXPO_PUBLIC_MOBILE_CLIENT_USERNAME,
        mobileClientPassword: process.env.EXPO_PUBLIC_MOBILE_CLIENT_PASSWORD,
      }
    }
  }