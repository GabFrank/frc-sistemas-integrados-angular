import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { ConfiguracionService } from '../../../../shared/services/configuracion.service';
import { PageInfo } from '../../../../app.component';
import { Gasto } from '../models/gastos.model';
import { PreGasto } from '../models/pre-gasto.model';
import { DeleteGastoGQL } from '../graphql/deleleGasto';
import { FilterGastosGQL } from '../graphql/filterGastos';
import { GastoPorCajaIdGQL } from '../graphql/gastoPorCajaId';
import { GastoPorIdGQL } from '../graphql/gastoPorId';
import { GastosPorFechaGQL } from '../graphql/gastosPorFecha';
import { ReimprimirGastoGQL } from '../graphql/reimprimirGasto';
import { SaveGastoGQL } from '../graphql/saveGasto';
import { SaveVueltoGastoGQL } from '../graphql/saveVuelto';
import { AutorizarPreGastoGQL } from '../graphql/autorizarPreGasto';
import { PreGastoPorIdGQL } from '../graphql/preGastoPorId';
import { PreGastosGQL } from '../graphql/preGastos';
import { RechazarPreGastoGQL } from '../graphql/rechazarPreGasto';
import { SavePreGastoGQL } from '../graphql/savePreGasto';
import { TramitarPreGastoGQL } from '../graphql/tramitarPreGasto';
import { ImprimirPreGastoGQL } from '../graphql/imprimirPreGasto';
import { AllTipoGastosGQL } from '../graphql/AllTipoGastos';
import { DeleteTipoGastoGQL } from '../graphql/deleleTipoGasto';
import { FilterPreGastosGQL } from '../graphql/filterPreGastos';
import { RootTipoGastosGQL } from '../graphql/rootTipoGasto';
import { SaveTipoGastoGQL } from '../graphql/saveTipoGasto';
import { TipoGastoPorIdGQL } from '../graphql/tipoGastoPorId';
import { TipoGastoSearchGQL } from '../graphql/tipoGastosSearch';
import { FilterTipoGastosGQL } from '../graphql/filterTipoGastos';
import { TipoGasto } from '../models/tipo-gasto.model';

@Injectable({
  providedIn: 'root'
})
export class GastoService {

  constructor(
    private genericService: GenericCrudService,
    private configService: ConfiguracionService,
    private gastosPorFecha: GastosPorFechaGQL,
    private saveGasto: SaveGastoGQL,
    private gastoPorId: GastoPorIdGQL,
    private deleteGasto: DeleteGastoGQL,
    private gastoPorCajaId: GastoPorCajaIdGQL,
    private reimprimirGasto: ReimprimirGastoGQL,
    private saveVuelto: SaveVueltoGastoGQL,
    private filterGasto: FilterGastosGQL,
    private getPreGastos: PreGastosGQL,
    private preGastoPorId: PreGastoPorIdGQL,
    private onSavePreGasto: SavePreGastoGQL,
    private autorizarGQL: AutorizarPreGastoGQL,
    private rechazarGQL: RechazarPreGastoGQL,
    private tramitarGQL: TramitarPreGastoGQL,
    private filterPreGastosGQL: FilterPreGastosGQL,
    private imprimirPreGastoGQL: ImprimirPreGastoGQL,
    private getAllTipoGastos: AllTipoGastosGQL,
    private getRootTipoGasto: RootTipoGastosGQL,
    private onSaveTipoGasto: SaveTipoGastoGQL,
    private tipoGastoPorId: TipoGastoPorIdGQL,
    private deleteTipoGasto: DeleteTipoGastoGQL,
    private tipoGastoSearch: TipoGastoSearchGQL,
    private filterTipoGastosGQL: FilterTipoGastosGQL
  ) { }
  onSave(gasto: Gasto, servidor = true): Observable<Gasto> {
    let gastoAux = gasto;
    if (!(gasto instanceof Gasto)) {
      gastoAux = new Gasto();
      Object.assign(gastoAux, gasto);
    }
    return this.genericService.onSave(this.saveGasto, gastoAux.toInput(), this.configService?.getConfig()?.printers?.ticket, this.configService?.getConfig()?.local, servidor);
  }

