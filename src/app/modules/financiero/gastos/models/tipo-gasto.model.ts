import { Cargo } from "../../../empresarial/cargo/cargo.model"
import { Usuario } from "../../../personas/usuarios/usuario.model"

export class TipoGasto {
    id: number
    isClasificacion: boolean
    clasificacionGasto: TipoGasto
    descripcion: string
    tipoNaturaleza: string
    moduloPadre?: string
    autorizacion: boolean
    cargo: Cargo
    activo: boolean
    creadoEn: Date
    subtipoList: TipoGasto[] = []
    usuario: Usuario
    afectaFinanzasActivo?: boolean;
    esPagoCuotaActivo?: boolean;
}

export class TipoGastoInput {
    id: number
    isClasificacion: boolean
    clasificacionGastoId: number
    descripcion: string
    tipoNaturaleza: string
    moduloPadre?: string
    autorizacion: boolean
    cargoId: number
    activo: boolean
    afectaFinanzasActivo?: boolean;
    esPagoCuotaActivo?: boolean;
    creadoEn: Date
    usuarioId: number
}