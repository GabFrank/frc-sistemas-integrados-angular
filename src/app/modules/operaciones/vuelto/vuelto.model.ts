import { Funcionario } from "../../personas/funcionarios/funcionario.model";
import { Usuario } from "../../personas/usuarios/usuario.model";

export class Vuelto {
    id: number;
    activo: boolean;
    responsable: Funcionario;
    autorizadoPor: Funcionario;
    creadoEn: Date;
    usuario: Usuario;
    sucursalId: number;
}