  onGetByDate(inicio?: Date, fin?: Date, servidor = true): Observable<Gasto[]> {
    return this.genericService.onGetByFecha(this.gastosPorFecha, inicio, fin, servidor);
  }

  onGetById(id: number, servidor = true): Observable<Gasto> {
    return this.genericService.onGetById(this.gastoPorId, id, null, null, servidor);
  }

  onDelete(id: number, servidor = true): Observable<Gasto> {
    return this.genericService.onDelete(this.deleteGasto, id, null, null, null, servidor);
  }

  onGetByCajaId(id: number, servidor = true): Observable<Gasto[]> {
    return this.genericService.onGetById<Gasto[]>(this.gastoPorCajaId, id, null, null, servidor);
  }

  onReimprimir(id: number, servidor = true): Observable<boolean> {
    return this.genericService.onCustomQuery(this.reimprimirGasto, { id: id, printerName: this.configService?.getConfig()?.printers?.ticket }, servidor);
  }

  onSaveVuelto(data: any, servidor = true): Observable<Gasto> {
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
  preGastoListarPorEstado(estado?: string, sucId?: number): Observable<PreGasto[]> {
    return this.genericService.onCustomQuery(this.getPreGastos, { estado, sucId });
  }

  preGastoFilter(estado?: string, inicio?: string, fin?: string, page?: number, size?: number): Observable<PageInfo<PreGasto>> {
    return this.genericService.onCustomQuery(this.filterPreGastosGQL, {
      estado,
      inicio,
      fin,
      page,
      size
    });
  }

  preGastoObtenerPorId(id: number, sucId?: number): Observable<PreGasto> {
    return this.genericService.onGetById(this.preGastoPorId, id, null, null, true, { id, sucId });
  }

  preGastoGuardar(input: unknown): Observable<PreGasto> {
    return this.genericService.onSave(this.onSavePreGasto, input);
  }

  preGastoAutorizar(id: number, autorizadorId: number, sucId?: number): Observable<PreGasto> {
    return this.genericService.onCustomMutation(this.autorizarGQL, { id, autorizadorId, sucId });
  }

  preGastoRechazar(id: number, motivo: string, sucId?: number): Observable<PreGasto> {
    return this.genericService.onCustomMutation(this.rechazarGQL, { id, motivo, sucId });
  }

  preGastoTramitar(id: number, sucId?: number): Observable<PreGasto> {
    return this.genericService.onCustomMutation(this.tramitarGQL, { id, sucId });
  }

  preGastoImprimir(id: number, sucId?: number): Observable<string> {
    return this.genericService.onCustomQuery(this.imprimirPreGastoGQL, { id, sucId });
  }

  tipoGastoOnGetAll(servidor = true): Observable<any> {
    return this.genericService.onGetAll(this.getAllTipoGastos, null, null, servidor);
  }

  tipoGastoOnGetRoot(servidor = true): Observable<any> {
    return this.genericService.onGetAll(this.getRootTipoGasto, null, null, servidor);
  }

  tipoGastoOnSave(input: any, servidor = true): Observable<any> {
    return this.genericService.onSave(this.onSaveTipoGasto, input, null, null, servidor);
  }

  tipoGastoOnGetById(id: number, servidor = true): Observable<any> {
    return this.genericService.onGetById(this.tipoGastoPorId, id, null, null, servidor);
  }

  tipoGastoOnDelete(id: number, servidor = true): Observable<any> {
    return this.genericService.onDelete(this.deleteTipoGasto, id, "¿Eliminar tipo de gasto?", null, true, servidor, "¿Está seguro que desea eliminar este tipo de gasto?");
  }

  tipoGastoOnSearch(texto: string, servidor = true): Observable<any> {
    return this.genericService.onGetByTexto(this.tipoGastoSearch, texto, servidor);
  }

  tipoGastoFilter(naturaleza?: string, texto?: string, page?: number, size?: number): Observable<PageInfo<TipoGasto>> {
    return this.genericService.onCustomQuery(this.filterTipoGastosGQL, {
      naturaleza,
      texto,
      page,
      size
    });
  }

}
