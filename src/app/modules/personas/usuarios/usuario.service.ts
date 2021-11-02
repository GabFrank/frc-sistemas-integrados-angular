import { Injectable } from "@angular/core";
import { GenericListService } from "../../../shared/components/generic-list/generic-list.service";
import { Apollo } from "apollo-angular";
import { TabService } from "../../../layouts/tab/tab.service";
import { DialogosService } from "../../../shared/components/dialogos/dialogos.service";
import {
  usuarioQuery,
  deleteUsuarioQuery,
  usuariosSearch,
  saveUsuario,
} from "./graphql/graphql-query";
import { ListUsuarioComponent } from "./list-usuario/list-usuario.component";
import { UsuarioComponent } from "./usuario.component";
import { UsuarioPorIdGQL } from "./graphql/usuarioPorId";
import { Observable } from "zen-observable-ts";
import { Usuario } from "./usuario.model";
import { GraphQLError } from "graphql";
import { UsuarioSearchGQL } from "./graphql/usuarioSearch";
import { NotificacionColor, NotificacionSnackbarService } from "../../../notificacion-snackbar.service";

@Injectable({
  providedIn: "root",
})
export class UsuarioService extends GenericListService {
  constructor(
    apollo: Apollo,
    tabService: TabService,
    dialogoService: DialogosService,
    private getUsuario: UsuarioPorIdGQL,
    private searchUsuario: UsuarioSearchGQL,
    private notificacionBar: NotificacionSnackbarService
  ) {
    super(apollo, tabService, dialogoService);
    this.entityQuery = usuarioQuery;
    this.deleteQuery = deleteUsuarioQuery;
    this.searchQuery = usuariosSearch;
    this.saveQuery = saveUsuario;
    this.editTitle = "persona.nombre";
    this.deleteTitle = "persona.nombre";
    this.newTitle = "Nuevo usuario";
    this.component = UsuarioComponent;
    this.parentComponent = ListUsuarioComponent;
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
}
