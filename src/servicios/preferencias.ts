import { guardarUsuario } from '@/src/servicios/auth';
import { Preferencias, Usuario } from '@/src/tipos';
export async function actualizarPreferencias(usuario:Usuario,cambios:Partial<Preferencias>){const nuevo={...usuario,preferencias:{...usuario.preferencias,...cambios}};await guardarUsuario(nuevo);return nuevo;}
