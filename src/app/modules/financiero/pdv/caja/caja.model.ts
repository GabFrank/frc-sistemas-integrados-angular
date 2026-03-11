import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { Conteo } from "../../conteo/conteo.model";
import { Maletin } from "../../maletin/maletin.model";

import { CajaObservacion } from "../caja-observacion/caja-observacion.model";

export class PdvCaja {
    id:number;
    descripcion: string
    activo: boolean
    estado: PdvCajaEstado
    tuvoProblema: boolean
    fechaApertura: Date
    fechaCierre: Date
    observacion: String
    cajaObservacionList: CajaObservacion[]
    maletin: Maletin
    creadoEn: Date
    usuario: Usuario
    conteoApertura: Conteo
    conteoCierre: Conteo
    balance: CajaBalance
    sucursalId: number;
    sucursal: Sucursal;
    verificado: boolean;
    verificadoPor: Usuario;

    constructor(){
    }

    toInput(): PdvCajaInput {
        let input = new PdvCajaInput();
        input.id = this.id;
        input.descripcion = this.descripcion;
        input.activo = this.activo;
        input.estado = this.estado;
        input.tuvoProblema = this.tuvoProblema;
        input.fechaApertura = this.fechaApertura;
        input.fechaCierre = this.fechaCierre;
        input.observacion = this.observacion;
        input.maletinId = this.maletin?.id;
        input.creadoEn = this.creadoEn;
        input.usuarioId = this.usuario?.id;
        input.conteoAperturaId = this.conteoApertura?.id;
        input.conteoCierreId = this.conteoCierre?.id;
        input.sucursalId = this.sucursalId;
        input.verificado = this.verificado;
        input.verificadoPorId = this.verificadoPor?.id;
        return input;
    }
}

export class PdvCajaInput {
    id:number;
    descripcion: string
    activo: boolean
    estado: PdvCajaEstado
    tuvoProblema: boolean
    fechaApertura: Date
    fechaCierre: Date
    observacion: String
    maletinId: number
    creadoEn: Date
    usuarioId: number = null;
    conteoAperturaId: number
    conteoCierreId: number
    sucursalId: number = null;
    verificado: boolean;
    verificadoPorId: number;
}

export  enum PdvCajaEstado {
    'En proceso'='EN_PROCESO',
    'Concluido'='CONCLUIDO',
    'Necesita verificacion'='NECESITA_VERIFICACION',
    'En verificacion'='EN_VERIFICACION',
    'Verificado y concluido sin problema'='VERIFICADO_CONCLUIDO_SIN_PROBLEMA',
    'Verificado y concluido con problema'='VERIFICADO_CONCLUIDO_CON_PROBLEMA'
}

export class CajaBalance {
    cajaId: number;
    totalGeneral: number;
    totalVentaGs: number;
    totalVentaRs: number;
    totalVentaDs: number;
    totalTarjeta: number;
    totalRetiroGs: number;
    totalRetiroRs: number;
    totalRetiroDs: number;
    totalGastoGs: number;
    totalGastoRs: number;
    totalGastoDs: number;
    totalDescuento: number;
    totalAumento: number;
    totalCanceladasGs: number;
    totalCanceladasRs: number;
    totalCanceladasDs: number;
    totalAperGs: number;
    totalAperRs: number;
    totalAperDs: number;
    totalCierreGs: number;
    totalCierreRs: number;
    totalCierreDs: number;
    vueltoGs: number;
    vueltoRs: number;
    vueltoDs: number;
    totalCredito: number;
    totalCanceladas: number;
    diferenciaGs: number;
    diferenciaRs: number;
    diferenciaDs: number;
}