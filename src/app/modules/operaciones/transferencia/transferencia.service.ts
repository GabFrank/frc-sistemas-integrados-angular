import { MainService } from './../../../main.service';
import { PrepararTransferenciaGQL } from './graphql/prepararTransferencia';
import { GetTransferenciaPorFechaGQL } from './graphql/getTransferenciaPorFecha';
import { NotificacionSnackbarService, NotificacionColor } from './../../../notificacion-snackbar.service';
import { DialogosService } from './../../../shared/components/dialogos/dialogos.service';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { FinalizarTransferenciaGQL } from './graphql/finalizarTransferencia';
import { DeleteTransferenciaItemGQL } from './graphql/deleteTransferenciaItem';
import { SaveTransferenciaItemGQL } from './graphql/saveTransferenciaItem';
import { SaveTransferenciaGQL } from './graphql/saveTransferencia';
import { Observable, tap } from 'rxjs';
import { GetTransferenciaGQL } from './graphql/getTransferencia';
import { GenericCrudService } from './../../../generics/generic-crud.service';
import { Injectable } from '@angular/core';
import { EtapaTransferencia, Transferencia, TransferenciaEstado, TransferenciaItem, TransferenciaInput, TipoTransferencia, HojaRuta, Acompanhante, AcompanhanteInput, HojaRutaInput } from './transferencia.model';
import { DeleteTransferenciaGQL } from './graphql/deleteTransferencia';
import { GetTransferenciasPorUsuarioGQL } from './graphql/getTransferenciasPorUsuario';
import { GetTransferenciasWithFilterGQL } from './graphql/getTransferenciasWithFilter';
import { ImprimirTransferenciaGQL } from './graphql/imprimirTransferencia';
import { ReporteService } from '../../reportes/reporte.service';
import { TabService } from '../../../layouts/tab/tab.service';
import { Tab } from '../../../layouts/tab/tab.model';
import { ListProductoComponent } from '../../productos/producto/list-producto/list-producto.component';
import { ReportesComponent } from '../../reportes/reportes/reportes.component';
import { PageInfo } from '../../../app.component';
import { GetTransferenciaItemGQL } from './graphql/getTransferenciaItem';
import { GetTransferenciaItensPorTransferenciaIdGQL } from './graphql/getTransferenciaItensPorTransferenciaIdWithFilter';
import { GetTransferenciaItensPorTransferenciaIdWithFilterGQL } from './graphql/getTransferenciaItensPorTransferenciaId';
import { ConfiguracionService } from '../../../shared/services/configuracion.service';
import { GetHojaRutaGQL } from './graphql/getHojaRuta';
import { GetHojaRutaListGQL } from './graphql/getHojaRutaList';
import { GetHojaRutaPorVehiculoGQL } from './graphql/getHojaRutaPorVehiculo';
import { GetHojaRutaPorChoferGQL } from './graphql/getHojaRutaPorChofer';
import { GetHojaRutaActivaPorVehiculoGQL } from './graphql/getHojaRutaActivaPorVehiculo';
import { SaveHojaRutaGQL } from './graphql/saveHojaRuta';
import { DeleteHojaRutaGQL } from './graphql/deleteHojaRuta';
import { GetAcompanhantesPorHojaRutaGQL } from './graphql/getAcompanhantesPorHojaRuta';
import { SaveAcompanhanteGQL } from './graphql/saveAcompanhante';
import { DeleteAcompanhanteGQL } from './graphql/deleteAcompanhante';
import { GetHojasRutaConEntregasGQL } from './graphql/getHojasRutaConEntregas';
import { GetTransferenciasPorHojaRutaGQL } from './graphql/getTransferenciasPorHojaRuta';
import { Persona } from '../../personas/persona/persona.model';
import { GetHojaRutaPorFechaGQL } from './graphql/getHojaRutaPorFecha';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: 'root'
})
export class TransferenciaService {

