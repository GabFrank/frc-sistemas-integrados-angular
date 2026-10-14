import { ContextoConsulta, GenericCrudService, QueryError, PROPAGAR_ERROR_DE_RED, TIMEOUT_CONSULTA_DE_FONDO_MS } from './../../../generics/generic-crud.service';
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
import { SugerenciasImagenPresentacionGQL } from './graphql/sugerenciasImagenPresentacion';
import { DescargarImagenSugeridaGQL } from './graphql/descargarImagenSugerida';
import { SugerenciasImagen } from './imagen-sugerida.model';

/** El panel de sugerencias muestra los errores en su lugar: sin cartel ni «Buscando…» del genérico. */
const ERRORES_AL_PANEL: QueryError = {
  graphError: { show: false, propagate: true },
  networkError: { show: false, propagate: true },
};

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
    private genericService: GenericCrudService,
    private sugerenciasImagen: SugerenciasImagenPresentacionGQL,
    private descargarImagenSugerida: DescargarImagenSugeridaGQL
  ) { }

  onGetPresentacionesPorProductoId(id, servidor = true, errorConf?: QueryError, contexto?: ContextoConsulta): Observable<Presentacion[]>{
    return this.genericService.onGetById(this.getPresentacionesPorProductoId, id, null, null, servidor, null, null, null, null,
      null, null, errorConf, contexto);
  }

  /**
   * Presentaciones de un producto para un diálogo abierto: 20 s y el error de red al llamador, que avisa. Con un
   * error GraphQL emite `null` (el servicio ya avisó) (#390).
   */
  onGetPresentacionesPorProductoIdParaDialogo(id): Observable<Presentacion[] | null> {
    return this.onGetPresentacionesPorProductoId(id, true, PROPAGAR_ERROR_DE_RED,
      { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true });
  }

  onGetPresentaciones(servidor = true) {
    return this.genericService.onGetById(this.getPresentaciones, null, null, null, servidor);
  }

  onSavePresentacion(presentacionInput: PresentacionInput, servidor = true): Observable<any> {
    if (presentacionInput.descripcion == null) {
      presentacionInput.descripcion = presentacionInput.cantidad.toString()
    }
    presentacionInput.usuarioId = this.mainService?.usuarioActual?.id;
    return this.genericService.onCustomMutation(this.savePresentacion, {
      entity: presentacionInput,
    }, servidor);
  }

  
  onDeletePresentacion(presentacion: Presentacion, servidor = true): Observable<any> {
    return new Observable(obs => {
      this.deletePresentacion.mutate({
        id: presentacion.id,
      }, {
        fetchPolicy: "no-cache",
        errorPolicy: "all",
        context: {
          clientName: servidor == null || servidor ? "servidor" : null,
        },
      }).pipe(untilDestroyed(this)).subscribe((res) => {
        if (res.errors == null) {
          obs.next((res.data as any).deletePresentacion);
          obs.complete();
        } else {
          obs.error(res.errors);
        }
      }, error => {
        obs.error(error);
      });
    });
  }

  onImageSave(image: string, filename: string, servidor = true): Observable<any> {
    return this.genericService.onCustomMutation(this.saveImage, {
      image,
      filename
    }, servidor);
  }

  /**
   * Fotos de internet para la presentación, por código de barras y por descripción. `codigo` null = el de la
   * presentación, '' = sin código; `texto` null = producto + presentación. Falla con `{ message }`.
   */
  onGetSugerenciasImagen(presentacionId: number, codigo?: string, texto?: string): Observable<SugerenciasImagen> {
    return this.genericService.onCustomQuery(this.sugerenciasImagen, { presentacionId, codigo, texto }, true,
      ERRORES_AL_PANEL, true, { timeoutMs: 30000, silenciarAvisoTimeout: true });
  }

  /** La foto elegida, bajada por el central, como data URL. Falla con `{ message }`. */
  onDescargarImagenSugerida(url: string): Observable<string> {
    return this.genericService.onCustomQuery(this.descargarImagenSugerida, { url }, true,
      ERRORES_AL_PANEL, true, { timeoutMs: 30000, silenciarAvisoTimeout: true });
  }

  onGetPresentacion(id: number, servidor = true) {
    return this.genericService.onGetById(this.getPresentacion, id, null, null, servidor)
  }

  async onGetPresentacionTest(id: number, servidor = true): Promise<Presentacion> {
    return new Promise((resolve, reject) => {
      this.genericService.onGetById(this.getPresentacion, id, null, null, servidor)
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
