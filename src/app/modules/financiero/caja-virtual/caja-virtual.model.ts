import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Funcionario } from "../../personas/funcionarios/funcionario.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Moneda } from "../moneda/moneda.model";
import { CuentaBancaria } from "../cuenta-bancaria/cuenta-bancaria.model";

export enum CajaVirtualTipo {
  CAJA_MAYOR = 'CAJA_MAYOR',
  CAJA_CHICA = 'CAJA_CHICA'
}

export enum CajaVirtualTipoMovimiento {
  INGRESO = 'INGRESO',
  EGRESO = 'EGRESO',
  TRANSFERENCIA_ENTRADA = 'TRANSFERENCIA_ENTRADA',
  TRANSFERENCIA_SALIDA = 'TRANSFERENCIA_SALIDA',
  PAGO_PROVEEDOR = 'PAGO_PROVEEDOR',
  AJUSTE = 'AJUSTE'
}

export class CajaVirtual {
  id: number;
  nombre: string;
  tipo: CajaVirtualTipo;
  sucursal: Sucursal;
  responsable: Funcionario;
  usuario: Usuario;
  saldoGs: number;
  saldoRs: number;
  saldoDs: number;
  limiteGs: number;
  descripcion: string;
  activo: boolean;
  creadoEn: Date;

  toInput(): CajaVirtualInput {
    let input = new CajaVirtualInput();
    input.id = this?.id;
    input.nombre = this?.nombre;
    input.tipo = this?.tipo;
    input.sucursalId = this?.sucursal?.id;
    input.responsableId = this?.responsable?.id;
    input.usuarioId = this?.usuario?.id;
    input.saldoGs = this?.saldoGs;
    input.saldoRs = this?.saldoRs;
    input.saldoDs = this?.saldoDs;
    input.limiteGs = this?.limiteGs;
    input.descripcion = this?.descripcion;
    input.activo = this?.activo;
    return input;
  }
}

export class CajaVirtualInput {
  id?: number;
  nombre?: string;
  tipo?: CajaVirtualTipo;
  sucursalId?: number;
  responsableId?: number;
  usuarioId?: number;
  saldoGs?: number;
  saldoRs?: number;
  saldoDs?: number;
  limiteGs?: number;
  descripcion?: string;
  activo?: boolean;
}

export class MovimientoCajaVirtual {
  id: number;
  cajaVirtual: CajaVirtual;
  tipoMovimiento: CajaVirtualTipoMovimiento;
  cantidad: number;
  saldoAnterior: number;
  saldoPosterior: number;
  moneda: Moneda;
  referenciaId: number;
  origenTipo: string;
  /** Documento de origen. Con PK compuesta (Retiro) hacen falta los dos para ubicarlo. */
  origenId: number;
  origenSucursalId: number;
  /** true si el movimiento es el asiento de un evento de pago (lo resuelve el backend). */
  esPagoConsolidado: boolean;
  descripcion: string;
  usuario: Usuario;
  /** Funcionario que retira o rinde la plata del egreso; null = se muestra `usuario`. */
  responsable?: Funcionario;
  cajaOrigen: CajaVirtual;
  cajaDestino: CajaVirtual;
  activo: boolean;
  creadoEn: Date;

  toInput(): MovimientoCajaVirtualInput {
    let input = new MovimientoCajaVirtualInput();
    input.id = this?.id;
    input.cajaVirtualId = this?.cajaVirtual?.id;
    input.tipoMovimiento = this?.tipoMovimiento;
    input.cantidad = this?.cantidad;
    input.monedaId = this?.moneda?.id;
    input.referenciaId = this?.referenciaId;
    input.descripcion = this?.descripcion;
    input.usuarioId = this?.usuario?.id;
    input.cajaOrigenId = this?.cajaOrigen?.id;
    input.cajaDestinoId = this?.cajaDestino?.id;
    input.activo = this?.activo;
    return input;
  }
}

