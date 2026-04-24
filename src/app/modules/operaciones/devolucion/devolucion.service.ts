import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { Devolucion, DevolucionInput } from "./devolucion.model";
import { ConfirmarDevolucionGQL, GetDevolucionByIdGQL, SaveDevolucionGQL } from "./graphql/devolucion-gql";

@Injectable({
    providedIn: 'root'
})
export class DevolucionService {

    constructor(
        private genericService: GenericCrudService,
        private getDevolucionByIdGQL: GetDevolucionByIdGQL,
        private saveDevolucionGQL: SaveDevolucionGQL,
        private confirmarDevolucionGQL: ConfirmarDevolucionGQL
    ) {}

    onGetById(id: number): Observable<Devolucion> {
        return this.genericService.onGetById(this.getDevolucionByIdGQL, id);
    }

    onSave(input: DevolucionInput): Observable<Devolucion> {
        return this.genericService.onSave(this.saveDevolucionGQL, input);
    }

    onConfirmar(id: number): Observable<any> {
        return this.genericService.onCustomMutation(this.confirmarDevolucionGQL, { id });
    }
} 