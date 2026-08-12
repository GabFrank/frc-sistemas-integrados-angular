import { Usuario } from "../../personas/usuarios/usuario.model";
import { CajaVirtual } from "../caja-virtual/caja-virtual.model";
import { FormaPago } from "../forma-pago/forma-pago.model";
import { Moneda } from "../moneda/moneda.model";

export class EntradaVariaCategoria {
  id: number;
  nombre: string;
  padre: EntradaVariaCategoria;
  icono: string;
  activo: boolean;
}

export class EntradaVaria {
  id: number;
  descripcion: string;
  monto: number;
  esIngreso: boolean;
  cajaVirtual: CajaVirtual;
  moneda: Moneda;
  categoria: EntradaVariaCategoria;
  formaPago: FormaPago;
  numeroComprobante: string;
  movimientoCajaVirtualId: number;
  usuario: Usuario;
  anulado: boolean;
  creadoEn: Date;

  toInput(): EntradaVariaInput {
    let input = new EntradaVariaInput();
    input.descripcion = this.descripcion?.toUpperCase();
    input.monto = this.monto;
    input.esIngreso = this.esIngreso;
    input.cajaVirtualId = this.cajaVirtual?.id;
    input.monedaId = this.moneda?.id;
    input.categoriaId = this.categoria?.id;
    input.formaPagoId = this.formaPago?.id;
    input.numeroComprobante = this.numeroComprobante?.toUpperCase();
    return input;
  }
}

export class EntradaVariaInput {
  descripcion?: string;
  monto: number;
  esIngreso: boolean;
  cajaVirtualId: number;
  monedaId?: number;
  categoriaId?: number;
  formaPagoId?: number;
  numeroComprobante?: string;
}
