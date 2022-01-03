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

@Injectable({
  providedIn: "root",
})
export class ConteoService {
  constructor(
    private genericService: GenericCrudService,
    private onSaveConteo: SaveConteoGQL,
    private deleteConteo: DeleteConteoGQL,
    private conteoMonedaService: ConteoMonedaService,
    private notificacionSnackBar: NotificacionSnackbarService
  ) {}

  onSave(conteo: Conteo, caja: PdvCaja, apertura: boolean): Observable<any> {
    let conteoMonedaInputList: ConteoMonedaInput[] = []
    conteo.conteoMonedaList.forEach(c => conteoMonedaInputList.push(c.toInput()))
    return new Observable((obs) => {
      this.onSaveConteo.mutate({
        conteo: conteo.toInput(),
        conteoMonedaInputList,  
        cajaId: caja.id,
        apertura
      }, {fetchPolicy: 'no-cache', errorPolicy: 'all'}).subscribe(res => {
        if(res.errors==null){
          obs.next(res.data['data'])
          this.notificacionSnackBar.notification$.next({
            texto: apertura == true ? 'Abierto con éxito!!' : 'Cerrado con éxito',
            color: NotificacionColor.success,
            duracion: 3
          })
        } else {
          this.notificacionSnackBar.notification$.next({
            texto: 'Ups! Algo salió mal en operacion: ' + res.errors[0].message + res,
            color: NotificacionColor.danger,
            duracion: 5
          })
          obs.next(null);
        }
      })
    });
  }

  onSaveInput(input): Observable<any> {
    return this.genericService.onSave(this.onSaveConteo, input);
  }

  onDelete(id): Observable<any> {
    return this.genericService.onDelete(this.deleteConteo, id);
  }
}
