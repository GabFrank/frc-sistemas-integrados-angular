import { Observable } from 'rxjs';
import { DeleteZonaGQL } from './graphql/deleteZona';
import { SaveZonaGQL } from './graphql/saveZona';
import { ZonasGQL } from './graphql/zonasQuery';
import { ZonaByIdGQL } from './graphql/zonaById';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { Injectable } from '@angular/core';
import { Zona } from './zona.model';

@Injectable({
  providedIn: 'root'
})
export class ZonaService {

  constructor(
    private genericCrud: GenericCrudService, 
    private getZona: ZonaByIdGQL,
    private getZonas: ZonasGQL,
    private saveZona: SaveZonaGQL,
    private deleteZona: DeleteZonaGQL
    ) { }

  onGetZona(id): Observable<Zona>{
    return this.genericCrud.onGetById(this.getZona, id);
  }

  onGetZonas(): Observable<Zona[]>{
    return this.genericCrud.onGetAll(this.getZonas);
  }

  onSaveZona(input): Observable<Zona>{
    return this.genericCrud.onSave(this.saveZona, input);
  }

  onDeleteZona(id): Observable<boolean>{
    return this.genericCrud.onDelete(this.deleteZona, id)
  }
}
