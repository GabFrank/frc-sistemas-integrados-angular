import { Moneda } from "../../financiero/moneda/moneda.model";
import { Funcionario } from "../../personas/funcionarios/funcionario.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Delivery } from "../delivery/delivery.model";

export class Vuelto {
    id: number;
    activo: boolean;
    responsable: Funcionario;
    autorizadoPor: Funcionario;
    creadoEn: Date;
    usuario: Usuario;
}