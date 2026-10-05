import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { ConfiguracionVentaTarjeta, ConfiguracionVentaTarjetaInput } from './configuracion-venta-tarjeta.model';
import { GetConfiguracionVentaTarjetaGQL } from '../graphql/getConfiguracionVentaTarjeta';
import { SaveConfiguracionVentaTarjetaGQL } from '../graphql/saveConfiguracionVentaTarjeta';
import { GetTerminalObligatoriaVentaTarjetaGQL } from '../graphql/getTerminalObligatoriaVentaTarjeta';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionVentaTarjetaService {

  constructor(
    private genericCrudService: GenericCrudService,
    private getConfiguracionGQL: GetConfiguracionVentaTarjetaGQL,
    private saveConfiguracionGQL: SaveConfiguracionVentaTarjetaGQL,
    private terminalObligatoriaGQL: GetTerminalObligatoriaVentaTarjetaGQL
  ) { }

  onGetConfiguracion(servidor = true): Observable<ConfiguracionVentaTarjeta> {
    return this.genericCrudService.onCustomQuery(this.getConfiguracionGQL, {}, servidor);
  }

  /**
   * Si el PDV exige la terminal antes de cerrar una venta con tarjeta. `null` en la fila se lee como
   * `true`. Quien la usa decide qué hacer si la query falla (un servidor sin el campo): el PDV toma
   * `true`, el ABM esconde el toggle.
   */
  onGetTerminalObligatoria(servidor = true): Observable<boolean> {
    // Apollo directo y no GenericCrudService: ese muestra "Ups! Algo salió mal" ante cualquier
    // error de GraphQL, y un filial sin el campo se lo mostraría al cajero en cada cobro. Acá el
    // error NO se traga: se propaga para que quien llama decida (el PDV toma true).
    return this.terminalObligatoriaGQL
      .fetch({}, {
        fetchPolicy: 'no-cache',
        errorPolicy: 'none',
        context: { clientName: servidor ? 'servidor' : null },
      })
      .pipe(map((res: any) => res?.data?.data?.terminalObligatoria !== false));
  }

  onSaveConfiguracion(input: ConfiguracionVentaTarjetaInput, servidor = true): Observable<ConfiguracionVentaTarjeta> {
    return this.genericCrudService.onSave(this.saveConfiguracionGQL, input, null, null, servidor);
  }
}
