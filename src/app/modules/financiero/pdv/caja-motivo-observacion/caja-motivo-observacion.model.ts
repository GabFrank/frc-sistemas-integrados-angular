import { Usuario } from "../../../personas/usuarios/usuario.model";
import { CajaSubCategoriaObservacion } from "../caja-subcategoria-observacion/caja-subcategoria-observacion.model";

export class CajaMotivoObservacion {
  id: number;
  descripcion: string;
  activo: boolean;
  creadoEn: Date;
  cajaSubCategoriaObservacion: CajaSubCategoriaObservacion;
  usuario: Usuario;
}