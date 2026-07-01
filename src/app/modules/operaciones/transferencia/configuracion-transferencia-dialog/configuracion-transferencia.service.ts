import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
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
    return this.genericCrudService.onCustomQuery(this.getConfiguracionGQL, {}, servidor);
  }

  onSaveConfiguracion(input: ConfiguracionTransferenciaInput, servidor = true): Observable<ConfiguracionTransferencia> {
    return this.genericCrudService.onSave(this.saveConfiguracionGQL, input, null, null, servidor);
  }
}
