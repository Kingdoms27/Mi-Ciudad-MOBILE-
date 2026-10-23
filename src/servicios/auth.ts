import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import Storage from 'expo-sqlite/kv-store';
import { RespuestaApi, Sesion, Usuario } from '@/src/tipos';
import { usuarioMock } from '@/src/mocks/usuario';
import { apiConfigurada, apiGet, apiPost } from '@/src/servicios/api';
import { normalizarUsuario } from '@/src/servicios/normalizacion';

const TOKEN_KEY = 'mi-ciudad.token';
const USER_KEY = 'mi-ciudad:usuario';
const DEMO_EMAIL = usuarioMock.email.toLowerCase();
const DEMO_PASSWORD = 'lucia1234';
const esperar = (ms = 250) => new Promise(r => setTimeout(r, ms));

const normalizar = (usuario: Usuario): Usuario => ({
  ...usuario,
  preferencias: { ...usuario.preferencias, categoriasFavoritas: [...usuario.preferencias.categoriasFavoritas] },
});

function emailNormalizado(email: string) {
  return email.trim().toLowerCase();
}

function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashEmail(email: string) {
  let hash = 2166136261;
  for (let i = 0; i < email.length; i++) {
    hash ^= email.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function perfilKey(email: string) {
  return `mi-ciudad:perfil:${hashEmail(emailNormalizado(email))}`;
}

function credencialKey(email: string) {
  return `mi-ciudad.cred.${hashEmail(emailNormalizado(email))}`;
}

async function guardarPerfil(usuario: Usuario) {
  const valor = JSON.stringify(usuario);
  await Storage.setItem(perfilKey(usuario.email), valor);
  await Storage.setItem(USER_KEY, valor);
}

export async function registro(nombre: string, email: string, password: string): Promise<RespuestaApi<Sesion>> {
  if (apiConfigurada()) {
    const respuesta = await apiPost<Sesion>('/auth/registro', {
      nombre: nombre.trim(),
      email: emailNormalizado(email),
      contrasena: password,
    });
    if ('error' in respuesta) return respuesta;
    const sesion = { ...respuesta.datos, usuario: normalizarUsuario(respuesta.datos.usuario) };
    await guardarPerfil(sesion.usuario);
    await SecureStore.setItemAsync(TOKEN_KEY, sesion.token);
    return { datos: sesion };
  }
  await esperar();
  const nombreLimpio = nombre.trim();
  const emailLimpio = emailNormalizado(email);

  if (nombreLimpio.length < 2) return { error: { codigo: 'NOMBRE_INVALIDO', mensaje: 'Ingresá tu nombre.' } };
  if (!emailValido(emailLimpio)) return { error: { codigo: 'EMAIL_INVALIDO', mensaje: 'Ingresá un email válido.' } };
  if (password.length < 8) return { error: { codigo: 'PASSWORD_CORTA', mensaje: 'La contraseña debe tener al menos 8 caracteres.' } };
  if (emailLimpio === DEMO_EMAIL) {
    return { error: { codigo: 'EMAIL_RESERVADO', mensaje: 'Ese correo es la cuenta de demostración. Usá otro email para registrarte.' } };
  }

  const [perfilExistente, credencialExistente] = await Promise.all([
    Storage.getItem(perfilKey(emailLimpio)),
    SecureStore.getItemAsync(credencialKey(emailLimpio)),
  ]);
  if (perfilExistente || credencialExistente) {
    return { error: { codigo: 'EMAIL_EN_USO', mensaje: 'Ya existe una cuenta local con ese correo. Ingresá con tu contraseña.' } };
  }

  const usuario: Usuario = {
    ...normalizar(usuarioMock),
    id: `usr-${Date.now()}`,
    nombre: nombreLimpio,
    email: emailLimpio,
    creadoEn: new Date().toISOString(),
  };
  const token = `mock.${usuario.id}.${Date.now()}`;
  await SecureStore.setItemAsync(credencialKey(emailLimpio), password);
  await guardarPerfil(usuario);
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  return { datos: { token, usuario } };
}

export async function ingreso(email: string, password: string): Promise<RespuestaApi<Sesion>> {
  if (apiConfigurada()) {
    const respuesta = await apiPost<Sesion>('/auth/ingreso', {
      email: emailNormalizado(email),
      contrasena: password,
    });
    if ('error' in respuesta) return respuesta;
    const sesion = { ...respuesta.datos, usuario: normalizarUsuario(respuesta.datos.usuario) };
    await guardarPerfil(sesion.usuario);
    await SecureStore.setItemAsync(TOKEN_KEY, sesion.token);
    return { datos: sesion };
  }
  await esperar();
  const emailLimpio = emailNormalizado(email);
  if (!emailValido(emailLimpio) || password.length < 6) {
    return { error: { codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'Email o contraseña inválidos.' } };
  }

  let usuario: Usuario | null = null;
  if (emailLimpio === DEMO_EMAIL) {
    if (password !== DEMO_PASSWORD) {
      return { error: { codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'La cuenta de demostración usa la contraseña indicada en el README.' } };
    }
    const [perfil, actual] = await Promise.all([
      Storage.getItem(perfilKey(emailLimpio)),
      Storage.getItem(USER_KEY),
    ]);
    const guardado = perfil ?? actual;
    if (guardado) {
      try {
        const candidato = JSON.parse(guardado) as Usuario;
        if (emailNormalizado(candidato.email) === emailLimpio) usuario = candidato;
      } catch {
        usuario = null;
      }
    }
    usuario ??= { ...normalizar(usuarioMock), email: emailLimpio };
  } else {
    const [claveGuardada, perfil] = await Promise.all([
      SecureStore.getItemAsync(credencialKey(emailLimpio)),
      Storage.getItem(perfilKey(emailLimpio)),
    ]);
    if (!claveGuardada || claveGuardada !== password || !perfil) {
      return { error: { codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'No hay una cuenta local con ese correo y contraseña.' } };
    }
    try {
      usuario = JSON.parse(perfil) as Usuario;
    } catch {
      return { error: { codigo: 'PERFIL_INVALIDO', mensaje: 'No se pudo recuperar el perfil local. Registrá la cuenta nuevamente.' } };
    }
  }

  if (!usuario) return { error: { codigo: 'PERFIL_INVALIDO', mensaje: 'No se pudo recuperar el perfil local.' } };
  const token = `mock.${usuario.id}.${Date.now()}`;
  await guardarPerfil(usuario);
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  return { datos: { token, usuario } };
}

export async function cerrarSesion() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function obtenerSesionGuardada(): Promise<Sesion | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) return null;
  if (apiConfigurada() && token.startsWith('mock.')) {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    return null;
  }
  if (apiConfigurada()) {
    const respuesta = await apiGet<Usuario>('/yo');
    if ('datos' in respuesta) {
      const usuario = normalizarUsuario(respuesta.datos);
      await guardarPerfil(usuario);
      return { token, usuario };
    }
    if (respuesta.error.codigo === 'NO_AUTENTICADO' || respuesta.error.codigo === 'HTTP_401') {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      return null;
    }
  }
  const raw = await Storage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const usuario = JSON.parse(raw) as Usuario;
    if (!apiConfigurada() && !token.startsWith('mock.')) return null;
    return { token, usuario };
  } catch {
    return null;
  }
}

export async function guardarUsuario(usuario: Usuario) {
  await guardarPerfil(usuario);
}

export async function biometriaDisponible() {
  const [hardware, registrada] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hardware && registrada;
}

export async function autenticarBiometria() {
  if (!(await biometriaDisponible())) {
    return { ok: false, mensaje: 'Este dispositivo no tiene biometría disponible o configurada.' };
  }
  const resultado = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Ingresar a Mi Ciudad',
    cancelLabel: 'Cancelar',
    fallbackLabel: 'Usar código del dispositivo',
  });
  return {
    ok: resultado.success,
    mensaje: resultado.success ? 'Acceso confirmado' : 'No se pudo validar la identidad',
  };
}
