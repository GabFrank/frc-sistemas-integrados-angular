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
import { ProductoForPdvGQL } from "./graphql/productoSearchForPdv";
import { PrintProductoPorIdGQL } from "./graphql/printProducto";
import { AllProductosGQL } from "./graphql/allProductos";

export class CustomResponse {
  errors: string[]
  data: CustomData;
}

export class CustomData {
  data: any;
}

@Injectable({
  providedIn: "root",
})
export class ProductoService {
  productosSub = new BehaviorSubject<Producto[]>(null);
  buscandoProductos = false;
  productosList : Producto[]

  constructor(
    public mainService: MainService,
    private productoPorProveedor: ProductoPorProveedorGQL,
    private saveProducto: SaveProductoGQL,
    private productoPorId: ProductoPorIdGQL,
    private saveImage: SaveImagenProductoGQL,
    private productoSearch: ProductoForPdvGQL,
    private notificacionSnack: NotificacionSnackbarService,
    private printProductoPorId: PrintProductoPorIdGQL,
    private searchForPdv: ProductoForPdvGQL,
    private getAllProductos: AllProductosGQL
  ) {
    this.productosList = []
    // getAllProductos.fetch({},{fetchPolicy: 'no-cache', errorPolicy: 'all'}).subscribe(res => {
    //   if(res.errors==null){
    //     console.log('Lista de productos cargada')
    //     this.productosList = res.data.data
    //     console.log(this.productosList)
    //   }
    // })
  }

  onSearch(texto, offset?): Observable<Producto[]>{
    console.log('buscando ', texto, 'offest ' , offset)
    return new Observable(obs => {
      this.productoSearch.fetch(
        {
          texto,
          offset
        },
        {
          fetchPolicy: "no-cache",
          errorPolicy: "all",
        }
      ).subscribe(res => {
        if(res.errors == null){
          obs.next(res.data.data)
        } else {

        }
      })
    })
  }

  onSearchLocal(texto: string){
      return Promise.all(this.productosList.filter(p => {
        let regex = new RegExp('.*' + texto.replace(' ', '.*')); 
        if(regex.test(p.descripcion) || p.descripcion.replace(' ', '').includes(texto.replace(' ', ''))){
          console.log(p.descripcion)
          return p;
        }
      }))
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
    let isNew = input?.id == null;
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
            if(isNew){
              this.productosList.push(res.data.data)
            } else {
              let index = this.productosList.findIndex(p => p.id = input.id);
              if(index!=-1){
                this.productosList[index] = res.data.data;
              }
            }
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
    console.log('saving image')
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
