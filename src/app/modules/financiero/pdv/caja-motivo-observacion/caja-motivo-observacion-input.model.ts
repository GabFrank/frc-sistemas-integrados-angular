import { Usuario } from "../../../personas/usuarios/usuario.model";
import { CajaSubCategoriaObservacion } from "../caja-subcategoria-observacion/caja-subcategoria-observacion.model";

export class CajaMotivoObservacionInput {
  id: number;
  descripcion: string;
  activo: boolean;
  cajaSubCategoriaObsId: number;
  usuarioId: number;
}