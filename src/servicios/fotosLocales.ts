import type { Lugar } from '@/src/tipos';
import { apiConfigurada } from '@/src/servicios/api';
// GENERADO por fotos:instalar. Archivos incluidos en el APK.
const FOTOS: Record<string, number> = {
  "costanera-gobernador-quiros": require("../../assets/lugares/costanera-gobernador-quiros.jpg"),
  "mirador-del-puente-general-artigas": require("../../assets/lugares/mirador-del-puente-general-artigas.jpg"),
  "molino-forclaz": require("../../assets/lugares/molino-forclaz.jpg"),
  "palacio-san-jose": require("../../assets/lugares/palacio-san-jose.jpg"),
  "parque-dr-herminio-j-quiros": require("../../assets/lugares/parque-dr-herminio-j-quiros.jpg"),
  "parque-nacional-el-palmar": require("../../assets/lugares/parque-nacional-el-palmar.jpg"),
  "puerto-viejo": require("../../assets/lugares/puerto-viejo.jpg"),
};
function slug(nombre: string): string {
  return nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
export function fotoLocalParaLugar(lugar: Lugar): number | undefined {
  const nombre = slug(lugar.nombre);
  const restricciones: Record<string,string[]> = {
    'lug-001':['termas','colon'],
    'lug-002':['playa','norte'],
    'lug-007':['puerto','viejo'],
    'lug-008':['iglesia','plaza','san','martin'],
  };
  const permitida = !restricciones[lugar.id] || restricciones[lugar.id].every(p => nombre.includes(p));
  // En catálogo real priorizamos archivo por ID para reemplazar vistas
  // referenciales anteriores; con mocks usamos únicamente nombres.
  return (apiConfigurada() && permitida ? FOTOS[lugar.id] : undefined) ?? FOTOS[nombre];
}
