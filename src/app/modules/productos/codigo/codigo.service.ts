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
import { SaveCodigoGQL } from "./graphql/saveCodigo";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GenericCrudService } from "../../../generics/generic-crud.service";

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
    private dialogoService: DialogosService,
    private genericService: GenericCrudService
  ) {}

  onGetCodigosPorPresentacionId(id, servidor = true) {
    return this.genericService.onGetById(this.getCodigosPorPresentacionId, id, null, null, servidor);
  }

  onSaveCodigo(input: CodigoInput, servidor = true): Observable<any> {
    if(input.usuarioId==null) input.usuarioId = this.mainService?.usuarioActual?.id;
    if(input.principal==false) input.principal = null;
    return this.genericService.onSave(this.saveCodigo, input, null, null, servidor);
  }

  onDeleteCodigo(codigo: Codigo, servidor = true): Observable<any> {
    return this.genericService.onDelete(this.deleteCodigo, codigo.id, "¿Eliminar código?", null, true, servidor, "¿Está seguro que desea eliminar este código?");
  }

  onGetCodigoPorCodigo(texto: string, servidor = true) {
    return this.genericService.onGetByTexto(this.getCodigoPorCodigo, texto, servidor);
  }
}
