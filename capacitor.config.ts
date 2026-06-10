import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nossoamor.app',
  appName: 'Nosso Amor',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Para testar no celular (Live Reload), mantenha a linha abaixo ativa.
    // Para gerar o app final que funciona sozinho, comente a linha 'url'.
    url: 'http://192.168.0.144:5173',
    cleartext: true
  }
};

export default config;