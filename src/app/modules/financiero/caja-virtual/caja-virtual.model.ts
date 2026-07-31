import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Funcionario } from "../../personas/funcionarios/funcionario.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Moneda } from "../moneda/moneda.model";

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
