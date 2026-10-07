import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ContextoConsulta, GenericCrudService, PROPAGAR_ERROR_DE_RED } from '../../../../generics/generic-crud.service';
import { ConfiguracionFacturaConVenta, ConfiguracionFacturaConVentaInput } from './configuracion-factura-con-venta.model';
import { GetConfiguracionFacturaConVentaGQL } from '../graphql/getConfiguracionFacturaConVenta';
import { SaveConfiguracionFacturaConVentaGQL } from '../graphql/saveConfiguracionFacturaConVenta';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionFacturaConVentaService {

  constructor(
    private genericCrudService: GenericCrudService,
    private getConfiguracionGQL: GetConfiguracionFacturaConVentaGQL,
    private saveConfiguracionGQL: SaveConfiguracionFacturaConVentaGQL
  ) { }

  /**
   * Todos los que la llaman manejan el error de red (#390): el cobro bloquea lo afectado y el ABM
   * deja de quedar cargando. `contexto` es para el cobro del POS; el ABM no lo pasa.
   */
  onGetConfiguracion(servidor = true, contexto?: ContextoConsulta): Observable<ConfiguracionFacturaConVenta> {
    return this.genericCrudService.onCustomQuery(this.getConfiguracionGQL, {}, servidor, PROPAGAR_ERROR_DE_RED, undefined, contexto);
  }

  onSaveConfiguracion(input: ConfiguracionFacturaConVentaInput, servidor = true): Observable<ConfiguracionFacturaConVenta> {
    return this.genericCrudService.onSave(this.saveConfiguracionGQL, input, null, null, servidor);
  }
}