  constructor(private genericCrudService: GenericCrudService,
    private getTransferencia: GetTransferenciaGQL,
    private saveTransferencia: SaveTransferenciaGQL,
    private deleteTransfencia: DeleteTransferenciaGQL,
    private saveTransferenciaItem: SaveTransferenciaItemGQL,
    private deleteTransferenciaItem: DeleteTransferenciaItemGQL,
    private finalizarTransferencia: FinalizarTransferenciaGQL,
    private prepararTransferencia: PrepararTransferenciaGQL,
    private dialogoService: DialogosService,
    private notificacionService: NotificacionSnackbarService,
    private getTransferenciasPorFecha: GetTransferenciaPorFechaGQL,
    private mainService: MainService,
    private transferenciaItemPorTransferenciaId: GetTransferenciaItensPorTransferenciaIdGQL,
    private transferenciaItemPorTransferenciaIdWithFilter: GetTransferenciaItensPorTransferenciaIdWithFilterGQL,
    private transferenciasPorUsuario: GetTransferenciasPorUsuarioGQL,
    private getTransferenciasWithFiler: GetTransferenciasWithFilterGQL,
    private imprimirTransferencia: ImprimirTransferenciaGQL,
    private reporteService: ReporteService,
    private tabService: TabService,
    private getTransferenciaItem: GetTransferenciaItemGQL,
    private configService: ConfiguracionService,
    private getHojaRuta: GetHojaRutaGQL,
    private getHojaRutaList: GetHojaRutaListGQL,
    private getHojaRutaPorVehiculo: GetHojaRutaPorVehiculoGQL,
    private getHojaRutaPorChofer: GetHojaRutaPorChoferGQL,
    private getHojaRutaActivaPorVehiculo: GetHojaRutaActivaPorVehiculoGQL,
    private saveHojaRutaService: SaveHojaRutaGQL,
    private deleteHojaRuta: DeleteHojaRutaGQL,
    private getAcompanhantesPorHojaRuta: GetAcompanhantesPorHojaRutaGQL,
    private saveAcompanhante: SaveAcompanhanteGQL,
    private deleteAcompanhante: DeleteAcompanhanteGQL,
    private getHojasRutaConEntregas: GetHojasRutaConEntregasGQL,
    private getTransferenciasPorHojaRuta: GetTransferenciasPorHojaRutaGQL,
    private getHojaRutaPorFecha: GetHojaRutaPorFechaGQL
  ) { }

  onImprimirTransferencia(id, ticket?, servidor = true) {
    this.genericCrudService.onCustomQuery(this.imprimirTransferencia, {
      id: id,
      ticket: ticket,
      printerName: this.configService?.getConfig()?.printers?.ticket,
      servidor: servidor
    }).subscribe(res => {
      if (res != null) {
        this.reporteService.onAdd('Transferencia ' + id, res)
        this.tabService.addTab(new Tab(ReportesComponent, 'Reportes', null, ListProductoComponent))
      }
    })
  }

  onGetTrasferenciasPorFecha(inicio, fin, servidor = true) {
    return this.genericCrudService.onGetByFecha(this.getTransferenciasPorFecha, inicio, fin, servidor);
  }

  onGetHojaRutaPorFecha(inicio, fin, servidor = true): Observable<HojaRuta[]> {
    return this.genericCrudService.onGetByFecha(this.getHojaRutaPorFecha, inicio, fin, servidor);
  }


  onGetTrasnferenciasPorUsuario(id, servidor = true): Observable<Transferencia[]> {
    return this.genericCrudService.onGetById(this.transferenciasPorUsuario, id, servidor);
  }


  onGetTransferencia(id, servidor = true): Observable<Transferencia> {
    return this.genericCrudService.onGetById(this.getTransferencia, id, null, null, servidor);
  }

  onGetTransferenciaItensPorTransferenciaId(id, page?, size?, servidor = true): Observable<PageInfo<TransferenciaItem>> {
    return this.genericCrudService.onGetById(this.transferenciaItemPorTransferenciaId, id, page, size, servidor);
  }

  onSaveTransferencia(input, responseOnError?: boolean, servidor = true): Observable<Transferencia> {
    input.usuarioPreTransferenciaId = this.mainService.usuarioActual.id;
    return this.genericCrudService.onSave(this.saveTransferencia, input, null, null, servidor, null, this.mainService.usuarioActual.id);
  }

  onDeleteTransferencia(id, servidor = true): Observable<boolean> {
    return this.genericCrudService.onDelete(this.deleteTransfencia, id, '¿Eliminar transferencia?', null, true, servidor, "¿Está seguro que desea eliminar esta transferencia?");
  }

