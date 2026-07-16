import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
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

  onGetConfiguracion(servidor = true): Observable<ConfiguracionFacturaConVenta> {
    return this.genericCrudService.onCustomQuery(this.getConfiguracionGQL, {}, servidor);
  }

  onSaveConfiguracion(input: ConfiguracionFacturaConVentaInput, servidor = true): Observable<ConfiguracionFacturaConVenta> {
    return this.genericCrudService.onSave(this.saveConfiguracionGQL, input, null, null, servidor);
  }
}
