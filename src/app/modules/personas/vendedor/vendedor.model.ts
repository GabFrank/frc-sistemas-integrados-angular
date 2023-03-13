import { Persona } from "../persona/persona.model";
import { Proveedor } from "../proveedor/proveedor.model";
import { Usuario } from "../usuarios/usuario.model";

export interface Vendedor {
    id: number;
    proveedores: Proveedor[];
    persona: Persona;
    observacion: string;
    usuario: Usuario;
    activo: boolean;
    nombrePersona: string;
  }