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
  const [uri, setUri] = useState('');
  const [reintento, setReintento] = useState(0);
  const fallidas = useRef(new Set<string>());

  useEffect(() => {
    let activo = true;
    const opciones = candidatos.filter(url => !fallidas.current.has(url));

    // En Web dejamos la descarga al navegador; en Android/iOS se usa sólo
    // una copia local validada o el respaldo incluido en la aplicación.
    if (Platform.OS === 'web') {
      setUri(opciones[0] ?? '');
      return () => { activo = false; };
    }

    setUri('');
    (async () => {
      const guardada = await obtenerImagenLugarGuardada(lugarId, opciones);
      if (!activo) return;
      if (guardada && !fallidas.current.has(guardada)) setUri(guardada);

      const nueva = await resolverImagenLugar(lugarId, opciones);
      if (activo && nueva && !fallidas.current.has(nueva)) setUri(nueva);
    })().catch(error => {
      if (__DEV__) {
        console.info('[Mi Ciudad] Foto no disponible; usando respaldo local', {
          lugarId,
          motivo: error instanceof Error ? error.message : String(error),
        });
      }
    });
    return () => { activo = false; };
  }, [lugarId, clave, reintento]);

  const reportarError = useCallback((motivo?: string) => {
    if (!uri || fallidas.current.has(uri)) return;
    fallidas.current.add(uri);
    setUri('');
    if (__DEV__) {
      console.info('[Mi Ciudad] Foto descargada no legible; probando otra', {
        lugarId, motivo: motivo ?? 'Error de imagen', uri,
      });
    }
    // Esperar la eliminación de la copia dañada antes de volver a resolver.
    void descartarImagenLugarFallida(lugarId, uri).finally(() => {
      setReintento(n => n + 1);
    });
  }, [lugarId, uri]);

  return { imagen: uri, reportarError };
}
