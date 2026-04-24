import { Injectable } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { CategoriaObservacion } from "./categoria-observacion.model";
import { BehaviorSubject, Observable, of, tap } from "rxjs";
import { MainService } from "../../../main.service";
import { CategoriaObservacionByIdGQL } from "./graphql/categoriaObservacionById";
import { SaveCategoriaObservacionGQL } from "./graphql/saveCategoriaObservacion";
import { DeleteCategoriaObservacionGQL } from "./graphql/deleteCategoriaObservacion";
import { CategoriaObservacionSearchGQL } from "./graphql/categoriaObservacionSearch";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { AllCategoriasObservacionesGQL } from "./graphql/allCategoriasObservaciones";
import { CategoriaObservacionInput } from "./categoria-observacion-input.model";

@UntilDestroy({ checkProperties: true })
@Injectable({
    providedIn: 'root'
})

export class CategoriaObservacionService {
    categoriasObs: CategoriaObservacion[];
    categoriaObsBS = new BehaviorSubject<CategoriaObservacion[]>(null);

    constructor(
        private mainService: MainService,
        private getAllCategoriasObservaciones: AllCategoriasObservacionesGQL,
        private getCategoriaObservacionById: CategoriaObservacionByIdGQL,
        private saveCategoriaObservacion: SaveCategoriaObservacionGQL,
        private deleteCategoriaObservacion: DeleteCategoriaObservacionGQL,
        private categoriaObservacionSearch: CategoriaObservacionSearchGQL,
        private genericService: GenericCrudService
        ) {
            this.mainService.usuarioActual != null ? this.onGetCategoriasObservaciones().pipe(untilDestroyed(this)).subscribe(res => {
                if(res != null) {
                    this.categoriasObs = res;
                }
            }) : null;
    }

    onGetCategoriasObservaciones(): Observable<CategoriaObservacion[]> {
      if (this.categoriasObs?.length > 0) {
        this.categoriaObsBS.next(this.categoriasObs);
        return of(this.categoriasObs);
      } 
      return this.genericService.onGetAll(this.getAllCategoriasObservaciones).pipe(
        tap(res => {
            if (res != null) {
                this.categoriasObs = res;
                this.categoriaObsBS.next(res);
            }
        })
      );
        
    }
    onSearchCategoriaObservacion(id, texto) {
        return this.genericService.onCustomQuery(this.categoriaObservacionSearch, {id, texto});
    }

    onSaveCategoriaObservacion(categoriaObsInput: CategoriaObservacionInput): Observable<any> {
        return this.genericService.onSave(this.saveCategoriaObservacion, categoriaObsInput).pipe(
            tap((res: any) => {
                if (res != null) {
                    const savedCategoria: CategoriaObservacion = res.data ? res.data : res;

                    if (this.categoriasObs) {
                        const existingIndex = this.categoriasObs.findIndex(item => item.id === savedCategoria.id);
                        
                        if (existingIndex !== -1) {
                            this.categoriasObs[existingIndex] = savedCategoria;
                            this.categoriasObs = [...this.categoriasObs];
                        } else {
                            this.categoriasObs = [...this.categoriasObs, savedCategoria];
                        }
                    } else {
                        this.categoriasObs = [savedCategoria];
                    }
                    this.categoriaObsBS.next(this.categoriasObs);
                }
            })
        );
    }

    onDeleteCategoriaObservacion(id: number) {
        return this.deleteCategoriaObservacion.mutate({ id }).pipe(
          tap(res => {
            if (!res.errors) {
              if (this.categoriasObs) {
                this.categoriasObs = this.categoriasObs.filter(cat => cat.id !== id);
                this.categoriaObsBS.next(this.categoriasObs);
              }
            }
          })
        );
      }
      

}