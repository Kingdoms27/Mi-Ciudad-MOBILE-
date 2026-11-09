// Configuración dinámica para mapas nativos Android.
// Conserva app.json; sólo activa react-native-maps con una clave Android real
// entregada a EAS en GOOGLE_MAPS_ANDROID_API_KEY.
// NUNCA colocar la clave o un secreto directamente en Git.
module.exports = ({ config }) => {
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
