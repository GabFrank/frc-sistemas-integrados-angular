import { Persona } from '../../../personas/persona/persona.model';
import { Usuario } from '../../../personas/usuarios/usuario.model';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { TipoEquipo } from './tipo-equipo.model';
import { EquipoFinanciero } from './equipo-financiero.model';
import { ModeloEquipo } from './modelo-equipo.model';

export interface Equipo {
  id?: number;
  propietario?: Persona;
  identificador?: string;
  modelo?: ModeloEquipo;
  descripcion?: string;
  imagenes?: string;
  tipoEquipo?: TipoEquipo;
  consumeEnergia?: boolean;
  consumoValor?: string;
  financiero?: EquipoFinanciero;
  sucursal?: Sucursal;
  usuario?: Usuario;
  creadoEn?: Date;
}
