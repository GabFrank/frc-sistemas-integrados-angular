import { Injectable, Injector } from "@angular/core";
import { UsuarioPorIdGQL } from "./graphql/usuarioPorId";
import { UsuarioLoginGQL } from "./graphql/usuarioLogin";
import { Usuario } from "./usuario.model";
import { UsuarioSearchGQL } from "./graphql/usuarioSearch";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";
import { UsuarioInput } from "./usuario-input.model";
import { SaveUsuarioGQL } from "./graphql/saveUsuario";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Observable } from "rxjs";
import { DeleteUsuarioGQL } from "./graphql/deleteUsuario";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { VerificarUsuarioGQL } from "./graphql/verificarUsuario";
import { UsuariosGQL } from "./graphql/usuariosQuery";
import { UsuarioPorPersonaIdGQL } from "./graphql/usuarioPorPersonaId";
import { SaveInicioSesionGQL } from "./graphql/saveInicioSesion";
import { InicioSesion, InicioSesionInput } from "../../configuracion/models/inicio-sesion.model";

import { GetUsuarioImagesGQL } from "./graphql/getUsuarioImages";
import { SaveUsuarioImageGQL } from "./graphql/saveUsuarioImage";
import { UsuarioPorEmbeddingGQL } from "./graphql/usuarioPorEmbedding";
import { IncorporarEmbeddingMarcacionGQL } from "./graphql/incorporarEmbeddingMarcacion";
import { IncorporarEmbeddingMarcacionResult } from '../../administrativo/marcacion/models/incorporar-embedding-result.model';
import { UsuariosSearchPaginatedGQL } from "./graphql/usuarioSearchPaginated";
import { PageInfo } from "../../../app.component";
import { ConfiguracionService } from "../../../shared/services/configuracion.service";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class UsuarioService {

  private genericService: GenericCrudService

  constructor(
    private getUsuario: UsuarioPorIdGQL,
    private getUsuarioLogin: UsuarioLoginGQL,
    private getUsuarioPorPersonaId: UsuarioPorPersonaIdGQL,
    private saveUsuario: SaveUsuarioGQL,
    private searchUsuario: UsuarioSearchGQL,
    private notificacionBar: NotificacionSnackbarService,
    private deleteUsuario: DeleteUsuarioGQL,
    private injector: Injector,
    private verificarUsuario: VerificarUsuarioGQL,
    private getUsuarios: UsuariosGQL,
    private saveInicioSesion: SaveInicioSesionGQL,
    private getUsuarioImages: GetUsuarioImagesGQL,
    private saveUsuarioImage: SaveUsuarioImageGQL,
    private getUsuarioPorEmbedding: UsuarioPorEmbeddingGQL,
    private incorporarEmbeddingMarcacion: IncorporarEmbeddingMarcacionGQL,
    private usuariosSearchPaginatedGQL: UsuariosSearchPaginatedGQL

  ) {
    setTimeout(() => this.genericService = injector.get(GenericCrudService));
  }

  onGetUsuarios(page, servidor: boolean = true): Observable<Usuario[]> {
    return this.genericService.onGetAll(this.getUsuarios, page, null, servidor)
  }

  onGetUsuario(id: number, servidor: boolean = true): Observable<any> {
    return this.genericService.onCustomQuery(this.getUsuario, { id }, servidor);
  }

  // Usa la query de login (sin `persona.embeddingFacial`) para ser compatible
  // con servidores en `release/beta` que aun no tienen ese campo en el schema.
  onGetUsuarioParaLogin(id: number, servidor: boolean = true): Observable<any> {
    return this.genericService.onCustomQuery(this.getUsuarioLogin, { id }, servidor);
  }

  onGetUsuarioPorPersonaId(id: number, servidor: boolean = true, errorConf?: any): Observable<any> {
    return this.genericService.onCustomQuery(this.getUsuarioPorPersonaId, { id }, servidor, errorConf)
  }

  onSeachUsuario(texto: string, servidor: boolean = true): Observable<Usuario[]> {
    return this.genericService.onGetByTexto(this.searchUsuario, texto, servidor)
  }

  onSaveUsuario(input: UsuarioInput, servidor: boolean = true): Observable<any> {
    return this.genericService.onSave(this.saveUsuario, input, null, null, servidor)
  }

  onDeleteUsuario(id, servidor: boolean = true): Observable<boolean> {
    return this.genericService.onDelete(this.deleteUsuario, id, "¿Eliminar usuario?", null, true, servidor, "¿Está seguro que desea eliminar este usuario?");
  }

  onDeleteUsuarioSinDialogo(id, servidor: boolean = true): Observable<boolean> {
    return this.genericService.onDelete(this.deleteUsuario, id, null, null, false, servidor)
  }

  onVerificarUsuario(texto, servidor: boolean = true): Observable<boolean> {
    return this.genericService.onGetByTexto(this.verificarUsuario, texto, servidor)
  }

  /**
   * Guarda el inicio de sesion. Cuando no se indica `servidor` el destino se
   * resuelve desde la configuracion: en una filial (`isLocal`) se escribe local
   * y la replica logica lo sube al central.
   *
   * Es importante que apertura y cierre de sesion vayan al mismo destino: la
   * fila usa PK compuesta (id, sucursal_id) y el id lo asigna la filial, asi
   * que si el cierre escribe directo en el central se adelanta al INSERT que
   * viaja por replica y la suscripcion se cae por duplicate key.
   */
  onSaveInicioSesion(entity: InicioSesionInput, servidor?: boolean): Observable<InicioSesion> {
    const destino = servidor ?? !this.injector.get(ConfiguracionService).getConfig()?.isLocal;
    return this.genericService.onSave(this.saveInicioSesion, entity, null, null, destino);
  }

  onGetUsuarioImages(id: number, type: string, servidor: boolean = true, errorConf?: any): Observable<string[]> {
    return this.genericService.onCustomQuery(this.getUsuarioImages, { id, type }, servidor, errorConf);
  }

  onSaveUsuarioImage(
    id: number,
    type: string,
    image: string,
    embedding: number[],
    servidor: boolean = true,
    embeddingGaleriaJson?: string
  ): Observable<boolean> {
    return this.genericService.onCustomMutation(
      this.saveUsuarioImage,
      { id, type, image, embedding, embeddingGaleriaJson },
      servidor
    );
  }

  onGetUsuarioPorEmbedding(embedding: number[], excludeIds: number[] = [], servidor: boolean = true): Observable<any> {
    return this.genericService.onCustomQuery(this.getUsuarioPorEmbedding, { embedding, excludeIds }, servidor, null, true);
  }

  onIncorporarEmbeddingMarcacion(
    usuarioId: number,
    embedding: number[],
    score: number,
    servidor: boolean = true
  ): Observable<IncorporarEmbeddingMarcacionResult> {
    return this.genericService.onCustomMutation(
      this.incorporarEmbeddingMarcacion,
      { usuarioId, embedding, score },
      servidor,
      true
    );
  }

  onSearchUsuarioPaginated(texto: string, page: number, size: number, servidor: boolean = true): Observable<PageInfo<Usuario>> {
    return this.genericService.onCustomQuery(this.usuariosSearchPaginatedGQL, { texto, page, size }, servidor);
  }

  onSearchConFiltros(texto: string, pageIndex: number, pageSize: number, servidor: boolean = true): Observable<PageInfo<Usuario>> {
    return this.onSearchUsuarioPaginated(texto, pageIndex, pageSize, servidor);
  }
}
