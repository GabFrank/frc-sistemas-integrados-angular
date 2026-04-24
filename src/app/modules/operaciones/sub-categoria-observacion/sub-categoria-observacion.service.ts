import { Injectable } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { SubCategoriaObservacion } from "./sub-categoria-observacion.model";
import { BehaviorSubject, Observable, of, tap } from "rxjs";
import { AllSubCategoriasObservacionesGQL } from "./graphql/allSubCategoriasObservaciones";
import { SaveSubCategoriaObservacionGQL } from "./graphql/saveSubCategoriaObservacion";
import { DeleteSubCategoriaObservacionGQL } from "./graphql/deleteSubCategoriaObservacion";
import { MainService } from "../../../main.service";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { subCategoriaObservacionSearchGQL } from "./graphql/subCategoriaObservacionSearch";
import { SubCategoriaObservacionInput } from "./sub-categoria-observacion.input";
import { CategoriaObservacionService } from "../categoria-observacion/categoria-observacion.service";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: 'root',
})
export class SubCategoriaObservacionService {
  subCategoriaObservaciones: SubCategoriaObservacion[];
  subCategoriaObservacionBS = new BehaviorSubject<SubCategoriaObservacion[]>(null);

  constructor(
    private getSubCategoriaObservaciones: AllSubCategoriasObservacionesGQL,
    private saveSubCategoriaObservacion: SaveSubCategoriaObservacionGQL,
    private deleteSubCategoriaObservacion: DeleteSubCategoriaObservacionGQL,
    public mainService: MainService,
    private genericService: GenericCrudService,
    private subCategoriaObservacionSearch: subCategoriaObservacionSearchGQL,
    private categoriaObservacionService: CategoriaObservacionService
  ) {
    this.mainService.usuarioActual != null ? this.onGetAllSubCategoriaObs().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.subCategoriaObservaciones = res;
      }
    }) : null;
  }

  onGetAllSubCategoriaObs(): Observable<any> {
    if (this.subCategoriaObservaciones?.length > 0) {
      this.subCategoriaObservacionBS.next(this.subCategoriaObservaciones);
      return of(this.subCategoriaObservaciones);
    }
    return this.genericService.onGetAll(this.getSubCategoriaObservaciones).pipe(
      tap(res => {
        if (res != null) {
          this.subCategoriaObservaciones = res;
          this.subCategoriaObservacionBS.next(res);
        }
      })
    );
  }

  onSaveSubCategoriaObservacion(subCategoriaObservacionInput: SubCategoriaObservacionInput): Observable<any> {
    return this.genericService.onSave(this.saveSubCategoriaObservacion, subCategoriaObservacionInput).pipe(
      tap((res: any) => {
        if (res != null) {
          const savedSubcat: SubCategoriaObservacion = res.data ? res.data : res;
          
          if (this.subCategoriaObservaciones) {
            // Verificar si es actualización (tiene ID) o nuevo registro
            const existingIndex = this.subCategoriaObservaciones.findIndex(item => item.id === savedSubcat.id);
            
            if (existingIndex !== -1) {
              // Actualizar registro existente
              this.subCategoriaObservaciones[existingIndex] = savedSubcat;
              this.subCategoriaObservaciones = [...this.subCategoriaObservaciones];
            } else {
              // Agregar nuevo registro
              this.subCategoriaObservaciones = [...this.subCategoriaObservaciones, savedSubcat];
            }
          } else {
            this.subCategoriaObservaciones = [savedSubcat];
          }
          this.subCategoriaObservacionBS.next(this.subCategoriaObservaciones);
        }
      })
    );
  }

  onDeleteSubCategoriaObservacion(id: number) {
    return this.deleteSubCategoriaObservacion.mutate({ id }).pipe(
      tap(res => {
        if (!res.errors) {
          if (this.subCategoriaObservaciones) {
            this.subCategoriaObservaciones = this.subCategoriaObservaciones.filter(cat => cat.id !== id);
            this.subCategoriaObservacionBS.next(this.subCategoriaObservaciones);
          }
        }
      })
    );
  }
  
  onSearchSubCategoriaObservacion(id, texto) {
    return this.genericService.onCustomQuery(this.subCategoriaObservacionSearch, { id, texto });
  }

}