export class MovimientoCajaVirtualInput {
  id?: number;
  cajaVirtualId?: number;
  tipoMovimiento?: CajaVirtualTipoMovimiento;
  cantidad?: number;
  monedaId?: number;
  referenciaId?: number;
  descripcion?: string;
  usuarioId?: number;
  cajaOrigenId?: number;
  cajaDestinoId?: number;
  activo?: boolean;
}

/** Saldo de efectivo por moneda (sidebar del dashboard). */
export interface CajaVirtualSaldoItem {
  moneda: Moneda;
  saldo: number;
}

/**
 * digitsInfo para el pipe number, según la moneda. El fallback por denominación es el mismo
 * patrón que usa el resto del módulo (pagar-compras-dialog): el guaraní no lleva fracción,
 * las demás sí. Ver migración V207.5, que pobló `decimales` — estaba en 0 para todas.
 */
export function formatoDe(moneda: Moneda): string {
  const d = moneda?.decimales != null
    ? moneda.decimales
    : ((moneda?.denominacion || '').toUpperCase().includes('GUARAN') ? 0 : 2);
  return `1.0-${d}`;
}

/**
 * Saldo de una moneda según `cajaVirtualSaldos` (lo mismo que muestran las cards del dashboard).
 * null si los saldos o la moneda no cargaron; 0 si la caja no tiene fila de esa moneda.
 */
export function saldoDeMoneda(saldos: CajaVirtualSaldoItem[], moneda: Moneda): number | null {
  if (saldos == null || moneda == null) return null;
  // El ID de GraphQL llega como string.
  return saldos.find(s => +s.moneda?.id === +moneda.id)?.saldo ?? 0;
}

/** Resumen de una cuenta bancaria visible en el sidebar. */
export interface CuentaBancariaResumen {
  cuentaBancaria: CuentaBancaria;
  saldo: number;
  saldoReservado: number;
  saldoFuturo: number;
}

/** Configuración de visibilidad del dashboard de una caja. */
export interface CajaVirtualConfiguracion {
  id?: number;
  mostrarCuentasPorPagar?: boolean;
  mostrarCuentasPorCobrar?: boolean;
  operacionesFinancierasHabilitado?: boolean;
  cuentasBancariasOrden?: string;
  cuentasBancariasVisibles?: CuentaBancaria[];
}

export interface CajaVirtualConfiguracionInput {
  cajaVirtualId: number;
  mostrarCuentasPorPagar?: boolean;
  mostrarCuentasPorCobrar?: boolean;
  operacionesFinancierasHabilitado?: boolean;
  cuentasBancariasVisiblesIds?: number[];
  cuentasBancariasOrden?: string;
  /** JSON arrays; semántica PATCH en el central (undefined/null no pisa lo guardado). */
  monedasOrden?: string;
  sucursalesOrden?: string;
  operacionesFinancierasOrden?: string;
  operacionesFinancierasOcultas?: string;
}

/** Órdenes configurables de una caja. Todo null = orden por defecto (o central que todavía no los tiene). */
export interface CajaVirtualOrdenes {
  monedasOrden?: string;
  sucursalesOrden?: string;
  operacionesFinancierasOrden?: string;
  operacionesFinancierasOcultas?: string;
  /** El central no respondió los órdenes (error o versión que no los conoce): no mandarlos al guardar. */
  noDisponible?: boolean;
}

