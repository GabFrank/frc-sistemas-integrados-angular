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

export class UsuarioRole {
    id: number;
    user: Usuario;
    role: Role;
    creadoEn: Date;
    usuario: Usuario;

    toInput(): UsuarioRoleInput {
        let input = new UsuarioRoleInput;
        input.id = this.id
        input.userId = this.user?.id
        input.roleId = this.role?.id
        input.usuarioId = this.usuario?.id
        return input;
    }
}

export class UsuarioRoleInput {
    id: number;
    userId: number;
    roleId: number;
    usuarioId: number;
}