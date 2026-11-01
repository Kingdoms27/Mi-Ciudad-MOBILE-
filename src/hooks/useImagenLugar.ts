import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { descartarImagenLugarFallida, obtenerImagenLugarGuardada, resolverImagenLugar } from '@/src/servicios/imagenes';

/**
 * Si una URL falla en React Native, reintenta con la siguiente fotografía
 * y, si ninguna funciona, expone uri='' para mostrar el respaldo visual.
 */
export function useImagenLugar(lugarId: string, urls: string | string[]) {
  const clave = useMemo(
    () => (Array.isArray(urls) ? urls : [urls])
      .filter(url => typeof url === 'string' && /^(https?:\/\/|file:\/\/)/i.test(url))
      .join('|'),
    [urls],
  );
  const candidatos = useMemo(() => clave.split('|').filter(Boolean), [clave]);
  const [uri, setUri] = useState(candidatos[0] ?? '');
  const fallidas = useRef(new Set<string>());

  useEffect(() => {
    let activo = true;
    fallidas.current.clear();
    setUri(candidatos[0] ?? '');

    (async () => {
      const local = await obtenerImagenLugarGuardada(lugarId, candidatos);
      if (activo && local && !fallidas.current.has(local)) setUri(local);

      const resuelta = await resolverImagenLugar(lugarId, candidatos);
      if (!activo) return;
      if (resuelta && !fallidas.current.has(resuelta)) {
        setUri(resuelta);
      } else {
        setUri(actual =>
          actual && !fallidas.current.has(actual)
            ? actual
            : candidatos.find(url => !fallidas.current.has(url)) ?? '',
        );
      }
    })().catch(() => {
      if (activo) setUri(actual => actual && !fallidas.current.has(actual) ? actual : '');
    });

    return () => { activo = false; };
  }, [lugarId, clave]);

  const reportarError = useCallback((motivo?: string) => {
    if (!uri || fallidas.current.has(uri)) return;
    fallidas.current.add(uri);
    // No ejecutar efectos secundarios dentro de un actualizador de setState:
    // React puede repetir el callback durante la renderización.
    void descartarImagenLugarFallida(lugarId, uri);
    if (__DEV__) {
      console.info('[Mi Ciudad] Falló foto externa; se intenta alternativa', {
        lugarId, url: uri, motivo: motivo ?? 'Error de imagen nativa',
      });
    }
    setUri(candidatos.find(url => !fallidas.current.has(url)) ?? '');
  }, [clave, lugarId, uri]);

  return { imagen: uri, reportarError };
}
