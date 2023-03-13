import { Moneda } from "../../../../modules/financiero/moneda/moneda.model";
import { Usuario } from "../../../../modules/personas/usuarios/usuario.model";
import { Vuelto } from "../vuelto.model";
import { VueltoItemInput } from "./vuelto-item-input.model";


export class VueltoItem {
    id: number;
    vuelto: Vuelto;
    valor: number;
    moneda: Moneda;
    creadoEn: Date;
    usuario: Usuario;

    toInput(): VueltoItemInput {
        let item = new VueltoItemInput;
        item.id = this.id
        item.vueltoId = this.vuelto?.id
        item.valor = this.valor
        item.monedaId = this.moneda?.id
        item.usuarioId = this.usuario?.id
        return item;
    }
}