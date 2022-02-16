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
    totalCanceladas: number;
    totalAperGs: number;
    totalAperRs: number;
    totalAperDs: number;
    totalCierreGs: number;
    totalCierreRs: number;
    totalCierreDs: number;
}