import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { Funcionario } from "../../../personas/funcionarios/funcionario.model";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { PdvCaja } from "../../pdv/caja/caja.model";
import { GastoDetalle, GastoDetalleInput } from "./gasto-detalle.model";
import { PreGasto } from "./pre-gasto.model";
import { TipoGasto } from "./tipo-gasto.model";


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
    preGasto: PreGasto;
    preGastoId: number;
    preGastoSucursalId: number;

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
        input.sucursalId = this.sucursalId;
        input.preGastoId = this.preGasto?.id ?? this.preGastoId;
        input.preGastoSucursalId = this.preGasto?.sucursalId ?? this.preGastoSucursalId;
        return input;
    }

    toDetalleInputList(): GastoDetalleInput[] {
        let detalleList: GastoDetalleInput[] = []
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
    preGastoId: number;
    preGastoSucursalId: number;
}