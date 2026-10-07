/**
 * Tipos y constantes de los genéricos que otros archivos leen al cargarse (`const X = { timeoutMs: ... }`
 * a nivel de módulo).
 *
 * Viven acá, y no en `generic-crud.service.ts`, porque ese servicio está dentro de un ciclo de imports
 * (`generic-crud.service` → `main.service` → … → los servicios que lo usan): el bundle de producción
 * evaluaba a esos servicios antes que a las constantes y la app quedaba en blanco al arrancar con
 * `Cannot access '…' before initialization`.
 *
 * Este archivo no puede importar nada de la app en tiempo de ejecución: solo `import type`.
 */
import type { NotificacionColor } from "../notificacion-snackbar.service";

export interface QueryError {
  graphError?: {
    show?: boolean;
    color?: NotificacionColor;
    propagate?: boolean;
  };
  networkError?: {
    show?: boolean;
    color?: NotificacionColor;
    propagate?: boolean;
  };
}

/** Contexto de onCustomQuery: timeout propio y si el link avisa al vencer. */
export interface ContextoConsulta {
  timeoutMs?: number;
  silenciarAvisoTimeout?: boolean;
}

/** Tiempo máximo de una consulta de fondo (poll del header): nadie la está esperando. */
export const TIMEOUT_CONSULTA_DE_FONDO_MS = 20000;
/** Lo que espera un cajero de pie (escanear, elegir un lote) antes de que se le diga algo (#390). */
export const TIMEOUT_CONSULTA_MOSTRADOR_MS = 10000;
/**
 * Para quien maneja el error de red con su propio `error:`: sin esto onCustomQuery no emite nada si
 * el servidor no responde, y el que llama queda esperando para siempre. Solo red: un error GraphQL
 * sigue llegando como `null` (#390).
 */
export const PROPAGAR_ERROR_DE_RED: QueryError = { networkError: { propagate: true, show: false } };
/**
 * Para una lectura de la que depende una decisión: el error del servidor y el de red llegan los dos al
 * `error:` de quien llama (nunca un `null` que se confunda con «no existe»), sin aviso del genérico (#390).
 */
export const LECTURA_ESTRICTA: QueryError = {
  graphError: { show: false, propagate: true },
  networkError: { show: false, propagate: true },
};
/** Corte de mostrador para {@link LECTURA_ESTRICTA}: el aviso lo da quien llama. */
export const CONTEXTO_MOSTRADOR: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_MOSTRADOR_MS, silenciarAvisoTimeout: true };
/** Para quien ya avisa por su cuenta cuando onGetAll le devuelve `null`: sin aviso del genérico. */
export const SIN_AVISO_DEL_GENERICO: QueryError = { graphError: { show: false }, networkError: { show: false } };
