import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { ConfiguracionesRrhhGQL } from './graphql/ConfiguracionesRrhh';
import { ConfiguracionesRrhhSearchGQL } from './graphql/ConfiguracionesRrhhSearch';
import { SaveConfiguracionRrhhGQL } from './graphql/SaveConfiguracionRrhh';
import { DeleteConfiguracionRrhhGQL } from './graphql/DeleteConfiguracionRrhh';
import { ConfiguracionRrhh } from './configuracion-rrhh.model';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionRrhhService {

  constructor(
    private genericService: GenericCrudService,
    private configuracionesRrhhGQL: ConfiguracionesRrhhGQL,
    private configuracionesRrhhSearchGQL: ConfiguracionesRrhhSearchGQL,
    private saveConfiguracionRrhhGQL: SaveConfiguracionRrhhGQL,
    private deleteConfiguracionRrhhGQL: DeleteConfiguracionRrhhGQL
  ) { }

  onGetAll(servidor = true): Observable<any> {
    return this.genericService.onGetAll(this.configuracionesRrhhGQL, 0, 200, servidor);
  }

  onSearch(texto: string, servidor = true): Observable<any> {
    return this.genericService.onGetByTexto(this.configuracionesRrhhSearchGQL, texto, servidor);
  }

  onSave(input: any, servidor = true): Observable<ConfiguracionRrhh> {
    return this.genericService.onSave<ConfiguracionRrhh>(
      this.saveConfiguracionRrhhGQL, input, null, null, servidor
    );
  }

  onDelete(id: number, servidor = true): Observable<any> {
    return this.genericService.onDelete(this.deleteConfiguracionRrhhGQL, id, null, null, false, servidor);
  }
}
