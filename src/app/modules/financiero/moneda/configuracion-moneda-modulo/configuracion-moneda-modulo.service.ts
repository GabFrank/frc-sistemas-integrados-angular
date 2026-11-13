import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { LECTURA_ESTRICTA } from '../../../../generics/generic-crud.constantes';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { limpiarMensajeGraphQL } from '../../../../commons/core/utils/graphqlErrorUtils';
import { MonedaModuloService } from '../../../../shared/services/moneda-modulo.service';
import {
  ConfiguracionMonedaModulo,
  ConfiguracionMonedaModuloInput,
  ModuloMoneda
} from './configuracion-moneda-modulo.model';
import { ConfiguracionesMonedaModuloGQL } from './graphql/configuracionesMonedaModulo';
import { SaveConfiguracionMonedaModuloGQL } from './graphql/saveConfiguracionMonedaModulo';
import { SetActivoConfiguracionMonedaModuloGQL } from './graphql/setActivoConfiguracionMonedaModulo';

/** Prefijo del rechazo del central cuando la moneda no tiene cotización cargada. */
const PREFIJO_SIN_COTIZACION = 'SIN_COTIZACION';

/**
 * Mensaje para el usuario de un rechazo `SIN_COTIZACION: ...`, o null si el rechazo es otro.
 * Exportada para el spec.
 */
export function mensajeSinCotizacion(mensaje: string | null | undefined): string | null {
  if (typeof mensaje !== 'string') return null;
  // El rechazo llega crudo (con el prefijo de graphql-java) a `silenciarRechazo`.
  const limpio = String(limpiarMensajeGraphQL(mensaje) || '').trim();
  const desde = limpio.indexOf(PREFIJO_SIN_COTIZACION);
  if (desde === -1) return null;
  const detalle = limpio.substring(desde + PREFIJO_SIN_COTIZACION.length).replace(/^[:\s]+/, '');
  return 'Sin cotización: ' + (detalle || 'la moneda no tiene cotización cargada.');
}

/** Prefijo del rechazo del central cuando la cotización del comercio tiene más de 30 días. */
const PREFIJO_COTIZACION_VIEJA = 'COTIZACION_VIEJA';

/**
 * Detalle de un rechazo `COTIZACION_VIEJA: ...` («La ultima cotizacion de DOLAR es del 23/03/2026…»),
 * o null si el rechazo es otro. No es un error: el diálogo lo muestra y pide confirmar. Exportada para el spec.
 */
export function mensajeCotizacionVieja(mensaje: string | null | undefined): string | null {
  if (typeof mensaje !== 'string') return null;
  const limpio = String(limpiarMensajeGraphQL(mensaje) || '').trim();
  const desde = limpio.indexOf(PREFIJO_COTIZACION_VIEJA);
  if (desde === -1) return null;
  const detalle = limpio.substring(desde + PREFIJO_COTIZACION_VIEJA.length).replace(/^[:\s]+/, '');
  return detalle || 'La cotización de la moneda es de hace más de 30 días.';
}

/**
 * El central rechazó la consulta por el schema: no conoce `ModuloMoneda` ni la query (anterior a
 * V258.5). No es una falla sino un central sin actualizar. Exportada para el spec.
 */
export function esCentralSinMonedaPorModulo(err: any): boolean {
  const texto = JSON.stringify(err?.graphQLErrors ?? []) + ' ' + String(err?.message ?? '');
  return /FieldUndefined|UnknownType|Cannot query field/.test(texto);
}

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionMonedaModuloService {

  constructor(
    private configuracionesGQL: ConfiguracionesMonedaModuloGQL,
    private saveGQL: SaveConfiguracionMonedaModuloGQL,
    private setActivoGQL: SetActivoConfiguracionMonedaModuloGQL,
    private genericService: GenericCrudService,
    private notificacion: NotificacionSnackbarService,
    private monedaModuloService: MonedaModuloService,
  ) {}

  /**
   * Las configuraciones, la más reciente primero (`modulo` null = todas). El error, del servidor o
   * de red, llega al `error:` sin aviso del genérico: la pantalla muestra su estado de error.
   */
  onGetConfiguraciones(modulo: ModuloMoneda | null): Observable<ConfiguracionMonedaModulo[]> {
    return this.genericService.onCustomQuery(this.configuracionesGQL, { modulo }, true, LECTURA_ESTRICTA);
  }

  /** Crea una fila nueva. El rechazo lo avisa el genérico, salvo `SIN_COTIZACION`, que se avisa claro. */
  onSave(input: ConfiguracionMonedaModuloInput): Observable<ConfiguracionMonedaModulo> {
    return this.genericService.onSaveCustom<ConfiguracionMonedaModulo>(this.saveGQL, { input }, true, {
      avisarExito: false,
      silenciarRechazo: (errores) => {
        // La cotización vieja la confirma el diálogo: no es un error que avisar.
        if (mensajeCotizacionVieja(errores?.[0]?.message) != null) return true;
        const texto = mensajeSinCotizacion(errores?.[0]?.message);
        if (texto == null) return false;
        this.notificacion.openWarn(texto, 5);
        return true;
      },
    });
  }

  onSetActivo(id: number, activo: boolean): Observable<ConfiguracionMonedaModulo> {
    return this.genericService.onSaveCustom<ConfiguracionMonedaModulo>(this.setActivoGQL, { id, activo }, true,
      { avisarExito: false });
  }

  /** Tras un cambio, la moneda de cada módulo en esta sesión se vuelve a leer. */
  refrescarMonedasDeModulo(): void {
    this.monedaModuloService.refrescar();
  }
}
