import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GenericCrudService } from "../../../../generics/generic-crud.service";
import { RecepcionMercaderia, RecepcionMercaderiaInput } from "./recepcion-mercaderia.model";
import { FinalizarRecepcionMercaderiaGQL, GetRecepcionMercaderiaByIdGQL, SaveRecepcionMercaderiaGQL } from "./graphql/recepcion-mercaderia-gql";

@Injectable({
    providedIn: 'root'
})
export class RecepcionMercaderiaService {

    constructor(
        private genericService: GenericCrudService,
        private getRecepcionMercaderiaByIdGQL: GetRecepcionMercaderiaByIdGQL,
        private saveRecepcionMercaderiaGQL: SaveRecepcionMercaderiaGQL,
        private finalizarRecepcionMercaderiaGQL: FinalizarRecepcionMercaderiaGQL
    ) {}

    onGetById(id: number): Observable<RecepcionMercaderia> {
        return this.genericService.onGetById(this.getRecepcionMercaderiaByIdGQL, id);
    }

    onSave(input: RecepcionMercaderiaInput): Observable<RecepcionMercaderia> {
        return this.genericService.onSave(this.saveRecepcionMercaderiaGQL, input);
    }

    onFinalizar(id: number): Observable<any> {
        return this.genericService.onCustomMutation(this.finalizarRecepcionMercaderiaGQL, { id });
    }
} 