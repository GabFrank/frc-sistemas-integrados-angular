import { Usuario } from "../../../personas/usuarios/usuario.model";
import { PrecioPorSucursal } from "../../../productos/precio-por-sucursal/precio-por-sucursal.model";

export class ProgramarPrecio {
  id: number;
  precio: PrecioPorSucursal;
  momentoCambio: MomentoCambio;
  nuevoPrecio: number;
  fechaCambio: Date;
  cantidad: number;
  creadoEn: Date;
  usuario: Usuario

  toInput(): ProgramarPrecioInput {
      let input = new ProgramarPrecioInput;
      input.id = this.id
      input.precioId = this.precio?.id
      input.momentoCambio = this.momentoCambio
      input.nuevoPrecio = this.nuevoPrecio
      input.fechaCambio = this.fechaCambio
      input.cantidad = this.cantidad
      input.creadoEn = this.creadoEn
      input.usuarioId = this.usuario?.id
      return input;
  }
}

export class ProgramarPrecioInput {
    id: number;
    precioId: number;
    momentoCambio: MomentoCambio;
    nuevoPrecio: number;
    fechaCambio: Date;
    cantidad: number;
    creadoEn: Date;
    usuarioId: number
  }

export enum MomentoCambio {
  INMEDIATO = "INMEDIATO",
  EN_FECHA_INDICADA = "EN_FECHA_INDICADA",
  AL_RECIBIR_COMPRA = "AL_RECIBIR_COMPRA",
  AL_AUTORIZAR = "AL_AUTORIZAR",
  AL_ALCANZAR_CANTIDAD = "AL_ALCANZAR_CANTIDAD"
}
