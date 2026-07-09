import { dateToString } from "../../../commons/core/utils/dateUtils";
import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Proveedor } from "../../personas/proveedor/proveedor.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Presentacion } from "../../productos/presentacion/presentacion.model";
import { Producto } from "../../productos/producto/producto.model";

export enum TipoDevolucion {
  SIN_PROVEEDOR = "SIN_PROVEEDOR", // averia / vencido, genera gasto
  CON_PROVEEDOR = "CON_PROVEEDOR", // devolucion a proveedor
}

export enum DevolucionEstado {
  PENDIENTE = "PENDIENTE",
  SEPARADO = "SEPARADO",
  RETIRADO = "RETIRADO",
  CANJEADO = "CANJEADO",
  ACREDITADO = "ACREDITADO",
  DESCARTADO = "DESCARTADO",
  CANCELADA = "CANCELADA",
}

export enum TipoResolucionDevolucion {
  NOTA_CREDITO = "NOTA_CREDITO",
  CANJE = "CANJE",
}

export class MotivoAveria {
  id: number;
  descripcion: string;
  activo: boolean;
  generaGasto: boolean;
  aplicaProveedor: boolean;
}

export class Devolucion {
  id: number;
  tipo: TipoDevolucion;
  proveedor: Proveedor;
  sucursalOrigen: Sucursal;
  fecha: Date;
  motivo: string;
  estado: DevolucionEstado;
  identificador: string;
  resolucion: TipoResolucionDevolucion;
  nroNotaCredito: string;
  montoAcreditado: number;
  observacion: string;
  creadoEn: Date;
  finalizado: boolean;
  usuario: Usuario;
  items: DevolucionItem[];

  toInput(): DevolucionInput {
    let input = new DevolucionInput();
    input.id = this.id;
    input.tipo = this.tipo;
    input.proveedorId = this.proveedor?.id;
    input.sucursalOrigenId = this.sucursalOrigen?.id;
    input.fecha = dateToString(this.fecha);
    input.motivo = this.motivo;
    input.estado = this.estado;
    input.observacion = this.observacion;
    input.usuarioId = this.usuario?.id;
    return input;
  }
}

export class DevolucionInput {
  id: number;
  tipo: TipoDevolucion;
  proveedorId: number;
  sucursalOrigenId: number;
  fecha: string;
  motivo: string;
  estado: DevolucionEstado;
  cajaVirtualId: number;
  observacion: string;
  usuarioId: number = null;
  items: DevolucionItemInput[];
}

export class DevolucionItem {
  id: number;
  devolucion: Devolucion;
  producto: Producto;
  presentacion: Presentacion;
  motivoAveria: MotivoAveria;
  recepcionMercaderiaItem: any;
  cantidad: number;
  lote: string;
  motivo: string;
  vencimiento: Date;
  costoUnitario: number;
  cantidadReingresada: number;
  vencimientoReingreso: Date;

  toInput(): DevolucionItemInput {
    let input = new DevolucionItemInput();
    input.id = this.id;
    input.devolucionId = this.devolucion?.id;
    input.productoId = this.producto?.id;
    input.presentacionId = this.presentacion?.id;
    input.motivoAveriaId = this.motivoAveria?.id;
    input.recepcionMercaderiaItemId =
      this.recepcionMercaderiaItem?.id != null
        ? this.recepcionMercaderiaItem.id
        : this.recepcionMercaderiaItem;
    input.cantidad = this.cantidad;
    input.motivo = this.motivo;
    input.lote = this.lote;
    input.vencimiento = dateToString(this.vencimiento);
    input.costoUnitario = this.costoUnitario;
    input.cantidadReingresada = this.cantidadReingresada;
    input.vencimientoReingreso = dateToString(this.vencimientoReingreso);
    return input;
  }
}

export class DevolucionItemInput {
  id: number;
  devolucionId: number;
  productoId: number;
  presentacionId: number;
  motivoAveriaId: number;
  recepcionMercaderiaItemId: number;
  cantidad: number;
  motivo: string;
  lote: string;
  vencimiento: string;
  costoUnitario: number;
  cantidadReingresada: number;
  vencimientoReingreso: string;
}
