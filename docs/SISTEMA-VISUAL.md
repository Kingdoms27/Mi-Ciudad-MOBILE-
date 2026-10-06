# Sistema visual y microinteracciones

## Objetivo

La interfaz de **Mi Ciudad Colón** busca verse contemporánea sin competir con el contenido turístico. La prioridad sigue siendo legibilidad al aire libre, uso con una mano y navegación simple.

## Lenguaje visual

- Paleta inspirada en río, naturaleza y patrimonio: verdes profundos, fondos cálidos y acentos tierra.
- Superficies translúcidas tipo glass mediante `expo-blur` y fondos semitransparentes.
- Bordes suaves, radios amplios y jerarquía tipográfica fuerte.
- Barra inferior flotante para separar navegación de contenido.
- Fotografías reales de los atractivos turísticos en lugar de imágenes genéricas de stock.
- Tema claro, oscuro y sistema.

## Movimiento

- `Reveal.tsx` anima entradas con opacidad y desplazamiento vertical.
- Inicio y detalles usan desplazamientos de scroll y parallax de baja amplitud.
- Las tarjetas de lugares reducen levemente su escala al presionar.
- El escáner QR incorpora una línea de lectura animada.
- Las transiciones de Expo Router usan una animación corta y consistente.
- Los skeleton loaders usan pulsación de opacidad mientras llegan los datos.

Las animaciones son deliberadamente breves para no afectar la velocidad percibida ni distraer durante el recorrido.

## Feedback háptico

Se utiliza `expo-haptics` para reforzar acciones importantes:

- cambio de pestaña;
- cambio de filtros;
- apertura de lugares;
- guardar/quitar eventos;
- elección de lugar para una visita;
- cámara/galería;
- login y registro;
- biometría;
- validación QR;
- sincronización y guardado de visitas.

Los errores y éxitos importantes usan feedback de notificación; las selecciones simples usan feedback liviano.

## Estados

- Skeletons para carga de catálogos y listas.
- Estados vacíos con iconografía y texto orientativo.
- Errores con opción de reintento.
- Banner offline animado.
- Las visitas sin conexión muestran su estado de sincronización.

## Componentes reutilizables

- `GlassSurface.tsx`: superficies translúcidas.
- `Reveal.tsx`: entrada animada.
- `SkeletonLugar.tsx`: carga visual.
- `LugarCard.tsx`: tarjeta turística con microinteracción.
- `EstadoContenido.tsx`: vacío/error/carga.
- `NetworkBanner.tsx`: estado offline.
- `AudioGuiaPlayer.tsx`: multimedia con controles y progreso.

## Decisión de rendimiento

No se usan animaciones pesadas ni librerías adicionales de motion. La mayor parte de las transiciones utiliza `Animated` nativo y transformaciones compatibles con `useNativeDriver`. Esto mantiene el proyecto más simple de defender y reduce dependencias para el Trabajo Final Integrador.
