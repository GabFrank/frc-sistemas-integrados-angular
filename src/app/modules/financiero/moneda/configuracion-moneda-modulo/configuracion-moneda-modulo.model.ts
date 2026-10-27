import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { Moneda } from "../moneda.model";

/** Módulos que eligen su moneda (enum `ModuloMoneda` del central). Solo PDV admite una por sucursal. */
export enum ModuloMoneda {
  COMPRAS = "COMPRAS",
  COSTOS = "COSTOS",
  PRECIOS = "PRECIOS",
  PDV = "PDV",
}

export const MODULOS_MONEDA: { value: ModuloMoneda; label: string }[] = [
  { value: ModuloMoneda.COMPRAS, label: "COMPRAS" },
  { value: ModuloMoneda.COSTOS, label: "COSTOS" },
  { value: ModuloMoneda.PRECIOS, label: "PRECIOS" },
  { value: ModuloMoneda.PDV, label: "PDV" },
];

/**
 * Desde `vigenteDesde`, el módulo usa la moneda. Las filas no se editan: cada cambio es una fila
 * nueva, y desactivar la vigente vuelve el módulo a la anterior activa de la misma clave.
 */
export class ConfiguracionMonedaModulo {
  id: number;
  modulo: ModuloMoneda;
  /** null = toda la empresa. */
  sucursal: Sucursal;
  moneda: Moneda;
  vigenteDesde: Date;
  activo: boolean;
  usuarioNickname: string;
  creadoEn: Date;
}

/** Siempre crea una fila nueva. `vigenteDesde` en "yyyy-MM-dd HH:mm"; null = ahora. */
export class ConfiguracionMonedaModuloInput {
  modulo: ModuloMoneda;
  /** Solo para PDV; null = toda la empresa. */
  sucursalId: number;
  monedaId: number;
  vigenteDesde: string;
}
