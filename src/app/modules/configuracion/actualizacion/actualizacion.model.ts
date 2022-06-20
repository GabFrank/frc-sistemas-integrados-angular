import { Usuario } from "../../personas/usuarios/usuario.model"

export class Actualizacion {
    id: number
    currentVersion: string
    enabled: boolean
    nivel: NivelActualizacion
    tipo: TipoActualizacion
    title: string
    msg: string
    btn: string
    usuario: Usuario
    creadoEn: Date

    toInput(): ActualizacionInput {
        let input = new ActualizacionInput;
        input.id = this.id
        input.currentVersion = this.currentVersion
        input.enabled = this.enabled
        input.nivel = this.nivel
        input.tipo = this.tipo
        input.title = this.title
        input.msg = this.msg
        input.btn = this.btn
        input.usuarioId = this.usuario?.id
        return input;
    }
}

export class ActualizacionInput {
    id: number
    currentVersion: string
    enabled: boolean
    nivel: NivelActualizacion
    tipo: TipoActualizacion
    title: string
    msg: string
    btn: string
    usuarioId: number;
}

export enum NivelActualizacion {
    CRITICO = "CRITICO",
    MODERADO = "MODERADO",
    MANTENIMIENTO = "MANTENIMIENTO",
}

export enum TipoActualizacion {
    MOBILE = 'MOBILE',
    DESKTOP = 'DESKTOP',
    SERVIDOR_FILIAL = 'SERVIDOR_FILIAL',
    SERVIDOR_CENTRAL = 'SERVIDOR_CENTRAL',
}