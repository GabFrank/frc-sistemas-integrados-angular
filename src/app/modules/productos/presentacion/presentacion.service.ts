import { GenericCrudService } from './../../../generics/generic-crud.service';
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { MainService } from "../../../main.service";
import { NotificacionColor, NotificacionSnackbarService } from "../../../notificacion-snackbar.service";
import { DialogosService } from "../../../shared/components/dialogos/dialogos.service";
import { FamiliaService } from "../familia/familia.service";
import { SaveImagenProductoGQL } from "../producto/graphql/saveImagenProducto";
import { AllPresentacionesQueryGQL } from "./graphql/allPresentacionesQuery";
import { DeletePresentacionGQL } from "./graphql/deletePresentacion";
import { PresentacionPorProductoIdGQL } from "./graphql/presentacionPorProductoId";
import { PresentacionQueryGQL } from "./graphql/presentacionQuery";
import { savePresentacionGQL } from "./graphql/savePresentacion";
import { Presentacion } from "./presentacion.model";
import { PresentacionInput } from "./presentacion.model-input";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SaveImagenPresentacionGQL } from './graphql/saveImagenPresentacion';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class PresentacionService {
  presentaciones: Presentacion[];
  // presentacionBS = new BehaviorSubject<Presentacion[]>(null);

  constructor(
    private getPresentacion: PresentacionQueryGQL,
    private getPresentaciones: AllPresentacionesQueryGQL,
    private savePresentacion: savePresentacionGQL,
    private deletePresentacion: DeletePresentacionGQL,
    private getPresentacionesPorProductoId: PresentacionPorProductoIdGQL,
    public mainService: MainService,
    private saveImage: SaveImagenPresentacionGQL,
    private notificacionSnack: NotificacionSnackbarService,
    private dialogoService: DialogosService,
    private genericService: GenericCrudService
  ) { }

  onGetPresentacionesPorProductoId(id): Observable<Presentacion[]>{
    return this.genericService.onGetById(this.getPresentacionesPorProductoId, id);
  }

  onGetPresentaciones() {
    return this.getPresentaciones.fetch(null, { fetchPolicy: "no-cache" });
  }

  onSavePresentacion(presentacionInput: PresentacionInput): Observable<any> {
    if (presentacionInput.descripcion == null) {
      presentacionInput.descripcion = presentacionInput.cantidad.toString()
    }
    presentacionInput.usuarioId = this.mainService?.usuarioActual?.id;
    return this.savePresentacion.mutate({
      entity: presentacionInput,
    }, {
      errorPolicy: 'all'
    });
  }
  onDeletePresentacion(presentacion: Presentacion): Observable<any> {
    return new Observable(obs => {
      this.dialogoService.confirm('Atención!!', 'Realmente deseas eliminar esta presentación?', 'Todos los códigos y precios también serán eliminados.', [`Descripción: ${presentacion.descripcion}`, `Cantidad: ${presentacion.cantidad}`]).pipe(untilDestroyed(this)).subscribe(res => {
        if (res) {
          this.deletePresentacion.mutate({
            id: presentacion.id,
          }, {
            fetchPolicy: 'no-cache',
            errorPolicy: 'all'
          }).pipe(untilDestroyed(this)).subscribe(res => {
            if (res.errors == null) {
              obs.next(res.data)
            } else {
              if (res.errors[0].message.includes('violates foreign key')) {
                // this.notificacionSnack.notification$.next({
                //   texto: 'No puedes eliminar una presentación que contenga'
                // })
              }
            }
          })
        }
      })
    })


  }

  onImageSave(image: string, filename: string): Observable<any> {
    // return new Observable((obs) => {
    return new Observable<any>(obs => {
      this.saveImage.mutate({
        image,
        filename
      }, { fetchPolicy: 'no-cache', errorPolicy: 'all' }).pipe(untilDestroyed(this)).subscribe(res => {
        if (res.errors == null) {
          // obs.next(res.data)
          this.notificacionSnack.notification$.next({
            texto: "Imagen guardada con éxito",
            color: NotificacionColor.success,
            duracion: 2
          })
          return obs.next(image)
        } else {
          this.notificacionSnack.notification$.next({
            texto: "Ups!! La imagen no se pudo guardar",
            color: NotificacionColor.danger,
            duracion: 2
          })
          return obs.next(null)
        }
      })
    })
    // })
  }

  onGetPresentacion(id: number) {
    return this.genericService.onGetById(this.getPresentacion, id)
  }

  async onGetPresentacionTest(id: number): Promise<Presentacion> {
    return new Promise((resolve, reject) => {
      this.genericService.onGetById(this.getPresentacion, id)
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          if (res != null) {
            return resolve(res as Presentacion)
          } else {
            return reject()
          }
        })
    })
  }
}
