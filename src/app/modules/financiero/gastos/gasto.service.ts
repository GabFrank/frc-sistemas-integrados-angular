import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { DeleteGastoGQL } from './graphql/deleleGasto';
import { GastoPorIdGQL } from './graphql/gastoPorId';
import { GastosPorFechaGQL } from './graphql/gastosPorFecha';
import { SaveGastoGQL } from './graphql/saveGasto';

@Injectable({
  providedIn: 'root'
})
export class GastoService {

  constructor(
    private genericService: GenericCrudService,
    private gastosPorFecha: GastosPorFechaGQL,
    private onSaveGasto: SaveGastoGQL,
    private gastoPorId: GastoPorIdGQL,
    private deleteGasto: DeleteGastoGQL
  ) { }

  // onGetAll(): Observable<any> {
  //   return this.genericService.onGetAll(this.getAllGastos);
  // }

  onGetByDate(inicio?: Date, fin?: Date): Observable<any>{
    return this.genericService.onGetByFecha(this.gastosPorFecha, inicio, fin);
  }

  onSave(input): Observable<any> {
    return this.genericService.onSave(this.onSaveGasto, input);
  }

  onGetById(id): Observable<any>{
    return this.genericService.onGetById(this.gastoPorId, id);
  }

  onDelete(id): Observable<any>{
    return this.genericService.onDelete(this.deleteGasto, id);
  }}
