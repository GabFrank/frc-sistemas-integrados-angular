import { Usuario } from "../../personas/usuarios/usuario.model";

export class PrecioDelivery {
    id: number;
    descripcion: string;
    valor: number;
    activo: boolean;
    creadoEn: Date;
    usuario: Usuario;
}