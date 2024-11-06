import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { Conteo } from "../../conteo/conteo.model";
import { Maletin } from "../../maletin/maletin.model";

export class PdvCaja {
    id:number;
    descripcion: string
    activo: boolean
    estado: PdvCajaEstado
    tuvoProblema: boolean
    fechaApertura: Date
    fechaCierre: Date
    observacion: String
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

    constructor(id, sucId){
        this.id = id;
        this.sucursalId = sucId;
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
    usuarioId: number
    conteoAperturaId: number
    conteoCierreId: number
    sucursalId: number;
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