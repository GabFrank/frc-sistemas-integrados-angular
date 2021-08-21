import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { NecesidadEstado } from "./necesidad-enums";
import { NecesidadItem } from "./necesidad-item/necesidad-item.model";

export class NecesidadInput {
  id: number;
  sucursalId: number;
  fecha: Date
  estado: NecesidadEstado;
  creadoEn: Date
  usuarioId: Usuario;
}
