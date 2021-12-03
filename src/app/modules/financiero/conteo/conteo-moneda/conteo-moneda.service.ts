import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { DeleteConteoMonedaGQL } from './graphql/deleleConteoMoneda';
import { SaveConteoMonedaGQL } from './graphql/saveConteoMoneda';

@Injectable({
  providedIn: 'root'
})
export class ConteoMonedaService {

  constructor(
    private genericService: GenericCrudService,
    private onSaveConteoMoneda: SaveConteoMonedaGQL,
    private deleteConteoMoneda: DeleteConteoMonedaGQL
  ) { }

  onSave(input): Observable<any> {
    return this.genericService.onSave(this.onSaveConteoMoneda, input);
  }

  onDelete(id): Observable<any>{
    return this.genericService.onDelete(this.deleteConteoMoneda, id);
  }}
