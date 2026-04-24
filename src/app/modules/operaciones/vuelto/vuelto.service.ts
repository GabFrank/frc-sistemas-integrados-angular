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
    return this.genericService.onDelete(this.deleteVueltoItem, id, "¿Eliminar item de vuelto?", null, true, false, "¿Está seguro que desea eliminar este item de vuelto?");
  }
}
