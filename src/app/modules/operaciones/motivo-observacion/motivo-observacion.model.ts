import { SubCategoriaObservacion } from "../sub-categoria-observacion/sub-categoria-observacion.model";

export class MotivoObservacion {
  id: number;
  descripcion: string;
  activo: boolean;
  creadoEn: Date;
  subcategoriaObservacion: SubCategoriaObservacion;
}