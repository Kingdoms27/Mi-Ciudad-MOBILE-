import type { Lugar } from '@/src/tipos';
import { apiConfigurada } from '@/src/servicios/api';
// GENERADO por fotos:instalar. Archivos incluidos en el APK.
const FOTOS: Record<string, number> = {
  "costanera-gobernador-quiros": require("../../assets/lugares/costanera-gobernador-quiros.jpg"),
  "lug-001": require("../../assets/lugares/lug-001.jpg"),
  "lug-002": require("../../assets/lugares/lug-002.jpg"),
  "lug-003": require("../../assets/lugares/lug-003.jpg"),
  "lug-005": require("../../assets/lugares/lug-005.jpg"),
  "lug-008": require("../../assets/lugares/lug-008.jpg"),
  "lug-009": require("../../assets/lugares/lug-009.jpg"),
  "lug-010": require("../../assets/lugares/lug-010.jpg"),
  "lug-011": require("../../assets/lugares/lug-011.jpg"),
  "lug-013": require("../../assets/lugares/lug-013.jpg"),
  "lug-017": require("../../assets/lugares/lug-017.jpg"),
  "lug-018": require("../../assets/lugares/lug-018.jpg"),
  "lug-019": require("../../assets/lugares/lug-019.jpg"),
  "lug-020": require("../../assets/lugares/lug-020.jpg"),
  "lug-021": require("../../assets/lugares/lug-021.jpg"),
  "lug-022": require("../../assets/lugares/lug-022.jpg"),
  "lug-023": require("../../assets/lugares/lug-023.jpg"),
  "lug-024": require("../../assets/lugares/lug-024.jpg"),
  "lug-025": require("../../assets/lugares/lug-025.jpg"),
  "lug-027": require("../../assets/lugares/lug-027.jpg"),
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
