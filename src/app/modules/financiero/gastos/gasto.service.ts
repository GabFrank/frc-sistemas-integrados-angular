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
import { PageInfo } from '../../../app.component';
import { ConfiguracionService } from '../../../shared/services/configuracion.service';
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
    private filterGasto: FilterGastosGQL,
    private configService: ConfiguracionService
  ) { }

  // onGetAll(): Observable<any> {
  //   return this.genericService.onGetAll(this.getAllGastos);
  // }

  onSave(gasto: Gasto, servidor = true): Observable<Gasto> {
    return this.genericService.onSave(this.saveGasto, gasto.toInput(), this.configService?.getConfig()?.printers?.ticket, this.configService?.getConfig()?.local, servidor);
  }

  onGetByDate(inicio?: Date, fin?: Date, servidor = true): Observable<Gasto[]> {
    return this.genericService.onGetByFecha(this.gastosPorFecha, inicio, fin, servidor);
  }

  onGetById(id, servidor = true): Observable<Gasto> {
    return this.genericService.onGetById(this.gastoPorId, id, null, null, servidor);
  }

  onDelete(id, servidor = true): Observable<Gasto> {
    return this.genericService.onDelete(this.deleteGasto, id, null, null, null, servidor);
  }

  onGetByCajaId(id, servidor = true): Observable<Gasto[]> {
    return this.genericService.onGetById<Gasto[]>(this.gastoPorCajaId, id, null, null, servidor);
  }

  onReimprimir(id, servidor = true): Observable<boolean> {
    return this.genericService.onCustomQuery(this.reimprimirGasto, { id: id, printerName: this.configService?.getConfig()?.printers?.ticket }, servidor);
  }

  onSaveVuelto(data, servidor = true): Observable<Gasto> {
    return this.genericService.onSaveCustom(this.saveVuelto, data, servidor);
  }

  onFilterGasto(id?: number, cajaId?: number, sucId?: number, responsableId?: number, descripcion?: string, page?: number, size?: number, servidor = true): Observable<PageInfo<Gasto>> {
    return this.genericService.onCustomQuery(
      this.filterGasto, {
      id,
      cajaId,
      sucId,
      responsableId,
      descripcion,
      page,
      size
    }, servidor)
  }

}
