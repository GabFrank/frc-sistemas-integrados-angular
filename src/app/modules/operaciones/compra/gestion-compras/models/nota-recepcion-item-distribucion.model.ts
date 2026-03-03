import { Sucursal } from "../../../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../../../personas/usuarios/usuario.model";
import { NotaRecepcionItem } from "../nota-recepcion-item.model";
import { dateToString } from "../../../../../commons/core/utils/dateUtils";

export class NotaRecepcionItemDistribucion {
  id: number;
  notaRecepcionItem: NotaRecepcionItem;
  sucursalInfluencia: Sucursal | null;
  sucursalEntrega: Sucursal;
  cantidad: number;
  creadoEn: Date;
  usuario: Usuario | null;

  toInput(): NotaRecepcionItemDistribucionInput {
    let input = new NotaRecepcionItemDistribucionInput();
    input.id = this.id;
    input.notaRecepcionItemId = this.notaRecepcionItem?.id;
    input.sucursalInfluenciaId = this.sucursalInfluencia?.id;
    input.sucursalEntregaId = this.sucursalEntrega?.id;
    input.cantidad = this.cantidad;
    input.creadoEn = dateToString(this.creadoEn);
    input.usuarioId = this.usuario?.id;
    return input;
  }
}

export class NotaRecepcionItemDistribucionInput {
  id: number;
  notaRecepcionItemId: number;
  sucursalInfluenciaId: number | null;
  sucursalEntregaId: number;
  cantidad: number;
  creadoEn: string;
  usuarioId: number | null;
} 