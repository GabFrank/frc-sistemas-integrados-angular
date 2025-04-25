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
import { PageInfo } from "../../../app.component";
import { SaveInicioSesionGQL } from "./graphql/saveInicioSesion";
import { InicioSesion, InicioSesionInput } from "../../configuracion/models/inicio-sesion.model";

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

  onGetUsuarios(page, servidor: boolean = true): Observable<Usuario[]>{
    return this.genericService.onGetAll(this.getUsuarios, page, null, servidor)
  }

  onGetUsuario(id: number, servidor: boolean = true): Observable<any> {
    return this.genericService.onCustomQuery(this.getUsuario, {id}, servidor);
  }

  onGetUsuarioPorPersonaId(id: number, servidor: boolean = true): Observable<any> {
    return this.genericService.onGetById(this.getUsuarioPorPersonaId, id, null, null, servidor)
  }

  onSeachUsuario(texto: string, servidor: boolean = true): Observable<Usuario[]> {
    return this.genericService.onGetByTexto(this.searchUsuario, texto, servidor)
  }

  onSaveUsuario(input: UsuarioInput, servidor: boolean = true): Observable<any> {
    return this.genericService.onSave(this.saveUsuario, input, null, null, servidor)
  }

  onDeleteUsuario(id, servidor: boolean = true): Observable<boolean> {
    return this.genericService.onDelete(this.deleteUsuario, id, null, null, true, servidor)
  }

  onDeleteUsuarioSinDialogo(id, servidor: boolean = true): Observable<boolean> {
    return this.genericService.onDelete(this.deleteUsuario, id, null, null, false, servidor)
  }

  onVerificarUsuario(texto, servidor: boolean = true): Observable<boolean>{
    return this.genericService.onGetByTexto(this.verificarUsuario, texto, servidor)
  }

  onSaveInicioSesion(entity: InicioSesionInput, servidor: boolean = true): Observable<InicioSesion>{
    return this.genericService.onSave(this.saveInicioSesion, entity, null, null, servidor);
  }
}
