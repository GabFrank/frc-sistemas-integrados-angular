import { Moneda } from "../../../../modules/financiero/moneda/moneda.model";
import { Usuario } from "../../../../modules/personas/usuarios/usuario.model";
import { Vuelto } from "../vuelto.model";


export class VueltoItem {
    id: number;
    vuelto: Vuelto;
    valor: number;
    moneda: Moneda;
    creadoEn: Date;
    usuario: Usuario;
}