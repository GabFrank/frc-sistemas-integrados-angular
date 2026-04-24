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

  onCount(servidor: boolean = true): Observable<number> {
    return this.genericCrud.onCustomQuery(this.countMaletin, null, servidor);
  }

  onGetAll(page?, size?, servidor: boolean = true): Observable<any>{
    return this.genericCrud.onGetAll(this.getAllMaletines, page, size, servidor)
  }

  onGetPorId(id, sucursalId, servidor: boolean = true): Observable<any>{
    return this.genericCrud.onCustomQuery(this.getMaletinPorId, {id, sucursalId}, servidor)
  }

  onGetPorDescripcion(texto, servidor: boolean = true): Observable<any>{
    return this.genericCrud.onGetByTexto(this.getMaletinPorDescripcion, texto, servidor)
  }

  onSave(input: MaletinInput, servidor: boolean = true): Observable<any>{
    return this.genericCrud.onSave(this.saveMaletin, input, null, null, servidor)
  }

  onDelete(id, servidor: boolean = true): Observable<any>{
    return this.genericCrud.onDelete(this.deleteMaletin, id, '¿Eliminar maletin?', null, true, servidor, "¿Está seguro que desea eliminar este maletin?");
  }

}
