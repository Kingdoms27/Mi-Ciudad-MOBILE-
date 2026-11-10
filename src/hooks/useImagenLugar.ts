import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  descartarImagenLugarFallida,
  obtenerImagenLugarGuardada,
  resolverImagenLugar,
} from '@/src/servicios/imagenes';

/**
 * Una URL pública NO se entrega directamente al <Image> nativo:
 * primero se descarga y verifica en el almacenamiento local. Esto evita
 * las pantallas amarillas de Expo ante los HTTP 403/404 de sitios externos.
 * Si no hay foto válida, la interfaz muestra su imagen local de respaldo.
 */
export function useImagenLugar(lugarId: string, urls: string | string[]) {
  const clave = useMemo(
    () => (Array.isArray(urls) ? urls : [urls])
      .filter(url => typeof url === 'string' && /^(https?:\/\/|file:\/\/)/i.test(url))
      .join('|'),
    [urls],
  );
  const candidatos = useMemo(() => clave.split('|').filter(Boolean), [clave]);
  // Asociar el resultado con el lugar y las URLs consultadas evita mostrar
  // durante un render la foto guardada de otro lugar u otra API.
  const identidad = lugarId + '|' + clave;
  const [resultado, setResultado] = useState<{ identidad: string; uri: string; listo: boolean }>({
    identidad: '', uri: '', listo: false,
  });
  const uri = resultado.identidad === identidad ? resultado.uri : '';
  const cargando = candidatos.length > 0 &&
    (resultado.identidad !== identidad || !resultado.listo);
  const [reintento, setReintento] = useState(0);
  const fallidas = useRef(new Set<string>());

  useEffect(() => {
    let activo = true;
    const opciones = candidatos.filter(url => !fallidas.current.has(url));

    // En Web dejamos la descarga al navegador; en Android/iOS se usa sólo
    // una copia local validada o el respaldo incluido en la aplicación.
    if (Platform.OS === 'web') {
      setResultado({ identidad, uri: opciones[0] ?? '', listo: true });
      return () => { activo = false; };
    }

    setResultado({ identidad, uri: '', listo: false });
    (async () => {
      const guardada = await obtenerImagenLugarGuardada(lugarId, opciones);
      if (!activo) return;
      if (guardada && !fallidas.current.has(guardada)) {
        setResultado({ identidad, uri: guardada, listo: false });
      }

      const nueva = await resolverImagenLugar(lugarId, opciones);
      if (activo && nueva && !fallidas.current.has(nueva)) {
        setResultado({ identidad, uri: nueva, listo: true });
      }
    })().catch(error => {
      if (__DEV__) {
        console.info('[Mi Ciudad] Foto no disponible; usando respaldo local', {
          lugarId,
          motivo: error instanceof Error ? error.message : String(error),
        });
      }
    }).finally(() => {
      // Tras finalizar todos los intentos, se permite mostrar el respaldo.
      if (activo) {
        setResultado(prev => prev.identidad === identidad ? { ...prev, listo: true } : prev);
      }
    });
    return () => { activo = false; };
  }, [lugarId, clave, reintento]);

  const reportarError = useCallback((motivo?: string) => {
    if (!uri || fallidas.current.has(uri)) return;
    fallidas.current.add(uri);
    setResultado({ identidad, uri: '', listo: false });
    if (__DEV__) {
      console.info('[Mi Ciudad] Foto descargada no legible; probando otra', {
        lugarId, motivo: motivo ?? 'Error de imagen', uri,
      });
    }
    // Saltar la URL original que entregó bytes no legibles y probar la
    // siguiente, en lugar de descargar el mismo archivo corrupto sin fin.
    void descartarImagenLugarFallida(lugarId, uri)
      .then(urlOriginal => {
        if (urlOriginal) fallidas.current.add(urlOriginal);
      })
      .finally(() => { setReintento(n => n + 1); });
  }, [lugarId, uri]);

  return { imagen: uri, cargando, reportarError };
}
