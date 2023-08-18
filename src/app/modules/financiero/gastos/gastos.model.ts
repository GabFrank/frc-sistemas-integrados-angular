import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Funcionario } from "../../personas/funcionarios/funcionario.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { PdvCaja } from "../pdv/caja/caja.model";
import { TipoGasto } from "../tipo-gastos/list-tipo-gastos/tipo-gasto.model";
import { GastoDetalle, GastoDetalleInput } from "./gasto-detalle/gasto-detalle.model";

export class Gasto {
    id: number;
    sucursalId: number;
    caja: PdvCaja
    responsable: Funcionario
    tipoGasto: TipoGasto
    autorizadoPor: Funcionario
    observacion: string
    gastoDetalleList: GastoDetalle[]
    activo: boolean;
    finalizado: boolean;
    creadoEn: Date
    usuario: Usuario
    retiroGs: number;
    retiroRs: number;
    retiroDs: number;
    vueltoGs: number;
    vueltoRs: number;
    vueltoDs: number;
    sucursalVuelto: Sucursal;
    sucursal: Sucursal

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
        input.retiroGs = this.retiroGs;
        input.retiroRs = this.retiroRs;
        input.retiroDs = this.retiroDs;
        input.vueltoGs = this.vueltoGs
        input.vueltoRs = this.vueltoRs
        input.vueltoDs = this.vueltoDs
        input.activo = this.activo;
        input.finalizado = this.finalizado;
        input.sucursalVueltoId = this.sucursalVuelto?.id;
        input.sucursalId = this.sucursalId;
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
    sucursalId: number;
    cajaId: number
    responsableId: number
    tipoGastoId: number
    autorizadoPorId: number
    observacion: string
    creadoEn: Date
    usuarioId: number
    retiroGs: number;
    retiroRs: number;
    retiroDs: number;
    vueltoGs: number;
    vueltoRs: number;
    vueltoDs: number;
    activo: boolean;
    finalizado: boolean;
    sucursalVueltoId: number;
}