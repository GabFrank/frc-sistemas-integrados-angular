import { Injectable, Injector } from "@angular/core";
import { UsuarioPorIdGQL } from "./graphql/usuarioPorId";
import { Usuario } from "./usuario.model";
import { UsuarioSearchGQL } from "./graphql/usuarioSearch";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";
import { UsuarioInput } from "./usuario-input.model";
import { MainService } from "../../../main.service";
import { SaveUsuarioGQL } from "./graphql/saveUsuario";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Observable } from "rxjs";
import { DeleteUsuarioGQL } from "./graphql/deleteUsuario";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { VerificarUsuarioGQL } from "./graphql/verificarUsuario";
import { UsuariosGQL } from "./graphql/usuariosQuery";
import { UsuarioPorPersonaIdGQL } from "./graphql/usuarioPorPersonaId";
import { InicioSesion, InicioSesionInput } from "../../configuracion/models/inicio-sesion.model";
import { PageInfo } from "../../../app.component";
import { SaveInicioSesionGQL } from "./graphql/saveInicioSesion";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class UsuarioService {

  private genericService: GenericCrudService

  constructor(
    private getUsuario: UsuarioPorIdGQL,
    private getUsuarioPorPersonaId: UsuarioPorPersonaIdGQL,
    private saveUsuario: SaveUsuarioGQL,
    private searchUsuario: UsuarioSearchGQL,
    private notificacionBar: NotificacionSnackbarService,
    private deleteUsuario: DeleteUsuarioGQL,
    private injector: Injector,
    private verificarUsuario: VerificarUsuarioGQL,
    private getUsuarios: UsuariosGQL,
    private saveInicioSesion: SaveInicioSesionGQL

  ) // private mainService: MainService
  {
    setTimeout(() => this.genericService = injector.get(GenericCrudService));
  }

  onGetUsuarios(page): Observable<Usuario[]>{
    return this.genericService.onGetAll(this.getUsuarios, page)
  }

  onGetUsuario(id: number): Observable<any> {
    return new Observable((obs) => {
      this.getUsuario
        .fetch(
          {
            id,
          },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        ).pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res?.errors == null) {
            obs.next(res?.data.data);
          } else {
            obs.next(res.errors);
          }
        });
    });
  }

  onGetUsuarioPorPersonaId(id: number): Observable<any> {
    return this.genericService.onGetById(this.getUsuarioPorPersonaId, id)
  }

  onSeachUsuario(texto: string): Observable<Usuario[]> {
    return this.genericService.onGetByTexto(this.searchUsuario, texto)
  }

  onSaveUsuario(input: UsuarioInput): Observable<any> {
    return new Observable((obs) => {
      if (input.usuarioId == null) {
        input.usuarioId = +localStorage.getItem("usuarioId");
      }
      this.saveUsuario
        .mutate(
          {
            entity: input,
          },
          { errorPolicy: "all" }
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
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

  onDeleteUsuario(id): Observable<boolean> {
    return this.genericService.onDelete(this.deleteUsuario, id)
  }

  onDeleteUsuarioSinDialogo(id): Observable<boolean> {
    return this.genericService.onDelete(this.deleteUsuario, id, null, null,)
  }

  onVerificarUsuario(texto): Observable<boolean>{
    return this.genericService.onGetByTexto(this.verificarUsuario, texto)
  }

  onSaveInicioSesion(entity: InicioSesionInput): Observable<InicioSesion>{
    return this.genericService.onSave(this.saveInicioSesion, entity);
  }
}
