import { Injectable } from "@angular/core";
import { SaveProductoGQL } from "./graphql/saveProducto";
import { ProductoInput } from "./producto-input.model";
import { BehaviorSubject, Observable } from "rxjs";
import { Producto } from "./producto.model";
import { ProductoPorProveedorGQL } from "./graphql/productoPorProveedor";
import { ProductoPorIdGQL } from "./graphql/productoPorId";
import { MainService } from "../../../main.service";
import { SaveImagenProductoGQL } from "./graphql/saveImagenProducto";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";
import { GenericListService } from "../../../shared/components/generic-list/generic-list.service";
import { ProductoForPdvGQL } from "./graphql/productoSearchForPdv";
import { ProductoInfoCompletaByIdGQL } from "./graphql/productoInfoCompletaPorId";
import { PrintProductoPorIdGQL } from "./graphql/printProducto";
import { printProductoPorId } from "./graphql/graphql-query";

@Injectable({
  providedIn: "root",
})
export class ProductoService {
  datosSub = new BehaviorSubject<Producto[]>(null);

  constructor(
    public mainService: MainService,
    private productoPorProveedor: ProductoPorProveedorGQL,
    private saveProducto: SaveProductoGQL,
    private productoPorId: ProductoPorIdGQL,
    private saveImage: SaveImagenProductoGQL,
    private productoSearch: ProductoForPdvGQL,
    private notificacionSnack: NotificacionSnackbarService,
    private printProductoPorId: PrintProductoPorIdGQL,
    private searchForPdv: ProductoForPdvGQL
  ) {}

  onSearch(texto, offset?) {
    console.log('buscando ', texto, 'offest ' , offset)
    return this.productoSearch.fetch(
      {
        texto,
        offset
      },
      {
        fetchPolicy: "no-cache",
        errorPolicy: "all",
      }
    );
  }

  onSearchParaPdv(){

  }

  onGetProductoPorId(id){
    return this.productoPorId.fetch({
      id
    },{
      errorPolicy: 'all'
    })
  }

  onSaveProducto(input: ProductoInput): Observable<any> {
    return new Observable((obs) => {
      input.usuarioId = this.mainService?.usuarioActual?.id;
      this.saveProducto
        .mutate(
          {
            entity: input,
          },
          { errorPolicy: "all" }
        )
        .subscribe((res) => {
          console.log(res.errors);
          if (res.errors == null) {
            obs.next(res.data.data);
            this.notificacionSnack.notification$.next({
              texto: "Producto guardado con éxito",
              color: NotificacionColor.success,
              duracion: 2,
            });
          } else {
            obs.next(null);
            this.notificacionSnack.notification$.next({
              texto: `Ups! Algo salió mal. ${res.errors[0].message}`,
              color: NotificacionColor.danger,
              duracion: 4,
            });
          }
        });
    });
  }

  getProducto(id): Observable<Producto> {
    return new Observable((obs) => {
      this.productoPorId
        .fetch(
          {
            id,
          },
          {
            fetchPolicy: "no-cache",
          }
        )
        .subscribe((res) => {
          if (!res.error) {
            obs.next(res.data.data);
          }
        });
    });
  }

  onImageSave(image: string, filename: string) {
    // return new Observable((obs) => {
    this.saveImage
      .mutate({
        image,
        filename,
      })
      .subscribe((res) => {
        if (res.errors == null) {
          // obs.next(res.data)
          this.notificacionSnack.notification$.next({
            texto: "Imagen guardada con éxito",
            color: NotificacionColor.success,
            duracion: 2,
          });
        } else {
          this.notificacionSnack.notification$.next({
            texto: "Ups!! La imagen no se pudo guardar",
            color: NotificacionColor.danger,
            duracion: 2,
          });
        }
      });
    // })
  }

  onPrintProductoPorId(id) {
    console.log("entro al onPrint", id);
    this.printProductoPorId.fetch(
      {
        id,
      },
      {
        errorPolicy: "all",
        fetchPolicy: 'no-cache'
      }
    ).subscribe(res => {
      console.log(res)
    })
  }
}
