import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { AllMaletinsGQL } from './graphql/allMaletines';
import { DeleteMaletinGQL } from './graphql/deleteMaletin';
import { MaletinByIdGQL } from './graphql/MaletinById';
import { MaletinPorDescripcionGQL } from './graphql/maletinPorDescripcion';
import { SaveMaletinGQL } from './graphql/saveMaletin';
import { MaletinInput } from './maletin.model';

@Injectable({
  providedIn: 'root'
})
export class MaletinService {

  constructor(
    private getAllMaletines: AllMaletinsGQL,
    private getMaletinPorId: MaletinByIdGQL,
    private genericCrud: GenericCrudService,
    private saveMaletin: SaveMaletinGQL,
    private deleteMaletin: DeleteMaletinGQL,
    private getMaletinPorDescripcion: MaletinPorDescripcionGQL
  ) { }

  onGetAll(): Observable<any>{
    return this.genericCrud.onGetAll(this.getAllMaletines)
  }

  onGetPorId(id): Observable<any>{
    return this.genericCrud.onGetById(this.getMaletinPorId, id)
  }

  onGetPorDescripcion(texto): Observable<any>{
    return this.genericCrud.onGetByTexto(this.getMaletinPorDescripcion, texto)
  }

  onSave(input: MaletinInput): Observable<any>{
    return this.genericCrud.onSave(this.saveMaletin, input)
  }

  onDelete(id): Observable<any>{
    return this.genericCrud.onDelete(this.deleteMaletin, id, 'Maletin', `Id: ${id}`)
  }

}
