import { Injectable } from "@angular/core";
import { UsuarioPorIdGQL } from "./graphql/usuarioPorId";
import { Observable } from "zen-observable-ts";
import { Usuario } from "./usuario.model";
import { UsuarioSearchGQL } from "./graphql/usuarioSearch";
import { NotificacionColor, NotificacionSnackbarService } from "../../../notificacion-snackbar.service";
import { UsuarioInput } from "./usuario-input.model";
import { MainService } from "../../../main.service";
import { SaveUsuarioGQL } from "./graphql/saveUsuario";
import { UsuarioPorPersonaIdGQL } from "./graphql/usuarioPorPersonnaId";

@Injectable({
  providedIn: "root",
})
export class UsuarioService {
  constructor(
    private getUsuario: UsuarioPorIdGQL,
    private getUsuarioPorPersonaId: UsuarioPorPersonaIdGQL,
    private saveUsuario: SaveUsuarioGQL,
    private searchUsuario: UsuarioSearchGQL,
    private notificacionBar: NotificacionSnackbarService,
    // private mainService: MainService
  ) {
  }

  onGetUsuario(id: number): Observable<any>{
    return new Observable((obs)=>{
      this.getUsuario.fetch({
        id
      }, {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
      }).subscribe(res => {
        if(res?.errors==null){
          obs.next(res?.data.data);
        } else {
          obs.next(res.errors)
        }
      })
    })
  }

  onGetUsuarioPorPersonaId(id: number): Observable<any>{
    return new Observable((obs)=>{
      this.getUsuarioPorPersonaId.fetch({
        id
      }, {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
      }).subscribe(res => {
        if(res?.errors==null){
          obs.next(res?.data.data);
        } else {
          obs.next(res.errors)
        }
      })
    })
  }

  onSeachUsuario(texto:string): Observable<Usuario[]>{
    if(texto!=null || texto!= ''){
      return new Observable(obs => {
        this.searchUsuario.fetch({
          texto: texto.toUpperCase()
        }, {
          fetchPolicy: 'no-cache',
          errorPolicy: 'all'
        }).subscribe(res => {
          if(res.errors==null){
            obs.next(res.data)
          } else {
            this.notificacionBar.notification$.next({
              texto: 'Ups! algo salio mal: '+ res.errors[0].message,
              color: NotificacionColor.danger,
              duracion: 3
            })
          }
        })
      })
    }
  }

  onSaveUsuario(input: UsuarioInput): Observable<any> {
    console.log(input)
    return new Observable((obs) => {
      if(input.usuarioId == null){
        input.usuarioId = +localStorage.getItem("usuarioId");
      }
      this.saveUsuario
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
            this.notificacionBar.notification$.next({
              texto: "Producto guardado con éxito",
              color: NotificacionColor.success,
              duracion: 2,
            });
          } else {
            obs.next(null);
            this.notificacionBar.notification$.next({
              texto: `Ups! Algo salió mal. ${res.errors[0].message}`,
              color: NotificacionColor.danger,
              duracion: 4,
            });
          }
        });
    });
  }
}
