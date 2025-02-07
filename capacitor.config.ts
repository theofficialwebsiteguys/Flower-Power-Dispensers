import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.flowerpowerdispensers.application',
  appName: 'Flower Power Dispensers',
  webDir: 'www',
  server: {
    hostname: "com.flowerpowerdispensers.app",
    androidScheme: "https",
    allowNavigation: ["pay.aero.inc"]
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 0, // Disables Capacitor's default splash screen to use custom Angular component
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    FirebaseMessaging: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  },
};

export default config;
