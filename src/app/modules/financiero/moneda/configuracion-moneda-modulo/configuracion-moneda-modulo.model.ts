import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { Moneda } from "../moneda.model";

/** Módulos que eligen su moneda (enum `ModuloMoneda` del central). PDV y FACTURACION admiten una por sucursal. */
export enum ModuloMoneda {
  COMPRAS = "COMPRAS",
  COSTOS = "COSTOS",
  PRECIOS = "PRECIOS",
  PDV = "PDV",
  FACTURACION = "FACTURACION",
}

export const MODULOS_MONEDA: { value: ModuloMoneda; label: string }[] = [
  { value: ModuloMoneda.COMPRAS, label: "COMPRAS" },
  { value: ModuloMoneda.COSTOS, label: "COSTOS" },
  { value: ModuloMoneda.PRECIOS, label: "PRECIOS" },
  { value: ModuloMoneda.PDV, label: "PDV" },
  { value: ModuloMoneda.FACTURACION, label: "FACTURACIÓN" },
];

/** Módulos cuya configuración puede ser de una sola sucursal (el central rechaza la sucursal en los demás). */
export const MODULOS_CON_SUCURSAL: ModuloMoneda[] = [ModuloMoneda.PDV, ModuloMoneda.FACTURACION];

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
  /** Solo para PDV y FACTURACION; null = toda la empresa. */
  sucursalId: number;
  monedaId: number;
  vigenteDesde: string;
}
