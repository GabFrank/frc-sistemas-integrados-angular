
import { Usuario } from "../../personas/usuarios/usuario.model";
import { PuntoDeVenta } from "../punto-de-venta/punto-de-venta.model";
import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { dateToString } from "../../../commons/core/utils/dateUtils";

export class Timbrado {
    id: number;
    razonSocial: string
    ruc: string
    numero: string
    fechaInicio: Date
    fechaFin: Date
    isElectronico: boolean
    csc: string
    cscId: string
    email: string
    tipoSociedad: string
    domicilioFiscalDepartamento: string
    domicilioFiscalCiudad: string
    domicilioFiscalCodigoCiudad: string
    domicilioFiscalLocalidad: string
    domicilioFiscalBarrio: string
    domicilioFiscalDireccion: string
    telefono: string
    codActividadEconomicaPrincipal: string
    descActividadEconomicaPrincipal: string
    listCodigoActividadEconomicaSecundaria: string
    listDescripcionActividadEconomicaSecundaria: string
    activo: boolean
    creadoEn: Date
    usuario: Usuario

    toInput(): TimbradoInput {
        let input = new TimbradoInput;
        input.id = this.id
        input.razonSocial = this.razonSocial
        input.ruc = this.ruc
        input.numero = this.numero
        // Usar utilitario dateToString con formato ISO (sin ajuste de zona horaria)
        const fechaInicioString = this.fechaInicio ? dateToString(this.fechaInicio, "yyyy-MM-dd'T'HH:mm:ss") : null;
        const fechaFinString = this.fechaFin ? dateToString(this.fechaFin, "yyyy-MM-dd'T'HH:mm:ss") : null;
        input.fechaInicio = fechaInicioString
        input.fechaFin = fechaFinString
        input.isElectronico = this.isElectronico
        input.csc = this.csc
        input.cscId = this.cscId
        input.email = this.email
        input.tipoSociedad = this.tipoSociedad
        input.domicilioFiscalDepartamento = this.domicilioFiscalDepartamento
        input.domicilioFiscalCiudad = this.domicilioFiscalCiudad
        input.domicilioFiscalCodigoCiudad = this.domicilioFiscalCodigoCiudad
        input.domicilioFiscalLocalidad = this.domicilioFiscalLocalidad
        input.domicilioFiscalBarrio = this.domicilioFiscalBarrio
        input.domicilioFiscalDireccion = this.domicilioFiscalDireccion
        input.telefono = this.telefono
        input.codActividadEconomicaPrincipal = this.codActividadEconomicaPrincipal
        input.descActividadEconomicaPrincipal = this.descActividadEconomicaPrincipal
        input.listCodigoActividadEconomicaSecundaria = this.listCodigoActividadEconomicaSecundaria
        input.listDescripcionActividadEconomicaSecundaria = this.listDescripcionActividadEconomicaSecundaria
        input.activo = this.activo
        // Preservar fecha de creación al editar
        const creadoEnString = this.creadoEn ? dateToString(this.creadoEn, "yyyy-MM-dd'T'HH:mm:ss") : null;
        input.creadoEn = creadoEnString
        input.usuarioId = this.usuario?.id
        return input;
    }

    /**
     * Procesa datos que llegan del backend GraphQL convirtiendo fechas string a Date
     */
    static fromGraphQL(data: any): Timbrado {
        const timbrado = Object.assign(new Timbrado(), data);
        
        // Convertir fechas string a objetos Date si existen (usando constructor Date nativo)
        if (data.fechaInicio) {
            timbrado.fechaInicio = new Date(data.fechaInicio);
        }
        if (data.fechaFin) {
            timbrado.fechaFin = new Date(data.fechaFin);
        }
        if (data.creadoEn) {
            timbrado.creadoEn = new Date(data.creadoEn);
        }
        
        return timbrado;
    }

}

export class TimbradoInput {
    id: number;
    razonSocial: string
    ruc: string
    numero: string
    fechaInicio: string
    fechaFin: string
    isElectronico: boolean
    csc: string
    cscId: string
    email: string
    tipoSociedad: string
    domicilioFiscalDepartamento: string
    domicilioFiscalCiudad: string
    domicilioFiscalCodigoCiudad: string
    domicilioFiscalLocalidad: string
    domicilioFiscalBarrio: string
    domicilioFiscalDireccion: string
    telefono: string
    codActividadEconomicaPrincipal: string
    descActividadEconomicaPrincipal: string
    listCodigoActividadEconomicaSecundaria: string
    listDescripcionActividadEconomicaSecundaria: string
    activo: boolean
    creadoEn: string
    usuarioId: number
}

export class TimbradoDetalle {
    id: number
    timbrado: Timbrado
    puntoDeVenta: PuntoDeVenta
    puntoExpedicion: string
    cantidad: number
    rangoDesde: number
    rangoHasta: number
    numeroActual: number
    activo: boolean
    creadoEn: Date
    usuario: Usuario
    sucursal: Sucursal
    departamento: string
    ciudad: string
    codigoCiudad: string
    localidad: string
    barrio: string
    direccion: string
    telefono: string

    toInput(): TimbradoDetallInput {
        let input = new TimbradoDetallInput;
        input.id = this.id
        input.timbradoId = this.timbrado?.id
        input.puntoDeVentaId = this.puntoDeVenta?.id
        input.puntoExpedicion = this.puntoExpedicion
        input.cantidad = this.cantidad
        input.rangoDesde = this.rangoDesde
        input.rangoHasta = this.rangoHasta
        input.numeroActual = this.numeroActual
        input.activo = this.activo
        input.usuarioId = this.usuario?.id
        input.sucursalId = this.sucursal?.id
        input.departamento = this.departamento
        input.ciudad = this.ciudad
        input.codigoCiudad = this.codigoCiudad
        input.localidad = this.localidad
        input.barrio = this.barrio
        input.direccion = this.direccion
        input.telefono = this.telefono
         return input;   
    }
}

export class TimbradoDetallInput {
    id: number
    timbradoId: number
    puntoDeVentaId: number
    puntoExpedicion: string
    cantidad: number
    rangoDesde: number
    rangoHasta: number
    numeroActual: number
    activo: boolean
    usuarioId: number
    sucursalId: number
    departamento: string
    ciudad: string
    codigoCiudad: string
    localidad: string
    barrio: string
    direccion: string
    telefono: string
}