import { Usuario } from '../../../personas/usuarios/usuario.model';
import { TipoEnte } from '../enums/tipo-ente.enum';

export interface Ente {
    id?: number;
    tipoEnte?: TipoEnte;
    referenciaId?: number;
    activo?: boolean;
    usuario?: Usuario;
    creadoEn?: Date;
    descripcion?: string;
    sucursalesConcatenadas?: string;
    sucursalIds?: number[];
    montoTotal?: number;
    montoYaPagado?: number;
    montoPendiente?: number;
    cuotasTotales?: number;
    cuotasPagadas?: number;
    cuotasFaltantes?: number;
    diaVencimiento?: number;
    diasParaVencer?: number;
    estadoCuota?: string;
    situacionPago?: string;
    monedaSimbolo?: string;
    proveedorNombre?: string;
}
