import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { ConfiguracionVentaTarjeta, ConfiguracionVentaTarjetaInput } from './configuracion-venta-tarjeta.model';
import { GetConfiguracionVentaTarjetaGQL } from '../graphql/getConfiguracionVentaTarjeta';
import { SaveConfiguracionVentaTarjetaGQL } from '../graphql/saveConfiguracionVentaTarjeta';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionVentaTarjetaService {

  constructor(
    private genericCrudService: GenericCrudService,
    private getConfiguracionGQL: GetConfiguracionVentaTarjetaGQL,
    private saveConfiguracionGQL: SaveConfiguracionVentaTarjetaGQL
  ) { }

  onGetConfiguracion(servidor = true): Observable<ConfiguracionVentaTarjeta> {
    return this.genericCrudService.onCustomQuery(this.getConfiguracionGQL, {}, servidor);
  }

  onSaveConfiguracion(input: ConfiguracionVentaTarjetaInput, servidor = true): Observable<ConfiguracionVentaTarjeta> {
    return this.genericCrudService.onSave(this.saveConfiguracionGQL, input, null, null, servidor);
  }
}
