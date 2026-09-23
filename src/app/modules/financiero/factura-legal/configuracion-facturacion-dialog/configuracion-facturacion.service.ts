import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { ConfiguracionFacturacion, ConfiguracionFacturacionHistorial, ConfiguracionFacturacionInput } from './configuracion-facturacion.model';
import { GetConfiguracionesFacturacionGQL } from '../graphql/getConfiguracionesFacturacion';
import { SaveConfiguracionFacturacionGQL } from '../graphql/saveConfiguracionFacturacion';
import { DeleteConfiguracionFacturacionGQL } from '../graphql/deleteConfiguracionFacturacion';
import { SetActivoConfiguracionesFacturacionGQL } from '../graphql/setActivoConfiguracionesFacturacion';
import { GetHistorialConfiguracionFacturacionGQL } from '../graphql/getHistorialConfiguracionFacturacion';

/**
 * Siempre contra el central (servidor = true): la política se administra ahí y llega a los
 * filiales por replicación. Ningún PDV la lee desde el desktop: la decide el filial.
 */
@Injectable({
  providedIn: 'root'
})
export class ConfiguracionFacturacionService {

  constructor(
    private genericCrudService: GenericCrudService,
    private getConfiguracionesGQL: GetConfiguracionesFacturacionGQL,
    private saveConfiguracionGQL: SaveConfiguracionFacturacionGQL,
    private deleteConfiguracionGQL: DeleteConfiguracionFacturacionGQL,
    private setActivoGQL: SetActivoConfiguracionesFacturacionGQL,
    private getHistorialGQL: GetHistorialConfiguracionFacturacionGQL
  ) { }

  onGetConfiguraciones(): Observable<ConfiguracionFacturacion[]> {
    return this.genericCrudService.onCustomQuery(this.getConfiguracionesGQL, {}, true);
  }

  onSaveConfiguracion(input: ConfiguracionFacturacionInput): Observable<ConfiguracionFacturacion> {
    return this.genericCrudService.onSave(this.saveConfiguracionGQL, input, null, null, true);
  }

  onDeleteConfiguracion(id: number, mensaje: string): Observable<boolean> {
    return this.genericCrudService.onDelete(this.deleteConfiguracionGQL, id, 'Eliminar configuración', null, true, true, mensaje);
  }

  /** Activa o desactiva todas las configuraciones de sucursal (nunca la global). Emite cuántas cambió. */
  onSetActivoSucursales(activo: boolean): Observable<number> {
    return this.genericCrudService.onCustomMutation(this.setActivoGQL, { activo }, true);
  }

  /** sucursalId null = todo; -1 = solo la global. Más reciente primero. */
  onGetHistorial(sucursalId: number, limite = 200): Observable<ConfiguracionFacturacionHistorial[]> {
    return this.genericCrudService.onCustomQuery(this.getHistorialGQL, { sucursalId, limite }, true);
  }
}
