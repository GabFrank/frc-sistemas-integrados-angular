import { Usuario } from "../../../personas/usuarios/usuario.model";
import { CajaCategoriaObservacion } from "../caja-categoria-observacion/caja-categoria-observacion.model";

export class CajaSubCategoriaObservacion {
  id: number;
  descripcion: string;
  creadoEn: Date
  activo: boolean;
  cajaCategoriaObservacion: CajaCategoriaObservacion;
  usuario: Usuario;
}