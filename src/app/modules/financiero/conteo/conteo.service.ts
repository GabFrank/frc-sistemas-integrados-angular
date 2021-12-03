import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GenericCrudService } from "../../../generics/generic-crud.service";
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
    private conteoMonedaService: ConteoMonedaService
  ) {}

  onSave(conteo: Conteo): Observable<any> {
    return new Observable((obs) => {
      console.log(conteo.toInput())
      this.onSaveInput(conteo.toInput()).subscribe(async (res) => {
        if (res != null) {
          let savedConteo: Conteo = res;
          savedConteo.conteoMonedaList = []
          for await (const c of conteo.conteoMonedaList) {
            let conteoMoneda = new ConteoMonedaInput();
            conteoMoneda.cantidad = c.cantidad;
            conteoMoneda.conteoId = savedConteo.id;
            conteoMoneda.monedaBilletesId = c.monedaBilletes?.id;
            conteoMoneda.observacion = c.observacion;
            this.conteoMonedaService.onSave(conteoMoneda).subscribe((res1) => {
              savedConteo.conteoMonedaList.push(res1)
            });
          }
          obs.next(savedConteo)
        }
      });
    });
  }

  onSaveInput(input): Observable<any> {
    return this.genericService.onSave(this.onSaveConteo, input);
  }

  onDelete(id): Observable<any> {
    return this.genericService.onDelete(this.deleteConteo, id);
  }
}
