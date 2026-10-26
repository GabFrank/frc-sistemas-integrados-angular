import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { ConfiguracionIa } from './configuracion-ia.model';
import { ConfiguracionIaGQL } from './graphql/configuracionIa';
import { GuardarConfiguracionIaGQL } from './graphql/guardarConfiguracionIa';
import { ProbarConexionIaGQL } from './graphql/probarConexionIa';

@Injectable({
  providedIn: 'root',
})
export class InteligenciaArtificialService {
  constructor(
    private genericService: GenericCrudService,
    private configuracionIaGQL: ConfiguracionIaGQL,
    private guardarConfiguracionIaGQL: GuardarConfiguracionIaGQL,
    private probarConexionIaGQL: ProbarConexionIaGQL,
  ) {}

  obtener(): Observable<ConfiguracionIa> {
    return this.genericService.onCustomQuery(this.configuracionIaGQL, {}, true);
  }

  /** apiKey null = no cambia la clave, "" = la borra. */
  guardar(apiKey: string | null, modelo: string, promptAdicional: string): Observable<ConfiguracionIa> {
    return this.genericService.onCustomMutation(
      this.guardarConfiguracionIaGQL,
      { apiKey, modelo, promptAdicional },
      true,
    );
  }

  probarConexion(): Observable<string> {
    return this.genericService.onCustomMutation(this.probarConexionIaGQL, {}, true);
  }
}
