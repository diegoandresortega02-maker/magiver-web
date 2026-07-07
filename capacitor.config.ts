import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.magiver.app',
  appName: 'MAGIVER',
  webDir: 'dist',
  // Sin server.url: el build se empaqueta dentro del APK (funciona offline,
  // no es solo un WebView apuntando a la web en vivo).
};

export default config;
