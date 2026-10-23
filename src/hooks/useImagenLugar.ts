import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { obtenerImagenLugarGuardada, resolverImagenLugar } from '@/src/servicios/imagenes';

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

  const reportarError = useCallback(() => {
    setUri(actual => {
      if (actual) fallidas.current.add(actual);
      return candidatos.find(url => !fallidas.current.has(url)) ?? '';
    });
  }, [clave]);

  return { imagen: uri, reportarError };
}
