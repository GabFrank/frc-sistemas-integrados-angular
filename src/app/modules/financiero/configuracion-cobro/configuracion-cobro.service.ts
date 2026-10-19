import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { ConfiguracionCobro, ConfiguracionCobroInput } from './configuracion-cobro.model';
import { GetConfiguracionCobroGQL } from './graphql/getConfiguracionCobro';
import { GetConfiguracionCobroPdvGQL } from './graphql/getConfiguracionCobroPdv';
import { SaveConfiguracionCobroGQL } from './graphql/saveConfiguracionCobro';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionCobroService {

  constructor(
    private genericCrudService: GenericCrudService,
    private getConfiguracionGQL: GetConfiguracionCobroGQL,
    private getConfiguracionPdvGQL: GetConfiguracionCobroPdvGQL,
    private saveConfiguracionGQL: SaveConfiguracionCobroGQL
  ) { }

  /**
   * La del cobro, contra el filial. Apollo directo y no GenericCrudService: ese muestra «Ups! Algo
   * salió mal» ante cualquier error, y un filial que todavía no tiene la query se lo mostraría al
   * cajero en cada cobro. El error se propaga: quien llama se queda con el tope del 20%.
   */
  onGetConfiguracionPdv(): Observable<ConfiguracionCobro> {
    return this.getConfiguracionPdvGQL
      .fetch({}, { fetchPolicy: 'no-cache', errorPolicy: 'none', context: { clientName: null } })
      .pipe(map((res: any) => res?.data?.data ?? null));
  }

  /** La del diálogo, contra el central. Mismo motivo: un central sin la query no debe mostrar «Ups». */
  onGetConfiguracion(): Observable<ConfiguracionCobro> {
    return this.getConfiguracionGQL
      .fetch({}, { fetchPolicy: 'no-cache', errorPolicy: 'none', context: { clientName: 'servidor' } })
      .pipe(map((res: any) => res?.data?.data ?? null));
  }

  onSaveConfiguracion(input: ConfiguracionCobroInput): Observable<ConfiguracionCobro> {
    return this.genericCrudService.onSave(this.saveConfiguracionGQL, input, null, null, true, undefined, undefined,
      { avisarExito: false });
  }
}
