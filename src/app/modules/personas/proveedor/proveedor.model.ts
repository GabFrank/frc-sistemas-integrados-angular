import { Producto } from '../../productos/producto/producto.model';
import { Persona } from '../persona/persona.model';
import { Usuario } from '../usuarios/usuario.model';
import { Vendedor } from '../vendedor/vendedor.model';

export class Proveedor {
  id: number;
  persona: Persona;
  credito: boolean;
  tipoCredito: boolean;
  chequeDias: number;
  datosBancarios: number;
  creadoEn: Date;
  usuario: Usuario;
  vendedores: Vendedor[];
  productos: Producto[];

  toInput(): ProveedorInput {
    let input = new ProveedorInput;
    input.id = this.id
    input.personaId = this.persona?.id
    input.credito = this.credito
    input.tipoCredito = this.tipoCredito
    input.chequeDias = this.chequeDias
    input.datosBancarios = this.datosBancarios
    input.creadoEn = this.creadoEn
    input.usuarioId = this.usuario?.id
    return input;
  }
}

export class ProveedorInput {
  id: number;
  personaId: number;
  credito: boolean;
  tipoCredito: boolean;
  chequeDias: number;
  datosBancarios: number;
  creadoEn: Date;
  usuarioId: number;
}
