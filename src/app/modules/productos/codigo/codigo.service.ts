import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { BehaviorSubject, Observable, pipe } from "rxjs";
import { MainService } from "../../../main.service";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";
import { DialogosService } from "../../../shared/components/dialogos/dialogos.service";
import { CodigoInput } from "./codigo-input.model";
import { Codigo } from "./codigo.model";
import { CodigoPorCodigoGQL } from "./graphql/codigoPorCodigo";
import { CodigosPorPresentacionIdGQL } from "./graphql/codigoPorPresentacionId";
import { DeleteCodigoGQL } from "./graphql/deleteCodigo";
import { GenerarCodigoInternoGQL } from "./graphql/generarCodigoInterno";
import { SaveCodigoGQL } from "./graphql/saveCodigo";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ContextoConsulta, GenericCrudService, QueryError } from "../../../generics/generic-crud.service";
import { PROPAGAR_ERROR_DE_RED, TIMEOUT_CONSULTA_DE_FONDO_MS } from "../../../generics/generic-crud.constantes";

const CONSULTA_CODIGO: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class CodigoService {
  dataOBs = new BehaviorSubject<Codigo[]>(null);

  constructor(
    public mainService: MainService,
    private saveCodigo: SaveCodigoGQL,
    private getCodigosPorPresentacionId: CodigosPorPresentacionIdGQL,
    private deleteCodigo: DeleteCodigoGQL,
    private notificacionBar: NotificacionSnackbarService,
    private getCodigoPorCodigo: CodigoPorCodigoGQL,
    private generarCodigoInternoGQL: GenerarCodigoInternoGQL,
    private dialogoService: DialogosService,
    private genericService: GenericCrudService
  ) {}

  /** Sin `errorConf` un error falla hacia quien llama. Con él llega solo lo que se pida propagar: pedir el de red, o queda esperando (#390). */
  onGetCodigosPorPresentacionId(id, servidor = true, errorConf?: QueryError, contexto?: ContextoConsulta) {
    return this.genericService.onGetById<Codigo[]>(this.getCodigosPorPresentacionId, id, null, null, servidor, null, null,
      null, null, null, null, errorConf, contexto);
  }

  onSaveCodigo(input: CodigoInput, servidor = true): Observable<any> {
    if(input.usuarioId==null) input.usuarioId = this.mainService?.usuarioActual?.id;
    if(input.principal==false) input.principal = null;
    // Propaga el error de red (#390): rechazo o incierto lo decide esRechazoDelServidor (la respuesta vacía es incierta)
    return this.genericService.onSave(this.saveCodigo, input, null, null, servidor, PROPAGAR_ERROR_DE_RED);
  }

  onDeleteCodigo(codigo: Codigo, servidor = true): Observable<any> {
    return this.genericService.onDelete(this.deleteCodigo, codigo.id, "¿Eliminar código?", null, true, servidor, "¿Está seguro que desea eliminar este código?");
  }

  /**
   * Control de «código ya en uso» antes de guardar: el error de red y el del servidor llegan al llamador (20 s).
   * Sin eso el control no respondía y Guardar quedaba mudo (#390).
   */
  onGetCodigoPorCodigo(texto: string, servidor = true): Observable<Codigo[]> {
    return this.genericService.onCustomQuery(this.getCodigoPorCodigo, { texto }, servidor,
      { networkError: { propagate: true, show: false }, graphError: { propagate: true, show: false } }, undefined,
      CONSULTA_CODIGO);
  }

  /** Próximo EAN-13 interno (2199…); no persiste hasta saveCodigo. */
  onGenerarCodigoInterno(servidor = true): Observable<string> {
    return this.genericService.onCustomQuery(this.generarCodigoInternoGQL, {}, servidor, PROPAGAR_ERROR_DE_RED, undefined,
      CONSULTA_CODIGO);
  }
}
