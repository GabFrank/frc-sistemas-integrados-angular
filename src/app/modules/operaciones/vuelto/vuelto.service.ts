import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { DeleteVueltoItemGQL } from './graphql/deleteVueltoItem';

@Injectable({
  providedIn: 'root'
})
export class VueltoService {

  constructor(
    private genericService: GenericCrudService,
    private deleteVueltoItem: DeleteVueltoItemGQL
  ) { }

  onDeleteVueltoItem(id): Observable<boolean> {
    return this.genericService.onDelete(this.deleteVueltoItem, id, 'item', 'Esta acción no se puede deshacer', true);
  }
}
