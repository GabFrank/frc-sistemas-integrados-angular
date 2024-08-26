import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { AllMaletinsGQL } from './graphql/allMaletines';
import { CountMaletinGQL } from './graphql/count-maletin';
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
    private getMaletinPorDescripcion: MaletinPorDescripcionGQL,
    private countMaletin: CountMaletinGQL
  ) { }

  onCount(): Observable<number> {
    return this.genericCrud.onCustomQuery(this.countMaletin, null);
  }

  onGetAll(page?, size?): Observable<any>{
    return this.genericCrud.onGetAll(this.getAllMaletines, page, size)
  }

  onGetPorId(id, sucursalId): Observable<any>{
    return this.genericCrud.onCustomQuery(this.getMaletinPorId, {id, sucursalId})
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
