import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.avalyarin.app',
  appName: 'Avalyarin',
  webDir: 'dist/public',
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#FDF8F0'
    }
  }
};

export default config;
