import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { Gasto } from './gastos.model';
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
    private saveGasto: SaveGastoGQL,
    private gastoPorId: GastoPorIdGQL,
    private deleteGasto: DeleteGastoGQL
  ) { }

  // onGetAll(): Observable<any> {
  //   return this.genericService.onGetAll(this.getAllGastos);
  // }

  onSave(gasto: Gasto){
    return this.genericService.onSaveConDetalle(this.saveGasto, gasto.toInput(), gasto.toDetalleInputList())
  }

  onGetByDate(inicio?: Date, fin?: Date): Observable<any>{
    return this.genericService.onGetByFecha(this.gastosPorFecha, inicio, fin);
  }

  onGetById(id): Observable<any>{
    return this.genericService.onGetById(this.gastoPorId, id);
  }

  onDelete(id): Observable<any>{
    return this.genericService.onDelete(this.deleteGasto, id);
  }}
