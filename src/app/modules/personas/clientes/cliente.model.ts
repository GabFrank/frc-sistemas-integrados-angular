import { Contacto } from '../../general/contactos/contacto';
import { Persona } from '../persona/persona.model';
import { Usuario } from '../usuarios/usuario.model';

export class Cliente {
  id: number;
  tipo: TipoCliente
  persona: Persona;
  nombre: string;
  documento: string;
  credito: number;
  creadoEn: Date;
  usuario: Usuario;
  saldo: number;
  codigo: string;

  toInput(): ClienteInput {
    let input = new ClienteInput;
    input.id = this.id
    input.personaId = this.persona?.id
    input.credito = this.credito
    input.creadoEn = this.creadoEn
    input.usuarioId = this.usuario?.id
    input.tipo = this.tipo
    input.codigo = this.codigo
    return input;
  }s
}

export class ClienteInput {
  id: number;
  tipo: TipoCliente
  personaId: number;
  nombre: string;
  credito: number;
  creadoEn: Date;
  codigo: string;
  usuarioId: number;
}

export enum TipoCliente {
  NORMAL = 'NORMAL',
  ASOCIADO = 'ASOCIADO',
  CONVENIADO = 'CONVENIADO',
  FUNCIONARIO = 'FUNCIONARIO',
  VIP = 'VIP'
}
