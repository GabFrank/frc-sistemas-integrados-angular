import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PageInfo } from '../../../../app.component';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { ConfiguracionFacturacion, ConfiguracionFacturacionHistorial, ConfiguracionFacturacionInput } from './configuracion-facturacion.model';
import { GetConfiguracionesFacturacionGQL } from '../graphql/getConfiguracionesFacturacion';
import { SaveConfiguracionFacturacionGQL } from '../graphql/saveConfiguracionFacturacion';
import { DeleteConfiguracionFacturacionGQL } from '../graphql/deleteConfiguracionFacturacion';
import { SetActivoConfiguracionesFacturacionGQL } from '../graphql/setActivoConfiguracionesFacturacion';
import { GetHistorialConfiguracionFacturacionPageGQL } from '../graphql/getHistorialConfiguracionFacturacionPage';

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
    private getHistorialPageGQL: GetHistorialConfiguracionFacturacionPageGQL
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

  /** sucursalId null = todo; -1 = solo la global. Más reciente primero, por páginas y con el total. */
  onGetHistorialPage(sucursalId: number, page: number, size: number): Observable<PageInfo<ConfiguracionFacturacionHistorial>> {
    return this.genericCrudService.onCustomQuery(this.getHistorialPageGQL, { sucursalId, page, size }, true);
  }
}
