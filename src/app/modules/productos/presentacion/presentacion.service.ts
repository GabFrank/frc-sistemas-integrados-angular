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
    private saveImage: SaveImagenProductoGQL,
    private notificacionSnack: NotificacionSnackbarService,
    private dialogoService: DialogosService
  ) {}

  onGetPresentacionesPorProductoId(id){
    return this.getPresentacionesPorProductoId.fetch({
      id
    }, 
    {
      fetchPolicy: "no-cache"
    });
  }

  onGetPresentaciones() {
    return this.getPresentaciones.fetch(null, { fetchPolicy: "no-cache" });
  }

  onSavePresentacion(presentacionInput: PresentacionInput): Observable<any> {
    if(presentacionInput.descripcion == null){
      presentacionInput.descripcion = presentacionInput.cantidad.toString()
    }
    presentacionInput.usuarioId = this.mainService?.usuarioActual?.id;
    return this.savePresentacion.mutate({
        entity: presentacionInput,
      }, {
        errorPolicy: 'all'
      });
  }
  onDeletePresentacion(presentacion: Presentacion) : Observable<any>{
    return new Observable(obs => {
      this.dialogoService.confirm('Atención!!', 'Realmente deseas eliminar esta presentación?', 'Todos los códigos y precios también serán eliminados.', [`Descripción: ${presentacion.descripcion}`, `Cantidad: ${presentacion.cantidad}`]).subscribe(res => {
        if(res){
          this.deletePresentacion.mutate({
            id: presentacion.id,
          }, {
            fetchPolicy: 'no-cache',
            errorPolicy: 'all'
          }).subscribe(res => {
            if(res.errors == null){
              obs.next(res.data)
            } else {
              if(res.errors[0].message.includes('violates foreign key')){
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

  onImageSave(image: string, filename: string): Observable<any>{
    // return new Observable((obs) => {
      return new Observable<any>(obs => {
        this.saveImage.mutate({
          image,
          filename
        }).subscribe(res => {
          if(res.errors==null){
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

  onGetPresentacion(id: number){
    return this.getPresentacion.fetch({
      id
    }, {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all'
    })
  }
}
