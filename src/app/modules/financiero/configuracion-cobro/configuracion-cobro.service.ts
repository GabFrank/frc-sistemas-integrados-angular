import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { CONTEXTO_MOSTRADOR } from '../../../generics/generic-crud.constantes';
import { ConfiguracionCobro, ConfiguracionCobroInput } from './configuracion-cobro.model';
import { GetConfiguracionCobroGQL } from './graphql/getConfiguracionCobro';
import { GetConfiguracionCobroPdvGQL } from './graphql/getConfiguracionCobroPdv';
import { GetConfiguracionCobroPdvCompletaGQL } from './graphql/getConfiguracionCobroPdvCompleta';
import { SaveConfiguracionCobroGQL } from './graphql/saveConfiguracionCobro';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionCobroService {

  constructor(
    private genericCrudService: GenericCrudService,
    private getConfiguracionGQL: GetConfiguracionCobroGQL,
    private getConfiguracionPdvGQL: GetConfiguracionCobroPdvGQL,
    private getConfiguracionPdvCompletaGQL: GetConfiguracionCobroPdvCompletaGQL,
    private saveConfiguracionGQL: SaveConfiguracionCobroGQL
  ) { }

  /**
   * La del cobro, contra el filial. Apollo directo y no GenericCrudService: ese muestra «Ups! Algo
   * salió mal» ante cualquier error, y un filial que todavía no tiene la query se lo mostraría al
   * cajero en cada cobro. El error se propaga: quien llama se queda con el tope del 20% y sin tope de descuento.
   *
   * Primero pide también el tope del descuento; un filial sin ese campo rechaza la consulta, y entonces se
   * repite la de antes (solo el aumento): el descuento queda sin tope, que es lo de siempre.
   */
  onGetConfiguracionPdv(): Observable<ConfiguracionCobro> {
    // Corte de mostrador y sin aviso del link: el cobro no espera a esta consulta (rige el 20%).
    const opciones: any = { fetchPolicy: 'no-cache', errorPolicy: 'none', context: { clientName: null, ...CONTEXTO_MOSTRADOR } };
    const soloAumento = () => this.getConfiguracionPdvGQL
      .fetch({}, opciones)
      .pipe(map((res: any) => res?.data?.data ?? null));
    return this.getConfiguracionPdvCompletaGQL
      .fetch({}, opciones)
      .pipe(
        map((res: any) => res?.data?.data ?? null),
        catchError(() => soloAumento()),
      );
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
