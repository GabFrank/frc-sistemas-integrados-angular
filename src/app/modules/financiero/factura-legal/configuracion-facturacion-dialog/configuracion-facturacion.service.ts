import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { ConfiguracionFacturacion, ConfiguracionFacturacionInput } from './configuracion-facturacion.model';
import { GetConfiguracionesFacturacionGQL } from '../graphql/getConfiguracionesFacturacion';
import { SaveConfiguracionFacturacionGQL } from '../graphql/saveConfiguracionFacturacion';
import { DeleteConfiguracionFacturacionGQL } from '../graphql/deleteConfiguracionFacturacion';

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
    private deleteConfiguracionGQL: DeleteConfiguracionFacturacionGQL
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
}
