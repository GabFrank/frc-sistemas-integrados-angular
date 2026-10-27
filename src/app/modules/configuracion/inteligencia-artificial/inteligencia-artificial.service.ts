import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { ConfiguracionIa, ConfiguracionIaInput, ProveedorIa } from './configuracion-ia.model';
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

  /** En las claves: null = no cambia, "" = la borra. */
  guardar(input: ConfiguracionIaInput): Observable<ConfiguracionIa> {
    return this.genericService.onCustomMutation(this.guardarConfiguracionIaGQL, input, true);
  }

  /** Prueba la clave guardada del proveedor indicado. */
  probarConexion(proveedor: ProveedorIa): Observable<string> {
    return this.genericService.onCustomMutation(this.probarConexionIaGQL, { proveedor }, true);
  }
}
