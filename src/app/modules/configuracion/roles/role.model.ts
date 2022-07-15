import { Usuario } from "../../personas/usuarios/usuario.model";

export class Role {
    id: number;
    nombre: string;
    creadoEn: Date;
    usuario: Usuario;

    toInput(): RoleInput {
        let input = new RoleInput;
        input.id = this.id
        input.nombre = this.nombre
        input.usuarioId = this.usuario?.id
        return input;
    }
}

export class RoleInput {
    id: number;
    nombre: string;
    usuarioId: number;
}