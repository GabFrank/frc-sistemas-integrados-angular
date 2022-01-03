import { Funcionario } from "../../personas/funcionarios/funcionario.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { PdvCaja } from "../pdv/caja/caja.model";
import { TipoGasto } from "../tipo-gastos/list-tipo-gastos/tipo-gasto.model";
import { GastoDetalle, GastoDetalleInput } from "./gasto-detalle/gasto-detalle.model";

export class Gasto {
    id: number;
    caja: PdvCaja
    responsable: Funcionario
    tipoGasto: TipoGasto
    autorizadoPor: Funcionario
    observacion: string
    gastoDetalleList: GastoDetalle[]
    creadoEn: Date
    usuario: Usuario
    valorGs: number;
    valorRs: number;
    valorDs: number;

    toInput(): GastoInput {
        let input = new GastoInput;
        input.id = this.id;
        input.cajaId = this.caja?.id
        input.responsableId = this.responsable?.id
        input.tipoGastoId = this.tipoGasto?.id
        input.autorizadoPorId = this.autorizadoPor?.id
        input.observacion = this.observacion;
        input.creadoEn = this.creadoEn;
        input.usuarioId = this.usuario?.id;
        input.valorGs = this.valorGs;
        input.valorRs = this.valorRs;
        input.valorDs = this.valorDs;
        return input;
    }

    toDetalleInputList(): GastoDetalleInput[]{
        let detalleList : GastoDetalleInput[] = []
        this.gastoDetalleList.forEach(e => {
            detalleList.push(e.toInput())
        })
        return detalleList;
    }
}

export class GastoInput {
    id: number;
    cajaId: number
    responsableId: number
    tipoGastoId: number
    autorizadoPorId: number
    observacion: string
    creadoEn: Date
    usuarioId: number
    valorGs: number;
    valorRs: number;
    valorDs: number;
}