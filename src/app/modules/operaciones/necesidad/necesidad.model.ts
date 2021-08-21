import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { NecesidadEstado } from "./necesidad-enums";
import { NecesidadItem } from "./necesidad-item/necesidad-item.model";

export class Necesidad {
  id: number;
  sucursal: Sucursal;
  fecha: Date
  estado: NecesidadEstado;
  creadoEn: Date
  usuario: Usuario;
  necesidadItens: [NecesidadItem]
}
