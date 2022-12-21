import { Funcionario } from "../../personas/funcionarios/funcionario.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { VueltoInput } from "./vuelto-input.model";
import { VueltoItemInput } from "./vuelto-item/vuelto-item-input.model";
import { VueltoItem } from "./vuelto-item/vuelto-item.model";

export class Vuelto {
    id: number;
    activo: boolean;
    responsable: Funcionario;
    autorizadoPor: Funcionario;
    creadoEn: Date;
    usuario: Usuario;
    sucursalId: number;
    vueltoItemList: VueltoItem[] = []

    toInput(): VueltoInput {
        let input = new VueltoInput;
        input.id = this.id
        input.activo = this.activo
        input.responsableId = this.responsable?.id
        input.autorizadoPorId = this.autorizadoPor?.id
        input.usuarioId = this.usuario?.id
        return input;
    }

    toItemInputList(): VueltoItemInput[] {
        let itemList: VueltoItemInput[] = []
        this.vueltoItemList?.forEach(vi => {
            let viAux = new VueltoItem;
            Object.assign(viAux, vi)
            itemList.push(viAux.toInput())
        })
        return itemList;
    }
}