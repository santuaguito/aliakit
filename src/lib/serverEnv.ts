import fs from 'fs';
import path from 'path';

/**
 * Lee de forma segura variables de entorno en el servidor.
 * 1. Primero consulta process.env (estándar de Next.js y Vercel).
 * 2. Si no está en memoria (por ejemplo, si se inició el servidor antes de crear .env.local),
 *    lee directamente el archivo .env.local como respaldo seguro.
 * NUNCA se ejecuta en el navegador.
 */
export function getServerEnv(name: string): string {
  if (typeof window !== 'undefined') {
    return ''; // Seguridad absoluta: jamás ejecutar en el cliente
  }

  // 1. process.env
  if (process.env[name]) {
    return process.env[name]!.trim().replace(/^['"]|['"]$/g, '');
  }

  // 2. Respaldo desde .env.local
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const regex = new RegExp(`^${name}\\s*=\\s*([^\\r\\n]+)`, 'm');
      const match = content.match(regex);
      if (match && match[1]) {
        return match[1].trim().replace(/^['"]|['"]$/g, '');
      }
    }
  } catch {
    // Silencioso ante entornos de solo lectura
  }

  return '';
}
