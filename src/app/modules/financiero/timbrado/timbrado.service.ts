import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { PageInfo } from '../../../app.component';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TimbradosGQL } from './graphql/timbradosQuery';
import { TimbradoByIdGQL } from './graphql/timbradoById';
import { SaveTimbradoGQL } from './graphql/saveTimbrado';
import { TimbradoSearchGQL } from './graphql/timbradoSearch';
import { SaveTimbradoDetalleGQL } from './graphql/saveTimbradoDetalle';
import { ExisteTimbradoActivoGQL } from './graphql/existeTimbradoActivo';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { FindByNumeroTimbradoGQL } from './graphql/findByNumeroTimbradoQuery';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { TimbradoDetallesByTimbradoIdGQL } from './graphql/timbradoDetallesByTimbradoId';
import { TimbradoDetallesBySucursalIdGQL } from './graphql/timbradoDetallesBySucursalId';
import { Timbrado, TimbradoInput, TimbradoDetalle, TimbradoDetallInput } from './timbrado.modal';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: 'root'
})
export class TimbradoService {

constructor(
  private matDialog: MatDialog,
  private getAllTimbrados: TimbradosGQL,
  private timbradoById: TimbradoByIdGQL,
  private saveTimbrado: SaveTimbradoGQL,
  private timbradoSearch: TimbradoSearchGQL,
  private genericService: GenericCrudService,
  private findByNumero: FindByNumeroTimbradoGQL,
  private saveTimbradoDetalle: SaveTimbradoDetalleGQL,
  private notificacionBar: NotificacionSnackbarService,
  private existeTimbradoActivoGQL: ExisteTimbradoActivoGQL,
  private timbradoDetallesByTimbradoIdGQL: TimbradoDetallesByTimbradoIdGQL,
    private timbradoDetallesBySucursalIdGQL: TimbradoDetallesBySucursalIdGQL,
) { }

  onGetTimbrado(id, servidor: boolean = true): Observable<Timbrado> {
    return this.genericService.onCustomQuery(this.timbradoById, {id}, servidor);
  }

  onGetAllTimbrados(servidor: boolean = true): Observable<Timbrado[]> {
    return this.genericService.onCustomQuery(this.getAllTimbrados, {}, servidor);
  }

  onSearchTimbrado(filtro: any, servidor : boolean= true): Observable<Timbrado[]> {
    return this.genericService.onCustomQuery(this.timbradoSearch, {filtro: filtro}, servidor);
  }
  
  onSaveTimbrado(input: TimbradoInput, servidor: boolean = true): Observable<any> {
    return this.genericService.onCustomMutation(this.saveTimbrado, {entity: input}, servidor);
  }
  
  onExisteTimbradoActivo(excludeId?: number, servidor: boolean = true): Observable<boolean> {
    return this.genericService.onCustomQuery(this.existeTimbradoActivoGQL, {excludeId}, servidor);
  }
    
  onSaveTimbradoDetalle(input: TimbradoDetallInput, servidor: boolean = true): Observable<any> {
    return this.genericService.onCustomMutation(this.saveTimbradoDetalle, {entity: input}, servidor);
  }
  
  onFindByNumero(numero, pageIndex: number, pageSize: number, servidor: boolean = true): Observable<PageInfo<Timbrado>> {
    return this.genericService.onCustomQuery(this.findByNumero, {numero, page: pageIndex, size: pageSize}, servidor);
  }
  onGetTimbradoDetallesByTimbradoId(timbradoId: number, pageIndex: number, pageSize: number, servidor: boolean = true): Observable<PageInfo<TimbradoDetalle>> {
    return this.genericService.onCustomQuery(this.timbradoDetallesByTimbradoIdGQL, {timbradoId, page: pageIndex, size: pageSize}, servidor);
  }

  onGetTimbradoDetallesBySucursalId(sucursalId: number, servidor: boolean = true): Observable<TimbradoDetalle[]> {
    return this.genericService.onCustomQuery(this.timbradoDetallesBySucursalIdGQL, {sucursalId}, servidor);
  }

}
