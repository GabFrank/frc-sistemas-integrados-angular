import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { ConfiguracionService } from '../../../../shared/services/configuracion.service';
import { PageInfo } from '../../../../app.component';
import { Gasto } from '../models/gastos.model';
import { PreGasto } from '../models/pre-gasto.model';
import { FilterGastosGQL } from '../graphql/filterGastos';
import { GastoPorCajaIdGQL } from '../graphql/gastoPorCajaId';
import { ReimprimirGastoGQL } from '../graphql/reimprimirGasto';
import { SaveGastoGQL } from '../graphql/saveGasto';
import { SaveVueltoGastoGQL } from '../graphql/saveVuelto';
import { AutorizarPreGastoGQL } from '../graphql/autorizarPreGasto';
import { RechazarPreGastoGQL } from '../graphql/rechazarPreGasto';
import { SavePreGastoGQL } from '../graphql/savePreGasto';
import { TramitarPreGastoGQL } from '../graphql/tramitarPreGasto';
import { CompletarPreGastoGQL } from '../graphql/completarPreGasto';
import { ImprimirPreGastoGQL } from '../graphql/imprimirPreGasto';
import { EnviarPreGastoATesoreriaGQL } from '../graphql/enviarPreGastoATesoreria';
import { ImprimirSolicitudPagoGQL } from '../graphql/imprimirSolicitudPago';
import { AllTipoGastosGQL } from '../graphql/AllTipoGastos';
import { DeleteTipoGastoGQL } from '../graphql/deleleTipoGasto';
import { FilterPreGastosGQL } from '../graphql/filterPreGastos';
import { SaveTipoGastoGQL } from '../graphql/saveTipoGasto';
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
    private saveGasto: SaveGastoGQL,
    private gastoPorCajaId: GastoPorCajaIdGQL,
    private reimprimirGasto: ReimprimirGastoGQL,
    private saveVuelto: SaveVueltoGastoGQL,
    private filterGasto: FilterGastosGQL,
    private onSavePreGasto: SavePreGastoGQL,
    private autorizarGQL: AutorizarPreGastoGQL,
    private rechazarGQL: RechazarPreGastoGQL,
    private tramitarGQL: TramitarPreGastoGQL,
    private completarPreGastoGQL: CompletarPreGastoGQL,
    private filterPreGastosGQL: FilterPreGastosGQL,
    private imprimirPreGastoGQL: ImprimirPreGastoGQL,
    private getAllTipoGastos: AllTipoGastosGQL,
    private onSaveTipoGasto: SaveTipoGastoGQL,
    private deleteTipoGasto: DeleteTipoGastoGQL,
    private tipoGastoSearch: TipoGastoSearchGQL,
    private filterTipoGastosGQL: FilterTipoGastosGQL,
    private enviarATesoreriaGQL: EnviarPreGastoATesoreriaGQL,
    private imprimirSolicitudPagoGQL: ImprimirSolicitudPagoGQL
  ) { }

  onSave(gasto: Gasto, servidor = true): Observable<Gasto> {
    let gastoAux = gasto;
    if (!(gasto instanceof Gasto)) {
      gastoAux = new Gasto();
      Object.assign(gastoAux, gasto);
    }
    return this.genericService.onSave(this.saveGasto, gastoAux.toInput(), this.configService?.getConfig()?.printers?.ticket, this.configService?.getConfig()?.local, servidor);
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

  preGastoFilter(id?: number, estado?: string, inicio?: string, fin?: string, page?: number, size?: number): Observable<PageInfo<PreGasto>> {
    return this.genericService.onCustomQuery(this.filterPreGastosGQL, {
      id,
      estado,
      inicio,
      fin,
      page,
      size
    });
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

  preGastoCompletar(id: number, sucId?: number): Observable<PreGasto> {
    return this.genericService.onCustomMutation(this.completarPreGastoGQL, { id, sucId });
  }

  preGastoImprimir(id: number, sucId?: number): Observable<string> {
    return this.genericService.onCustomQuery(this.imprimirPreGastoGQL, { id, sucId });
  }

  preGastoEnviarATesoreria(id: number, sucId: number, usuarioId: number): Observable<PreGasto> {
    return this.genericService.onCustomMutation(this.enviarATesoreriaGQL, { id, sucId, usuarioId });
  }

  imprimirSolicitudPago(id: number): Observable<string> {
    return this.genericService.onCustomMutation(this.imprimirSolicitudPagoGQL, { id });
  }

  tipoGastoOnGetAll(servidor = true): Observable<any> {
    return this.genericService.onGetAll(this.getAllTipoGastos, null, null, servidor);
  }

  tipoGastoOnSave(input: any, servidor = true): Observable<any> {
    return this.genericService.onSave(this.onSaveTipoGasto, input, null, null, servidor);
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
