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
import { Observable } from 'rxjs';
import { GetTransferenciaGQL } from './graphql/getTransferencia';
import { GenericCrudService } from './../../../generics/generic-crud.service';
import { Injectable } from '@angular/core';
import { EtapaTransferencia, Transferencia, TransferenciaEstado, TransferenciaItem, TransferenciaInput, TipoTransferencia } from './transferencia.model';
import { DeleteTransferenciaGQL } from './graphql/deleteTransferencia';
import { GetTransferenciaItensPorTransferenciaIdGQL } from './graphql/getTransferenciaItensPorTransferenciaId';
import { GetTransferenciasPorUsuarioGQL } from './graphql/getTransferenciasPorUsuario';
import { GetTransferenciasWithFilterGQL } from './graphql/getTransferenciasWithFilter';

@UntilDestroy()
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
    private transferenciasPorUsuario: GetTransferenciasPorUsuarioGQL,
    private getTransferenciasWithFiler: GetTransferenciasWithFilterGQL
  ) { }

  onGetTrasferenciasPorFecha(inicio, fin) {
    return this.genericCrudService.onGetByFecha(this.getTransferenciasPorFecha, inicio, fin);
  }

  onGetTrasnferenciasPorUsuario(id): Observable<Transferencia[]> {
    return this.genericCrudService.onGetById(this.transferenciasPorUsuario, id)
  }


  onGetTransferencia(id): Observable<Transferencia> {
    return this.genericCrudService.onGetById(this.getTransferencia, id);
  }

  onGetTransferenciaItensPorTransferenciaId(id, page?, size?): Observable<TransferenciaItem[]> {
    return this.genericCrudService.onGetById(this.transferenciaItemPorTransferenciaId, id, page, size);
  }

  onSaveTransferencia(input): Observable<Transferencia> {
    input.usuarioPreTransferenciaId = this.mainService.usuarioActual.id;
    return this.genericCrudService.onSave(this.saveTransferencia, input);
  }

  onDeleteTransferencia(id): Observable<boolean> {
    return this.genericCrudService.onDelete(this.deleteTransfencia, id, 'Realmente  desea eliminar esta transferencia?')
  }

  onSaveTransferenciaItem(input): Observable<TransferenciaItem> {
    return this.genericCrudService.onSave(this.saveTransferenciaItem, input);
  }

  onDeleteTransferenciaItem(id): Observable<boolean> {
    return this.genericCrudService.onDelete(this.deleteTransferenciaItem, id, 'Realmente  desea eliminar este item')
  }

  onFinalizar(transferencia: Transferencia): Observable<boolean> {
    return new Observable(obs => {
      if (transferencia.estado == TransferenciaEstado.ABIERTA) {
        this.dialogoService.confirm('Realmente desea finalizar esta transferencia?', 'Una vez finalizada, la transferencia estara disponible para ser preparada').subscribe(res => {
          if (res) {
            this.finalizarTransferencia.mutate({
              id: transferencia.id,
              usuarioId: this.mainService.usuarioActual.id
            }, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
              .pipe(untilDestroyed(this))
              .subscribe(res => {
                if (res.errors == null) {
                  obs.next(true)
                  this.notificacionService.notification$.next({
                    texto: 'Transferencia finalizada con éxito',
                    color: NotificacionColor.success,
                    duracion: 3
                  })
                } else {
                  obs.next(false)
                  this.notificacionService.notification$.next({
                    texto: 'Atención, ocurrio un error al finalizar la transferencia.' + res.errors[0],
                    color: NotificacionColor.danger,
                    duracion: 3
                  })
                }
              })
          }
        })

      }
    })
  }

  onAvanzarEtapa(transferencia: Transferencia, etapa: EtapaTransferencia): Observable<boolean> {
    let texto = ''
    if (etapa == EtapaTransferencia.PRE_TRANSFERENCIA_ORIGEN) {
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
    return new Observable(obs => {
      this.dialogoService.confirm('Atención, revise los datos antes de proceder.', texto).subscribe(res => {
        if (res) {
          this.prepararTransferencia.mutate({
            id: transferencia.id,
            etapa,
            usuarioId: this.mainService.usuarioActual.id
          }, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
            .pipe(untilDestroyed(this))
            .subscribe(res => {
              if (res.errors == null) {
                obs.next(true)
                this.notificacionService.notification$.next({
                  texto: 'Transferencia guardada',
                  color: NotificacionColor.success,
                  duracion: 3
                })
              } else {
                obs.next(false)
                this.notificacionService.notification$.next({
                  texto: 'Atención, ocurrio un error: ' + res.errors[0],
                  color: NotificacionColor.danger,
                  duracion: 3
                })
              }
            })
        }
      })
    })
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
    size?: number) {
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
    });
  }
}

