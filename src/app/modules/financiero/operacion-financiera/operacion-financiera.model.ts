import { CajaVirtual } from "../caja-virtual/caja-virtual.model";
import { CuentaBancaria } from "../cuenta-bancaria/cuenta-bancaria.model";
import { Moneda } from "../moneda/moneda.model";

export enum TipoOperacionFinanciera {
  CAMBIO_DIVISA = 'CAMBIO_DIVISA',
  DEPOSITO_BANCARIO = 'DEPOSITO_BANCARIO',
  RETIRO_BANCARIO = 'RETIRO_BANCARIO',
  TRANSFERENCIA_ENTRE_CAJAS = 'TRANSFERENCIA_ENTRE_CAJAS',
  TRANSFERENCIA_BANCARIA = 'TRANSFERENCIA_BANCARIA'
}

export enum DiferenciaDestinoTipo {
  IGNORAR = 'IGNORAR',
  GASTO = 'GASTO',
  VALE = 'VALE'
}

export class OperacionFinancieraCategoria {
  id: number;
  nombre: string;
  padre: OperacionFinancieraCategoria;
  icono: string;
  activo: boolean;
}

export class OperacionFinanciera {
  id: number;
  tipoOperacion: TipoOperacionFinanciera;
  categoria: OperacionFinancieraCategoria;
  descripcion: string;
  cajaMayorOrigen: CajaVirtual;
  cuentaBancariaOrigen: CuentaBancaria;
  monedaOrigen: Moneda;
  montoOrigen: number;
  cajaMayorDestino: CajaVirtual;
  cuentaBancariaDestino: CuentaBancaria;
  monedaDestino: Moneda;
  montoDestino: number;
  cotizacion: number;
  numeroComprobante: string;
  diferencia: number;
  diferenciaDestinoTipo: DiferenciaDestinoTipo;
  diferenciaObservacion: string;
  anulado: boolean;
  creadoEn: Date;
  // Calculados en el componente de listado (no son campos del backend) — evita llamar
  // funciones desde el HTML para armar el texto de origen/destino.
  origenLabel?: string;
  destinoLabel?: string;

  toInput(): OperacionFinancieraInput {
    let input = new OperacionFinancieraInput();
    input.tipoOperacion = this.tipoOperacion;
    input.descripcion = this.descripcion?.toUpperCase();
    input.categoriaId = this.categoria?.id;
    input.cajaMayorOrigenId = this.cajaMayorOrigen?.id;
    input.cuentaBancariaOrigenId = this.cuentaBancariaOrigen?.id;
    input.monedaOrigenId = this.monedaOrigen?.id;
    input.montoOrigen = this.montoOrigen;
    input.cajaMayorDestinoId = this.cajaMayorDestino?.id;
    input.cuentaBancariaDestinoId = this.cuentaBancariaDestino?.id;
    input.monedaDestinoId = this.monedaDestino?.id;
    input.montoDestino = this.montoDestino;
    input.cotizacion = this.cotizacion;
    input.numeroComprobante = this.numeroComprobante?.toUpperCase();
    input.diferencia = this.diferencia;
    input.diferenciaDestinoTipo = this.diferenciaDestinoTipo;
    input.diferenciaObservacion = this.diferenciaObservacion?.toUpperCase();
    return input;
  }
}

export class OperacionFinancieraInput {
  tipoOperacion: TipoOperacionFinanciera;
  descripcion?: string;
  categoriaId?: number;
  cajaMayorOrigenId?: number;
  cuentaBancariaOrigenId?: number;
  monedaOrigenId?: number;
  montoOrigen?: number;
  cajaMayorDestinoId?: number;
  cuentaBancariaDestinoId?: number;
  monedaDestinoId?: number;
  montoDestino?: number;
  cotizacion?: number;
  numeroComprobante?: string;
  diferencia?: number;
  diferenciaDestinoTipo?: DiferenciaDestinoTipo;
  diferenciaObservacion?: string;
}

export class MovimientoBancario {
  id: number;
  cuentaBancaria: CuentaBancaria;
  tipoMovimiento: string;
  monto: number;
  saldoAnterior: number;
  saldoPosterior: number;
  descripcion: string;
  anulado: boolean;
  creadoEn: Date;
}
