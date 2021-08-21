import { Producto } from '../../productos/producto/producto.model';
import { Persona } from '../persona/persona.model';
import { Usuario } from '../usuarios/usuario.model';
import { Vendedor } from '../vendedor/graphql/vendedorSearchByPersona';

export interface Proveedor {
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
}
