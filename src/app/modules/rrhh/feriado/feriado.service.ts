import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { FeriadosGQL } from './graphql/Feriados';
import { SaveFeriadoGQL } from './graphql/SaveFeriado';
import { DeleteFeriadoGQL } from './graphql/DeleteFeriado';
import { Feriado } from './feriado.model';

@Injectable({ providedIn: 'root' })
export class FeriadoService {

  constructor(
    private genericService: GenericCrudService,
    private feriadosGQL: FeriadosGQL,
    private saveFeriadoGQL: SaveFeriadoGQL,
    private deleteFeriadoGQL: DeleteFeriadoGQL
  ) { }

  onGetAll(servidor = true): Observable<any> {
    return this.genericService.onGetAll(this.feriadosGQL, 0, 500, servidor);
  }

  onSave(input: any, servidor = true): Observable<Feriado> {
    return this.genericService.onSave<Feriado>(this.saveFeriadoGQL, input, null, null, servidor);
  }

  onDelete(id: number, servidor = true): Observable<any> {
    return this.genericService.onDelete(this.deleteFeriadoGQL, id, null, null, false, servidor);
  }
}
