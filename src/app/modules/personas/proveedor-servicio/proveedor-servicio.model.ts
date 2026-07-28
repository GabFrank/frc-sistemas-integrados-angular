import { CuentaBancaria } from "../../financiero/cuenta-bancaria/cuenta-bancaria.model";
import { Persona } from "../persona/persona.model";
import { Usuario } from "../usuarios/usuario.model";

/**
 * Proveedor de servicios: la empresa que provee las terminales POS y su soporte.
 * Independiente de Proveedor (mercaderia) — ambos son roles de una Persona.
 */
export class ProveedorServicio {
  id: number;
  persona: Persona;
  cuentaBancaria: CuentaBancaria;
  nombreContacto: string;
  numeroContacto: string;
  creadoEn: string;
  usuario: Usuario;

  toInput(): ProveedorServicioInput {
    let input = new ProveedorServicioInput();
    input.id = this.id;
    input.personaId = this.persona?.id;
    input.cuentaBancariaId = this.cuentaBancaria?.id;
    input.nombreContacto = this.nombreContacto;
    input.numeroContacto = this.numeroContacto;
    input.usuarioId = this.usuario?.id;
    return input;
  }
}

export class ProveedorServicioInput {
  id: number;
  personaId: number;
  cuentaBancariaId: number;
  nombreContacto: string;
  numeroContacto: string;
  usuarioId: number = null;
}
