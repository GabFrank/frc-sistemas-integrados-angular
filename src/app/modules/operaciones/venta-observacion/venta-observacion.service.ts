import { Injectable } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { VentaObservacion } from "./venta-observacion.model";
import { BehaviorSubject, Observable, of, tap } from "rxjs";
import { MainService } from "../../../main.service";
import { VentaObservacionByIdGQL } from "./graphql/ventaObservacionById";
import { findByVentaIdAndSucursalIdGQL } from "./graphql/findByVentaIdAndSucursalId";
import { SaveVentaObservacionGQL } from "./graphql/saveVentaObservacion";
import { DeleteVentaObservacionGQL } from "./graphql/deleteVentaObservacion";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { AllVentaObservacionesGQL } from "./graphql/allVentaObservaciones";
import { VentaObservacionInput } from "./venta-observacion-input";

@UntilDestroy({checkProperties: true})
@Injectable({
    providedIn: 'root',
})
export class VentaObservacionService {
    ventaObservaciones: VentaObservacion[];
    ventaObservacionBS = new BehaviorSubject<VentaObservacion[]>(null);

    constructor(
        private mainService: MainService,
        private getVentaObservacionById: VentaObservacionByIdGQL,
        private getAllVentaObservaciones: AllVentaObservacionesGQL,
        private getByVentaIdAndSucursalId: findByVentaIdAndSucursalIdGQL,
        private saveVentaObservacion: SaveVentaObservacionGQL,
        private deleteVentaObservacion: DeleteVentaObservacionGQL,
        private genericService: GenericCrudService
    ){
        mainService.usuarioActual != null ? this.onGetVentasObservaciones().pipe(untilDestroyed(this)).subscribe(res => {
            if (res != null) {
                this.ventaObservaciones = res;
            }
        }) : null;
    }
    onGetVentasObservaciones(): Observable<VentaObservacion[]> {
        return this.genericService.onGetAll(this.getAllVentaObservaciones).pipe(
            tap((res: VentaObservacion[]) => {
                if (res != null) {
                    this.ventaObservaciones = res;
                    this.ventaObservacionBS.next(res);
                }
            })
        )
    }

    onSaveVentaObservacion(ventaObservacionInput: VentaObservacionInput): Observable<any> {
        return this.genericService.onSave(this.saveVentaObservacion, ventaObservacionInput).pipe(
            tap((res: any) => {
                this.onGetVentasObservaciones().subscribe((updatedObservations) => {
                    this.ventaObservacionBS.next(updatedObservations);
                });
            })
        );
    }

    onDeleteVentaObservacion(id: number) {
        return this.deleteVentaObservacion.mutate({
            id
        }).pipe(untilDestroyed(this)).subscribe(res => {
            if (!res.errors) {
                this.onGetVentasObservaciones();
            }
        })
    }

    onGetByVentaIdAndSucursalId(ventaId, sucId) {
        return this.genericService.onCustomQuery(this.getByVentaIdAndSucursalId, {ventaId, sucId});
    }
}