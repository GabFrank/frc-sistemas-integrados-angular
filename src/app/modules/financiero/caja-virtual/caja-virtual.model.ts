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
  descripcion: string;
  usuario: Usuario;
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
};

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
  const porOrigen = origenTipo ? ORIGEN_MOVIMIENTO_LABELS[origenTipo] : null;
  if (porOrigen) return porOrigen;
  return (tipoMovimiento && fallback[tipoMovimiento]) || tipoMovimiento || '';
}
