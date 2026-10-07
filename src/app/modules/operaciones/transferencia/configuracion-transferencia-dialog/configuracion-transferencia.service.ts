import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService, PROPAGAR_ERROR_DE_RED, TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../../generics/generic-crud.service';
import { ConfiguracionTransferencia, ConfiguracionTransferenciaInput } from './configuracion-transferencia.model';
import { GetConfiguracionTransferenciaGQL } from '../graphql/getConfiguracionTransferencia';
import { SaveConfiguracionTransferenciaGQL } from '../graphql/saveConfiguracionTransferencia';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionTransferenciaService {

  constructor(
    private genericCrudService: GenericCrudService,
    private getConfiguracionGQL: GetConfiguracionTransferenciaGQL,
    private saveConfiguracionGQL: SaveConfiguracionTransferenciaGQL
  ) { }

  onGetConfiguracion(servidor = true): Observable<ConfiguracionTransferencia> {
    // Dos suscriptores, los dos con error: (el chequeo de stock de transferencias falla cerrado) (#390).
    return this.genericCrudService.onCustomQuery(this.getConfiguracionGQL, {}, servidor, PROPAGAR_ERROR_DE_RED, undefined,
      { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true });
  }

  onSaveConfiguracion(input: ConfiguracionTransferenciaInput, servidor = true): Observable<ConfiguracionTransferencia> {
    return this.genericCrudService.onSave(this.saveConfiguracionGQL, input, null, null, servidor);
  }
}
