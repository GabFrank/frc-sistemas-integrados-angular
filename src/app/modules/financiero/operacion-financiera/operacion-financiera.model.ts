import { CajaVirtual } from "../caja-virtual/caja-virtual.model";
import { CuentaBancaria } from "../cuenta-bancaria/cuenta-bancaria.model";
import { Moneda } from "../moneda/moneda.model";
import { Usuario } from "../../personas/usuarios/usuario.model";

export enum TipoOperacionFinanciera {
  CAMBIO_DIVISA = 'CAMBIO_DIVISA',
  DEPOSITO_BANCARIO = 'DEPOSITO_BANCARIO',
  RETIRO_BANCARIO = 'RETIRO_BANCARIO',
  TRANSFERENCIA_ENTRE_CAJAS = 'TRANSFERENCIA_ENTRE_CAJAS',
  TRANSFERENCIA_BANCARIA = 'TRANSFERENCIA_BANCARIA'
}

/**
 * Los tipos en su orden por defecto (develop ce6e0fe3: «Transf. entre Cajas» primero, «Cambio de Divisa» al final).
 * La caja mayor puede reordenarlos y ocultarlos en su configuración (desk #720): eso solo ordena y oculta, el rol
 * sigue decidiendo qué se puede hacer.
 */
export const TIPOS_OPERACION_FINANCIERA: { label: string; value: TipoOperacionFinanciera; icono: string; desc: string }[] = [
  { label: 'Transf. entre Cajas', value: TipoOperacionFinanciera.TRANSFERENCIA_ENTRE_CAJAS, icono: 'swap_horiz', desc: 'Caja → caja' },
  { label: 'Depósito Bancario', value: TipoOperacionFinanciera.DEPOSITO_BANCARIO, icono: 'account_balance', desc: 'Caja → cuenta bancaria' },
  { label: 'Retiro Bancario', value: TipoOperacionFinanciera.RETIRO_BANCARIO, icono: 'savings', desc: 'Cuenta bancaria → caja' },
  { label: 'Transf. Bancaria', value: TipoOperacionFinanciera.TRANSFERENCIA_BANCARIA, icono: 'sync_alt', desc: 'Cuenta → cuenta' },
  { label: 'Cambio de Divisa', value: TipoOperacionFinanciera.CAMBIO_DIVISA, icono: 'currency_exchange', desc: 'Entre monedas en caja' },
];

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
  /** La moneda que vale 1 en la cotización (central #603). Solo se manda, no se lee. */
  cotizacionMonedaId?: number;
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
    if (this.cotizacionMonedaId != null) input.cotizacionMonedaId = this.cotizacionMonedaId;
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
  cotizacionMonedaId?: number;
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
  usuario: Usuario;
  /** Módulo dueño del movimiento (name de OrigenMovimientoTipo): dice desde dónde se anula. */
  origenTipo: string;
  origenId: number;
  /** Evento de pago al que pertenece, o null. No es el origenId: el cheque al contado de un pago lo tiene nulo. */
  pagoId: number;
}
