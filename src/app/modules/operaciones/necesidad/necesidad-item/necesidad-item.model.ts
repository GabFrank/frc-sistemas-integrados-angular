import { NecesidadItemEstado } from "./necesidad-item-enum";
import { Necesidad } from "./../necesidad.model";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { Producto } from "../../../productos/producto/producto.model";

export class NecesidadItem {
  id: number;
  necesidad: Necesidad;
  producto: Producto;
  autogenerado: boolean
  cantidadSugerida: number;
  modificado: Boolean
  cantidad: number;
  frio: Boolean
  observacion: String
  estado: NecesidadItemEstado;
  creadoEn: Date
  usuario: Usuario;
}
