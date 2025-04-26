import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { NotificacionColor, NotificacionSnackbarService } from "../../../notificacion-snackbar.service";
import { PdvCaja } from "../pdv/caja/caja.model";
import { ConteoMonedaInput } from "./conteo-moneda/conteo-moneda.model";
import { ConteoMonedaService } from "./conteo-moneda/conteo-moneda.service";
import { Conteo } from "./conteo.model";
import { DeleteConteoGQL } from "./graphql/deleleConteo";
import { SaveConteoGQL } from "./graphql/saveConteo";
import { CargandoDialogService } from '../../../shared/components/cargando-dialog/cargando-dialog.service';

@UntilDestroy()
@Injectable({
  providedIn: "root",
})
export class ConteoService {
  constructor(
    private genericService: GenericCrudService,
    private onSaveConteo: SaveConteoGQL,
    private deleteConteo: DeleteConteoGQL,
    private conteoMonedaService: ConteoMonedaService,
    private notificacionSnackBar: NotificacionSnackbarService,
    private cargandoService: CargandoDialogService
  ) { }

  onSave(conteo: Conteo, cajaId, apertura: boolean, servidor: boolean = true): Observable<any> {
    let conteoMonedaInputList: ConteoMonedaInput[] = []
    conteo.conteoMonedaList.forEach(c => conteoMonedaInputList.push(c.toInput()))
    //refactor using genericservice on custom mutation, remember tu put patameters inside {conteo: conteo.toInput(), conteoMonedaInputList, cajaId, apertura}
    return this.genericService.onCustomMutation(this.onSaveConteo, {conteo: conteo.toInput(), conteoMonedaInputList, cajaId, apertura}, servidor);
  }

  onSaveInput(input, servidor: boolean = true): Observable<any> {
    return this.genericService.onSave(this.onSaveConteo, input, null, null, servidor);
  }

  onDelete(id, servidor: boolean = true): Observable<any> {
    return this.genericService.onDelete(this.deleteConteo, id, null, null, null, servidor);
  }
}
