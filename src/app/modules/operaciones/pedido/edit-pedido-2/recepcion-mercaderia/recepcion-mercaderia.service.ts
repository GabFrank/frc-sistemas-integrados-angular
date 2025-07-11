import { Injectable } from "@angular/core";
import { GenericCrudService } from "../../../../generics/generic-crud.service";
import { RecepcionMercaderia, RecepcionMercaderiaInput } from "./recepcion-mercaderia.model";
import { Observable } from "rxjs";
import { GetRecepcionMercaderiaByIdGQL } from "./graphql/getRecepcionMercaderiaById";
import { SaveRecepcionMercaderiaGQL } from "./graphql/saveRecepcionMercaderia";
import { FinalizarRecepcionMercaderiaGQL } from "./graphql/finalizarRecepcionMercaderia";

@Injectable({
    providedIn: 'root'
})
export class RecepcionMercaderiaService {

    constructor(
        private genericCrudService: GenericCrudService,
        private getByIdGQL: GetRecepcionMercaderiaByIdGQL,
        private saveGQL: SaveRecepcionMercaderiaGQL,
        private finalizarGQL: FinalizarRecepcionMercaderiaGQL
    ) {}

    onGetById(id: number): Observable<RecepcionMercaderia> {
        return this.genericCrudService.onGetById(this.getByIdGQL, id);
    }

    onSave(input: RecepcionMercaderiaInput): Observable<RecepcionMercaderia> {
        return this.genericCrudService.onSave(this.saveGQL, { entity: input });
    }

    onFinalizar(id: number): Observable<boolean> {
        return this.genericCrudService.onCustomMutation(this.finalizarGQL, { id });
    }
} 