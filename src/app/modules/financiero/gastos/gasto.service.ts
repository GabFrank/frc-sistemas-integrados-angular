import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { SaveVueltoGQL } from '../../operaciones/vuelto/graphql/saveVuelto';
import { Gasto } from './gastos.model';
import { DeleteGastoGQL } from './graphql/deleleGasto';
import { GastoPorCajaIdGQL } from './graphql/gastoPorCajaId';
import { GastoPorIdGQL } from './graphql/gastoPorId';
import { GastosPorFechaGQL } from './graphql/gastosPorFecha';
import { ReimprimirGastoGQL } from './graphql/reimprimirGasto';
import { SaveGastoGQL } from './graphql/saveGasto';
import { SaveVueltoGastoGQL } from './graphql/saveVuelto';
import { FilterGastosGQL } from './graphql/filterGastos';

@Injectable({
  providedIn: 'root'
})
export class GastoService {

  constructor(
    private genericService: GenericCrudService,
    private gastosPorFecha: GastosPorFechaGQL,
    private saveGasto: SaveGastoGQL,
    private gastoPorId: GastoPorIdGQL,
    private deleteGasto: DeleteGastoGQL,
    private gastoPorCajaId: GastoPorCajaIdGQL,
    private reimprimirGasto: ReimprimirGastoGQL,
    private saveVuelto: SaveVueltoGastoGQL,
    private filterGasto: FilterGastosGQL
  ) { }

  // onGetAll(): Observable<any> {
  //   return this.genericService.onGetAll(this.getAllGastos);
  // }

  onSave(gasto: Gasto): Observable<Gasto> {
    return this.genericService.onSave(this.saveGasto, gasto.toInput(), environment['printers']['ticket'], environment['local']);
  }

  onGetByDate(inicio?: Date, fin?: Date): Observable<Gasto[]> {
    return this.genericService.onGetByFecha(this.gastosPorFecha, inicio, fin);
  }

  onGetById(id): Observable<Gasto> {
    return this.genericService.onGetById(this.gastoPorId, id);
  }

  onDelete(id): Observable<Gasto> {
    return this.genericService.onDelete(this.deleteGasto, id);
  }

  onGetByCajaId(id): Observable<Gasto[]> {
    return this.genericService.onGetById<Gasto[]>(this.gastoPorCajaId, id);
  }

  onReimprimir(id): Observable<boolean> {
    return this.genericService.onCustomQuery(this.reimprimirGasto, { id: id, printerName: environment['printers']['ticket'] });
  }

  onSaveVuelto(data): Observable<Gasto> {
    return this.genericService.onSaveCustom(this.saveVuelto, data, false);
  }

  onFilterGasto(id?: number, cajaId?: number, sucId?: number, responsableId?: number, page?: number, size?: number): Observable<Gasto[]> {
    return this.genericService.onCustomQuery(
      this.filterGasto, {
      id,
      cajaId,
      sucId,
      responsableId,
      page,
      size
    }, true
    )
  }

}
