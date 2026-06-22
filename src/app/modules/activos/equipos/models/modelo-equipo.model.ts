import { MarcaEquipo } from './marca-equipo.model';

export interface ModeloEquipo {
  id?: number;
  descripcion?: string;
  marca?: MarcaEquipo;
}
