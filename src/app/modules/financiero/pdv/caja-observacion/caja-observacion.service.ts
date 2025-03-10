import { BehaviorSubject, Observable, tap } from "rxjs";
import { CajaObservacionInput } from "./caja-observacion-input.model";
import { CajaObservacion } from "./caja-observacion.model";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Injectable } from "@angular/core";
import { MainService } from "../../../../main.service";
import { CajaCategoriaObservacionByIdGQL } from "../caja-categoria-observacion/graphql/cajaCategoriaObservacionById";
import { GetAllCajaObservacionesGQL } from "./graphql/getAllCajaObservaciones";
import { FindByPdvCajaIdAndSucursalIdGQL } from "./graphql/findByPdvCajaIdAndSucursalId";
import { DeleteCajaObservacionGQL } from "./graphql/deleteCajaObservacion";
import { SaveCajaObservacionGQL } from "./graphql/saveCajaObservacion";
import { GenericCrudService } from "../../../../generics/generic-crud.service";

@UntilDestroy({checkProperties: true})
@Injectable({
    providedIn: 'root',
})
export class CajaObservacionService {
    cajaObservaciones: CajaObservacion[];
    cajaObservacionBS = new BehaviorSubject<CajaObservacion[]>(null);

    constructor(
        private mainService: MainService,
        private getCajaObservacionById: CajaCategoriaObservacionByIdGQL,
        private getAllCajaObservaciones: GetAllCajaObservacionesGQL,
        private getByPdvCajaIdAndSucursalId: FindByPdvCajaIdAndSucursalIdGQL,
        private saveCajaObservacion: SaveCajaObservacionGQL,
        private deleteCajaObservacion: DeleteCajaObservacionGQL,
        private genericService: GenericCrudService
    ){
        mainService.usuarioActual != null ? this.onGetCajasObservaciones().pipe(untilDestroyed(this)).subscribe(res => {
            if (res != null) {
                this.cajaObservaciones = res;
            }
        }) : null;
    }
    onGetCajasObservaciones(): Observable<CajaObservacion[]> {
        return this.genericService.onGetAll(this.getAllCajaObservaciones).pipe(
            tap((res: CajaObservacion[]) => {
                if (res != null) {
                    this.cajaObservaciones = res;
                    this.cajaObservacionBS.next(res);
                }
            })
        )
    }

    onSaveCajaObservacion(cajaObservacionInput: CajaObservacionInput): Observable<any> {
        return this.genericService.onSave(this.saveCajaObservacion, cajaObservacionInput).pipe(
            tap((res: any) => {
                this.onGetCajasObservaciones().subscribe((updatedObservations) => {
                    this.cajaObservacionBS.next(updatedObservations);
                });
            })
        );
    }

    onDeleteCajaObservacion(id: number) {
        return this.deleteCajaObservacion.mutate({
            id
        }).pipe(untilDestroyed(this)).subscribe(res => {
            if (!res.errors) {
                this.onGetCajasObservaciones();
            }
        })
    }

    onGetByCajaIdAndSucursalId(cajaId, sucursalId) {
        return this.genericService.onCustomQuery(this.getByPdvCajaIdAndSucursalId, {cajaId, sucursalId});
    }
}