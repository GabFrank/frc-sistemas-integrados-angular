import { Sucursal } from '../../empresarial/sucursal/sucursal.model';
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
  sucursal: Sucursal;
  tributa: boolean
  verificadoSet: boolean
  direccion: string;

  toInput(): ClienteInput {
    let input = new ClienteInput;
    input.id = this.id
    input.personaId = this.persona?.id
    input.credito = this.credito
    input.creadoEn = this.creadoEn
    input.usuarioId = this.usuario?.id
    input.tipo = this.tipo
    input.codigo = this.codigo
    input.tributa = this.tributa
    input.verificadoSet = this.verificadoSet
    input.nombre = this.nombre
    input.saldo = this.saldo
    input.direccion = this.direccion;
    input.documento = this.documento;
    return input;
  }
}

export class ClienteInput {
  id: number;
  tipo: TipoCliente
  personaId: number;
  nombre: string;
  documento: string;
  credito: number;
  creadoEn: Date;
  usuarioId: number;
  saldo: number;
  codigo: string;
  sucursalId: number;
  tributa: boolean
  verificadoSet: boolean
  direccion: string;

}

export enum TipoCliente {
  NORMAL = 'NORMAL',
  ASOCIADO = 'ASOCIADO',
  CONVENIADO = 'CONVENIADO',
  FUNCIONARIO = 'FUNCIONARIO',
  VIP = 'VIP'
}
