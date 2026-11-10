/**
 * Importador optativo para una copia LOCAL de la API oficial de Mi Ciudad.
 * Copiar a api-mi-ciudad/src/tools/importar-fotos-lugares.ts.
 * Se ejecuta en simulacion salvo que se indique expresamente --aplicar.
 * No elimina medios anteriores, no cambia otras columnas y no reinicia semillas.
 */
import '../config/load-env.js';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module.js';
import { AlmacenArchivos } from '../common/files/file-storage.js';
import { nuevaClave } from '../common/files/keys.js';
import { detectarTipoArchivo, LIMITES_BYTES } from '../common/files/signatures.js';
import { ENTORNO } from '../config/environment.module.js';
import type { Entorno } from '../config/environment.js';
import { LugarEntidad } from '../modules/places/place.entity.js';

type Formato = NonNullable<ReturnType<typeof detectarTipoArchivo>>;
type Foto = { archivo: string; orden: number; bytes: Buffer; formato: Formato };
const args = process.argv.slice(2);
const aplicar = args.includes('--aplicar');
const carpetas = args.filter(arg => !arg.startsWith('--'));
const inesperados = args.filter(arg => arg.startsWith('--') && arg !== '--aplicar');
const nombreFoto = /^(lug-\d{3})(?:-(\d{1,2}))?\.(jpe?g|png|webp)$/i;

async function preparar(ruta: string): Promise<Map<string, Foto[]>> {
  const entradas = (await readdir(ruta, { withFileTypes: true }))
    .filter(item => item.isFile() && !item.name.startsWith('.'));
  if (!entradas.length) throw new Error('No hay fotos en la carpeta. La simulacion no puede continuar.');
  const grupos = new Map<string, Foto[]>();
  const huellas = new Map<string, string>();
  for (const entrada of entradas) {
    const m = nombreFoto.exec(entrada.name);
    if (!m) throw new Error('Nombre invalido: ' + entrada.name + '. Formato: lug-004.jpg');
    const id = m[1].toLowerCase();
    const orden = m[2] ? Number(m[2]) : 1;
    if (orden < 1) throw new Error('Orden invalido: ' + entrada.name);
    const archivo = join(ruta, entrada.name);
    const info = await stat(archivo);
    if (!info.size || info.size > LIMITES_BYTES.imagen) {
      throw new Error('Tamano no admitido: ' + entrada.name);
    }
    const bytes = await readFile(archivo);
    const formato = detectarTipoArchivo(bytes);
    if (!formato || formato.tipo !== 'imagen') {
      throw new Error('La foto no tiene una firma JPEG/PNG/WebP valida: ' + entrada.name);
    }
    const extension = m[3].toLowerCase();
    if (extension !== formato.extension && !(extension === 'jpeg' && formato.extension === 'jpg')) {
      throw new Error('La extension no coincide con el contenido: ' + entrada.name);
    }
    const sha = createHash('sha256').update(bytes).digest('hex');
    const anterior = huellas.get(sha);
    if (anterior && anterior !== id) {
      throw new Error('Una foto se asigna a dos lugares: ' + anterior + ' y ' + id);
    }
    huellas.set(sha, id);
    const fotos = grupos.get(id) ?? [];
    if (fotos.some(f => f.orden === orden)) throw new Error('Orden duplicado en ' + id);
    fotos.push({ archivo: entrada.name, orden, bytes, formato });
    grupos.set(id, fotos);
  }
  for (const fotos of grupos.values()) fotos.sort((a, b) => a.orden - b.orden);
  return grupos;
}

async function main(): Promise<void> {
  if (carpetas.length !== 1 || inesperados.length) {
    throw new Error('Uso: node dist/src/tools/importar-fotos-lugares.js RUTA_FOTOS [--aplicar]');
  }
  const grupos = await preparar(resolve(carpetas[0]));
  const app = await NestFactory.createApplicationContext(
    AppModule.registrar({ DB_SINCRONIZAR: 'false', SEMBRAR_SI_VACIA: 'false' }),
    { logger: ['error', 'warn'] },
  );
  try {
    const config = app.get<Entorno>(ENTORNO);
    if (aplicar && (config.ENTORNO !== 'desarrollo' || config.DB_MOTOR !== 'better-sqlite3'
        || config.ARCHIVOS_PROVEEDOR !== 'local')) {
      throw new Error('Aplicacion permitida solo en desarrollo con SQLite y archivos locales.');
    }
    const db = app.get(DataSource);
    const almacen = app.get(AlmacenArchivos);
    const repo = db.getRepository(LugarEntidad);
    const plan: { id: string; nombre: string; fotos: Foto[] }[] = [];
    for (const [id, fotos] of grupos) {
      const lugar = await repo.findOneBy({ id });
      if (!lugar || !lugar.activo) throw new Error('Lugar inexistente o inactivo: ' + id);
      if (lugar.imagenes.some(clave => !/^imagenes\/\d{4}\/\d{2}\/semilla-/.test(clave))) {
        throw new Error('El lugar ya tiene fotos personalizadas: ' + id + '. No se sobrescriben.');
      }
      plan.push({ id, nombre: lugar.nombre, fotos });
    }
    console.log(aplicar ? 'MODO APLICAR' : 'MODO SIMULACION (NO MODIFICA LA API)');
    for (const p of plan) {
      console.log('[' + p.id + '] ' + p.nombre + ': ' + p.fotos.map(f => f.archivo).join(', '));
    }
    if (!aplicar) {
      console.log('Sin cambios. Para aplicar: detener la API, respaldar base y archivos y usar --aplicar.');
      return;
    }
    // Almacenar bajo nuevas claves. Las imagenes PNG compartidas no se tocan.
    const cambios: { id: string; imagenes: string[] }[] = [];
    for (const p of plan) {
      const claves: string[] = [];
      for (const foto of p.fotos) {
        const clave = nuevaClave(foto.formato, new Date());
        await almacen.guardar(clave, foto.bytes, foto.formato.mime);
        claves.push(clave);
      }
      cambios.push({ id: p.id, imagenes: claves });
    }
    await db.transaction(async manager => {
      const lugares = manager.getRepository(LugarEntidad);
      for (const cambio of cambios) {
        const actualizado = await lugares.update(
          { id: cambio.id },
          { imagenes: cambio.imagenes, actualizadoEn: new Date() },
        );
        if (actualizado.affected !== 1) throw new Error('No se actualizo ' + cambio.id);
      }
    });
    console.log('[OK] Actualizados ' + cambios.length + ' lugares sin borrar imagenes anteriores.');
  } finally {
    await app.close();
  }
}

main().catch(error => {
  console.error('[ERROR] ' + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
});
