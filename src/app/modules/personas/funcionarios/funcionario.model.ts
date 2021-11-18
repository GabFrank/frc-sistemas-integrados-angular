import { Cargo } from '../../empresarial/cargo/cargo.model';
import { Sucursal } from '../../empresarial/sucursal/sucursal.model';
import { Persona } from '../persona/persona.model';
import { Usuario } from '../usuarios/usuario.model';

export class Funcionario  {
  id: number;
  persona: Persona;
  cargo: Cargo;
  sucursal: Sucursal;
  credito: number;
  fechaIngreso: Date;
  sueldo: number;
  fasePrueba: boolean
  diarista: boolean
  supervisadoPor: Funcionario
  creadoEn: Date;
  activo: boolean;
  usuario: Usuario;
}
