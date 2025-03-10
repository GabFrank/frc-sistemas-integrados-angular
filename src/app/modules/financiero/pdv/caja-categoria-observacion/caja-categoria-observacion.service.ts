import { Injectable } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MainService } from "../../../../main.service";
import { CajaCategoriaObservacion } from "./caja-categoria-observacion.model";
import { BehaviorSubject, Observable, of, tap } from "rxjs";
import { GenericCrudService } from "../../../../generics/generic-crud.service";
import { AllCajaCategoriaObservacionesGQL } from "./graphql/allCajaCategoriasObservaciones";
import { CajaCategoriaObservacionByIdGQL } from "./graphql/cajaCategoriaObservacionById";
import { SaveCajaCategoriaObservacionGQL } from "./graphql/saveCajaCategoriaObservacion";
import { DeleteCajaCategoriaObservacionGQL } from "./graphql/deleteCajaCategoriaObservacion";
import { FindByIdOrDescGQL } from "./graphql/findByIdOrDesc";
import { CajaCategoriaObservacionInput } from "./caja-categoria-observacion-input.model";


@UntilDestroy({ checkProperties: true })
@Injectable({
    providedIn: 'root'
})

export class CajaCategoriaObservacionService {
    cajaCategoriasObs: CajaCategoriaObservacion[];
    cajaCategoriaObsBS = new BehaviorSubject<CajaCategoriaObservacion[]>(null);

    constructor(
        private mainService: MainService,
        private getAllCajaCategoriasObs: AllCajaCategoriaObservacionesGQL,
        private getCajaCategoriaObservacionById: CajaCategoriaObservacionByIdGQL,
        private saveCajaCategoriaObs: SaveCajaCategoriaObservacionGQL,
        private deleteCajaCategoriaObs: DeleteCajaCategoriaObservacionGQL,
        private findCajaByIdOrDesc: FindByIdOrDescGQL,
        private genericService: GenericCrudService
        ) {
            this.mainService.usuarioActual != null ? this.onGetCajasCategoriasObservaciones().pipe(untilDestroyed(this)).subscribe(res => {
                if(res != null) {
                    this.cajaCategoriasObs = res;
                }
            }) : null;
    }

    onGetCajasCategoriasObservaciones(): Observable<CajaCategoriaObservacion[]> {
      if (this.cajaCategoriasObs?.length > 0) {
        this.cajaCategoriaObsBS.next(this.cajaCategoriasObs);
        return of(this.cajaCategoriasObs);
      } 
      return this.genericService.onGetAll(this.getAllCajaCategoriasObs).pipe(
        tap(res => {
            if (res != null) {
                this.cajaCategoriasObs = res;
                this.cajaCategoriaObsBS.next(res);
            }
        })
      );
        
    }
    onSearchCajaCategoriaObservacion(id, texto) {
        return this.genericService.onCustomQuery(this.findCajaByIdOrDesc, {id, texto});
    }

    onSaveCajaCategoriaObservacion(cajaCategoriaObsInput: CajaCategoriaObservacionInput): Observable<any> {
        return this.genericService.onSave(this.saveCajaCategoriaObs, cajaCategoriaObsInput).pipe(
            tap((res: any) => {
                if (res != null) {
                    const newCategoria: CajaCategoriaObservacion = res.data ? res.data : res;

                    if (this.cajaCategoriasObs) {
                        this.cajaCategoriasObs = [...this.cajaCategoriasObs, newCategoria];
                    } else {
                        this.cajaCategoriasObs = [newCategoria];
                    }
                    this.cajaCategoriaObsBS.next(this.cajaCategoriasObs);
                }
            })
        );
    }

    onDeleteCategoriaObservacion(id: number) {
        return this.deleteCajaCategoriaObs.mutate({ id }).pipe(
          tap(res => {
            if (!res.errors) {
              if (this.cajaCategoriasObs) {
                this.cajaCategoriasObs = this.cajaCategoriasObs.filter(cat => cat.id !== id);
                this.cajaCategoriaObsBS.next(this.cajaCategoriasObs);
              }
            }
          })
        );
      }
      

}