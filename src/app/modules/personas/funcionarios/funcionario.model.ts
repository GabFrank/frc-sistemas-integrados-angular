import { dateToString } from '../../../commons/core/utils/dateUtils';
import { Cargo } from '../../empresarial/cargo/cargo.model';
import { Sucursal } from '../../empresarial/sucursal/sucursal.model';
import { Persona } from '../persona/persona.model';
import { Usuario } from '../usuarios/usuario.model';
import { FuncionarioInput } from './funcionario-input.model';
import { Horario } from '../../administrativo/horarios/models/horario.model';

export class Funcionario {
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
  nickname: string;
  imagenPrincipal: string;
  horario: Horario;
  // Campos agregados para InformacionGeneralComponent (legajo, tab "Información general").
  codigoInterno: string;
  ipsActivo: boolean;
  numeroIps: string;
  fechaIngresoIps: string;
  cuentaBancaria: string;
  contactoEmergenciaNombre: string;
  contactoEmergenciaTelefono: string;

  toInput(): FuncionarioInput {
    let input = new FuncionarioInput;
    input.id = this.id
    input.personaId = this.persona?.id
    input.cargoId = this.cargo?.id
    input.sucursalId = this.sucursal?.id
    input.credito = this.credito
    input.fechaIngreso = dateToString(this.fechaIngreso)
    input.sueldo = this.sueldo
    input.fasePrueba = this.fasePrueba
    input.diarista = this.diarista
    input.supervisadoPorId = this.supervisadoPor?.id
    input.activo = this.activo
    input.usuarioId = this.usuario?.id
    input.horarioId = this.horario?.id
    input.codigoInterno = this.codigoInterno
    input.ipsActivo = this.ipsActivo
    input.numeroIps = this.numeroIps
    input.fechaIngresoIps = dateToString(this.fechaIngresoIps ? new Date(this.fechaIngresoIps) : null, 'yyyy-MM-dd')
    input.cuentaBancaria = this.cuentaBancaria
    input.contactoEmergenciaNombre = this.contactoEmergenciaNombre
    input.contactoEmergenciaTelefono = this.contactoEmergenciaTelefono
    return input;
  }
}