  onSaveTransferenciaItem(input, precioCosto?: number, servidor = true): Observable<TransferenciaItem> {
    return this.genericCrudService.onSaveCustom(this.saveTransferenciaItem, { entity: input, precioCosto: precioCosto }, servidor);
  }

  onDeleteTransferenciaItem(id, servidor = true): Observable<boolean> {
    return this.genericCrudService.onDelete(this.deleteTransferenciaItem, id, '¿Eliminar item de transferencia?', null, true, servidor, "¿Está seguro que desea eliminar este item de transferencia?");
  }

  // onFinalizar(transferencia: Transferencia, servidor = true): Observable<boolean> {
  //   return new Observable(obs => {
  //     if (transferencia.estado == TransferenciaEstado.ABIERTA) {
  //       this.dialogoService.confirm('Realmente desea finalizar esta transferencia?', 'Una vez finalizada, la transferencia estara disponible para ser preparada').subscribe(res => {
  //         if (res) {
  //           return this.genericCrudService.onCustomMutation(this.finalizarTransferencia, {
  //             id: transferencia.id,
  //             usuarioId: this.mainService.usuarioActual.id
  //           }, servidor).pipe(untilDestroyed(this)).subscribe(res => {
  //             obs.next(res);
  //             obs.complete();
  //           })
  //         }
  //       })
  //     }
  //   })
  // }

  onAvanzarEtapa(transferencia: Transferencia, etapa: EtapaTransferencia, servidor = true): Observable<boolean> {
    let texto = ''
    // add etapa PRE_TRANSFERENCIA_CREACION
    if (etapa == EtapaTransferencia.PRE_TRANSFERENCIA_CREACION) {
      texto = 'Estas culminando la etapa de creación de transferencia, verifique con cuidado cada item';
    } else if (etapa == EtapaTransferencia.PRE_TRANSFERENCIA_ORIGEN) {
      texto = 'Estas iniciando la etapa de preparación de productos, verifique con cuidado cada item';
    } else if (etapa == EtapaTransferencia.PREPARACION_MERCADERIA) {
      texto = 'Estas iniciando la etapa de preparación de productos, verifique con cuidado cada item';
    } else if (etapa == EtapaTransferencia.PREPARACION_MERCADERIA_CONCLUIDA) {
      texto = 'Estas culminando la etapa de preparación de productos, aguardando transporte';
    } else if (etapa == EtapaTransferencia.TRANSPORTE_VERIFICACION) {
      texto = 'Estas iniciando la etapa de verificación de productos para su transporte';
    } else if (etapa == EtapaTransferencia.TRANSPORTE_EN_CAMINO) {
      texto = 'Estas iniciando la etapa de transporte de la sucursal de origen a sucursal de destino, al aceptar, se dara de baja en stock';
    } else if (etapa == EtapaTransferencia.TRANSPORTE_EN_DESTINO) {
      texto = 'Estas culminando la entrega de productos a la sucursal de destino, aguarde su verificación';
    } else if (etapa == EtapaTransferencia.RECEPCION_EN_VERIFICACION) {
      texto = 'Estas iniciando la etapa de recepción de productos, verifique con cuidado cada item';
    } else if (etapa == EtapaTransferencia.RECEPCION_CONCLUIDA) {
      texto = 'Estas culminando la etapa de recepción, al aceptar, las mercaderias van a ser cargadas en stock';
    }
    return new Observable<boolean>(obs => {
      this.dialogoService.confirm('Atención, revise los datos antes de proceder.', texto).subscribe(res => {
        if (res) {
          this.genericCrudService.onCustomMutation(this.prepararTransferencia, {
            id: transferencia.id,
            etapa,
            usuarioId: this.mainService.usuarioActual.id
          }, servidor).pipe(untilDestroyed(this)).subscribe(res => {
            console.log('res', res);
            obs.next(res);
            obs.complete();
          }, error => {
            obs.error(error);
            obs.complete();
          });
        } else {
          obs.next(false);
          obs.complete();
        }
      }, error => {
        obs.error(error);
        obs.complete();
      });
    });
  }

