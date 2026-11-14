// Configuración dinámica para mapas nativos Android.
// Conserva app.json; sólo activa react-native-maps con una clave Android real
// entregada a EAS en GOOGLE_MAPS_ANDROID_API_KEY.
// NUNCA colocar la clave o un secreto directamente en Git.
module.exports = ({ config }) => {
  // EAS inyecta EXPO_PUBLIC_API_URL desde el entorno del perfil preview.
  // Sin ella la app usa 10 lugares mock, aunque haya 26 fotos empaquetadas.
  // Impedir que una nueva APK de entrega se compile accidentalmente asi.
  if (process.env.EAS_BUILD_PROFILE === 'preview') {
    const api = (process.env.EXPO_PUBLIC_API_URL ?? '').trim();
    let urlValida = false;
    try {
      const url = new URL(api);
      urlValida = url.protocol === 'https:' &&
        !['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname) &&
        !/^(10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(url.hostname);
    } catch {}
    if (!urlValida) {
      throw new Error(
        '[MI CIUDAD] APK preview bloqueada: falta EXPO_PUBLIC_API_URL HTTPS publica ' +
        'en EAS preview. Sin ella solo se muestran los 10 lugares mock. ' +
        'Verifica con eas env:list --environment preview y configura la URL real.'
      );
    }
  }
  const androidKey = (process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? '').trim();
  return {
    ...config,
    plugins: androidKey
      ? [
          ...(config.plugins ?? []),
          ['react-native-maps', { androidGoogleMapsApiKey: androidKey }],
        ]
      : (config.plugins ?? []),
    extra: {
      ...(config.extra ?? {}),
      androidNativeMapsEnabled: Boolean(androidKey),
    },
  };
};
