import { PrecioDelivery } from "../../operaciones/delivery/precio-delivery.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Ciudad } from "../ciudad/ciudad.model";

export class Barrio {
    id: number;
    descripcion: string;
    ciudad: Ciudad;
    precioDelivery: PrecioDelivery;
    creadoEn: Date;
    usuario: Usuario;
}