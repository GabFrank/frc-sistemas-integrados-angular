import { Funcionario } from "../../personas/funcionarios/funcionario.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { TipoGasto } from "../tipo-gastos/list-tipo-gastos/tipo-gasto.model";

export class Gasto {
    id: number;
    responsable: Funcionario
    tipoGasto: TipoGasto
    autorizadoPor: Funcionario
    observacion: String
    creadoEn: Date
    usuario: Usuario
}

export class GastoInput {
    id: number;
    responsable: Funcionario
    tipoGasto: TipoGasto
    autorizadoPor: Funcionario
    observacion: String
    creadoEn: Date
    usuario: Usuario
}