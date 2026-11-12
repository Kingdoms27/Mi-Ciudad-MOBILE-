import type { Lugar } from '@/src/tipos';
import { apiConfigurada } from '@/src/servicios/api';
// GENERADO por fotos:instalar. Archivos incluidos en el APK.
const FOTOS: Record<string, number> = {
  "costanera-gobernador-quiros": require("../../assets/lugares/costanera-gobernador-quiros.jpg"),
  "lug-001": require("../../assets/lugares/lug-001.jpg"),
  "lug-008": require("../../assets/lugares/lug-008.jpg"),
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
  return FOTOS[slug(lugar.nombre)] ?? (apiConfigurada() ? FOTOS[lugar.id] : undefined);
}
