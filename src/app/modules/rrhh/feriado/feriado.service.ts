import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { FeriadosGQL } from './graphql/Feriados';
import { FeriadosPageGQL } from './graphql/FeriadosPage';
import { SaveFeriadoGQL } from './graphql/SaveFeriado';
import { DeleteFeriadoGQL } from './graphql/DeleteFeriado';
import { Feriado } from './feriado.model';

@Injectable({ providedIn: 'root' })
export class FeriadoService {

  constructor(
    private genericService: GenericCrudService,
    private feriadosGQL: FeriadosGQL,
    private feriadosPageGQL: FeriadosPageGQL,
    private saveFeriadoGQL: SaveFeriadoGQL,
    private deleteFeriadoGQL: DeleteFeriadoGQL
  ) { }

  onGetAll(servidor = true): Observable<any> {
    return this.genericService.onGetAll(this.feriadosGQL, 0, 500, servidor);
  }

  /** Padron del SaaS: lista paginada y filtrada en el backend. */
  onGetPage(page: number, size: number, desde?: string, hasta?: string,
            descripcion?: string, activo?: boolean, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.feriadosPageGQL,
      { page, size, desde, hasta, descripcion, activo }, servidor);
  }

  onSave(input: any, servidor = true): Observable<Feriado> {
    return this.genericService.onSave<Feriado>(this.saveFeriadoGQL, input, null, null, servidor);
  }

  onDelete(id: number, servidor = true): Observable<any> {
    return this.genericService.onDelete(this.deleteFeriadoGQL, id, null, null, false, servidor);
  }
}