  onGetTransferenciasWithFilters(
    sucursalOrigenId?: number,
    sucursalDestinoId?: number,
    estado?: TransferenciaEstado,
    tipo?: TipoTransferencia,
    etapa?: EtapaTransferencia,
    isOrigen?: boolean,
    isDestino?: boolean,
    creadoDesde?: string,
    creadoHasta?: string,
    page?: number,
    size?: number,
    servidor = true): Observable<PageInfo<Transferencia>> {
    return this.genericCrudService.onCustomQuery(this.getTransferenciasWithFiler, {
      sucursalOrigenId,
      sucursalDestinoId,
      estado,
      tipo,
      etapa,
      isOrigen,
      isDestino,
      creadoDesde,
      creadoHasta,
      page,
      size
    }, servidor);
  }

  onGetTransferenciaItem(id: number, servidor = true): Observable<TransferenciaItem> {
    return this.genericCrudService.onGetById(this.getTransferenciaItem, id, null, null, servidor);
  }

  onGetTransferenciaItensPorTransferenciaIdWithFilter(id?, texto?, page?, size?, servidor = true) {
    return this.genericCrudService.onCustomQuery(this.transferenciaItemPorTransferenciaIdWithFilter, { id, name: texto, page, size }, servidor);
  }
  onGetHojaRuta(id: number, servidor = true): Observable<HojaRuta> {
    return this.genericCrudService.onGetById(this.getHojaRuta, id, null, null, servidor);
  }

  onGetHojaRutaList(page?, size?, servidor = true): Observable<PageInfo<HojaRuta>> {
    return this.genericCrudService.onCustomQuery(this.getHojaRutaList, { page, size }, servidor);
  }

  onGetHojaRutaPorVehiculo(vehiculoId: number, page?, size?, servidor = true): Observable<PageInfo<HojaRuta>> {
    return this.genericCrudService.onCustomQuery(this.getHojaRutaPorVehiculo, { vehiculoId, page, size }, servidor);
  }

  onGetHojaRutaPorChofer(choferId: number, page?, size?, servidor = true): Observable<PageInfo<HojaRuta>> {
    return this.genericCrudService.onCustomQuery(this.getHojaRutaPorChofer, { choferId, page, size }, servidor);
  }

  onGetHojaRutaActivaPorVehiculo(vehiculoId: number, servidor = true): Observable<HojaRuta> {
    return this.genericCrudService.onCustomQuery(this.getHojaRutaActivaPorVehiculo, { vehiculoId }, servidor);
  }

  onSaveHojaRuta(input: HojaRutaInput, servidor = true): Observable<HojaRuta> {
    return this.genericCrudService.onSave(this.saveHojaRutaService, input, null, null, servidor);
  }

  onDeleteHojaRuta(id: number, servidor = true): Observable<boolean> {
    return this.genericCrudService.onDelete(this.deleteHojaRuta, id, '¿Eliminar hoja de ruta?', null, true, servidor);
  }

  onGetAcompanhantesPorHojaRuta(hojaRutaId: number, servidor = true): Observable<Acompanhante[]> {
    return this.genericCrudService.onCustomQuery(this.getAcompanhantesPorHojaRuta, { hojaRutaId }, servidor);
  }

  onSaveAcompanhante(input: AcompanhanteInput, servidor = true): Observable<Acompanhante> {
    return this.genericCrudService.onSave(this.saveAcompanhante, input, null, null, servidor);
  }

  onDeleteAcompanhante(hojaRutaId: number, personaId: number, servidor = true): Observable<boolean> {
    return this.genericCrudService.onCustomMutation(this.deleteAcompanhante, { hojaRutaId, personaId }, servidor);
  }

  onGetHojasRutaConEntregas(page?: number, size?: number, servidor = true): Observable<HojaRuta[]> {
    return this.genericCrudService.onCustomQuery(this.getHojasRutaConEntregas, { page, size }, servidor);
  }

  onGetTransferenciasPorHojaRuta(hojaRutaId: number, page?: number, size?: number, servidor = true): Observable<Transferencia[]> {
    return this.genericCrudService.onCustomQuery(this.getTransferenciasPorHojaRuta, { hojaRutaId, page, size }, servidor, { networkError: { propagate: true } });
  }

}