/** JSON array a lista; tolerante a null y basura. */
export function parseListaJson<T = any>(json?: string | null): T[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * Orden configurado de sucursales (desk #653). Sin orden guardado la lista queda como llega (hoy, por id): así una
 * caja sin configurar no cambia. Con orden, las que no figuran van al final por nombre.
 */
export function ordenarSucursales<T extends { id?: any; nombre?: string }>(sucursales: T[], orden: number[]): T[] {
  if (!orden?.length) return [...(sucursales || [])];
  return ordenarSegun(sucursales, s => Number(s.id), orden, (a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
}

/**
 * Ordena según una lista de claves configurada (ids o nombres): primero las que figuran, en ese orden; después el
 * resto con el comparador de respaldo. Misma regla que OrdenConfigurable del central.
 */
export function ordenarSegun<T, K>(items: T[], clave: (t: T) => K, orden: K[], respaldo: (a: T, b: T) => number): T[] {
  const pos = new Map<K, number>();
  (orden || []).forEach((k, i) => { if (!pos.has(k)) pos.set(k, i); });
  return [...(items || [])].sort((a, b) => {
    const ia = pos.has(clave(a)) ? pos.get(clave(a)) : -1;
    const ib = pos.has(clave(b)) ? pos.get(clave(b)) : -1;
    if (ia < 0 && ib < 0) return respaldo(a, b);
    if (ia < 0) return 1;
    if (ib < 0) return -1;
    return ia - ib;
  });
}

/**
 * Etiqueta del concepto real de un movimiento de caja.
 *
 * El `tipoMovimiento` es grueso (INGRESO / EGRESO / PAGO_PROVEEDOR / ...): un pago de
 * gasto, uno de compra y uno de liquidacion de sueldo salen todos iguales. El `origenTipo`
 * (que el backend ya persiste en cada movimiento) sí dice de qué se trata, y es lo que se
 * muestra. Solo cuando el origen no aporta nada — MANUAL, o ausente en movimientos viejos —
 * se cae al `tipoMovimiento`.
 */
export const ORIGEN_MOVIMIENTO_LABELS: Record<string, string> = {
  ANULACION: 'Anulación',
  RRHH_VALE: 'Vale',
  RRHH_PRESTAMO: 'Préstamo',
  RRHH_AGUINALDO: 'Aguinaldo',
  RRHH_LIQUIDACION_SUELDO: 'Liquidación',
  RRHH_LIQUIDACION_FINAL: 'Finiquito',
  RETIRO_CAJA: 'Retiro de PDV',
  VENTA_CREDITO_COBRO: 'Cobro de crédito',
  DEVOLUCION: 'Devolución',
  GASTO: 'Gasto',
  ENTRADA_VARIA: 'Entrada varia',
  OPERACION_FINANCIERA: 'Operación financiera',
  PAGO_CPP: 'Compra',
  CHEQUE: 'Cheque',
  ACREDITACION_POS: 'Acreditación POS',
  MALETIN: 'Maletín',
  VUELTO: 'Vuelto',
};

/** Fila de la lista de egresos para vuelto: devuelto y pendiente en la moneda del egreso. */
export interface EgresoParaVuelto {
  movimiento: MovimientoCajaVirtual;
  devuelto: number;
  pendiente: number;
  /** La solicitud de gasto pagada con este egreso (si fue el pago de una sola). */
  preGasto?: {
    id: number;
    sucursalId: number;
    montoRetirado?: number;
    montoGastado?: number;
    montoVuelto?: number;
    estadoRendicion?: string;
  } | null;
}

/**
 * Etiqueta a mostrar para un movimiento. `fallback` es el mapa de `tipoMovimiento` del
 * componente (cada uno tiene el suyo).
 *
 * El color NO se deriva del origen a proposito: se sigue tomando del `tipoMovimiento`, que
 * codifica la direccion de la plata (verde entra / rojo sale) y cuyas variantes de texto
 * estan verificadas con contraste WCAG AA. Inventar 16 colores nuevos rompería las dos cosas.
 */
export function labelMovimiento(
  origenTipo: string | null | undefined,
  tipoMovimiento: string | null | undefined,
  fallback: Record<string, string>
): string {
  // Entradas y salidas varias comparten origen: la dirección la da el tipo.
  if (origenTipo === 'ENTRADA_VARIA' && tipoMovimiento === CajaVirtualTipoMovimiento.EGRESO) return 'Salida varia';
  const porOrigen = origenTipo ? ORIGEN_MOVIMIENTO_LABELS[origenTipo] : null;
  if (porOrigen) return porOrigen;
  return (tipoMovimiento && fallback[tipoMovimiento]) || tipoMovimiento || '';
}
