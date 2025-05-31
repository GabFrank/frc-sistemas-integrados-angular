import { Injectable } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { CajaSubCategoriaObservacion } from "./caja-subcategoria-observacion.model";
import { BehaviorSubject, of, tap , Observable} from "rxjs";
import { getAllCajaSubCategoriaObsGQL } from "./graphql/getAllCajaSubCategoriasObs";
import { SaveCajaSubCategoriaObsGQL } from "./graphql/saveCajaSubCategoriaObs";
import { DeleteCajaSubCategoriaObsGQL } from "./graphql/deleteCajaSubCategoriaObs";
import { MainService } from "../../../../main.service";
import { GenericCrudService } from "../../../../generics/generic-crud.service";
import { CajaSubCategoriaObsSearchGQL } from "./graphql/findByCajaSubCategoriaIdOrDesc";
import { CajaSubCategoriaObservacionInput } from "./caja-subcategoria-observacion-input.model";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: 'root',
})
export class CajaSubCategoriaObservacionService {
  cajaSubCategoriaObservaciones: CajaSubCategoriaObservacion[];
  cajaSubCategoriaObservacionBS = new BehaviorSubject<CajaSubCategoriaObservacion[]>(null);

  constructor(
    private getCajaSubCategoriaObservaciones: getAllCajaSubCategoriaObsGQL,
    private saveCajaSubCategoriaObservacion: SaveCajaSubCategoriaObsGQL,
    private deleteCajaSubCategoriaObservacion: DeleteCajaSubCategoriaObsGQL,
    public mainService: MainService,
    private genericService: GenericCrudService,
    private cajaSubCategoriaObservacionSearch: CajaSubCategoriaObsSearchGQL
  ) {
    this.mainService.usuarioActual != null ? this.onGetAllCajaSubCategoriaObs().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.cajaSubCategoriaObservaciones = res;
      }
    }) : null;
  }

  onGetAllCajaSubCategoriaObs(): Observable<any> {
    if (this.cajaSubCategoriaObservaciones?.length > 0) {
      this.cajaSubCategoriaObservacionBS.next(this.cajaSubCategoriaObservaciones);
      return of(this.cajaSubCategoriaObservaciones);
    }
    return this.genericService.onGetAll(this.getCajaSubCategoriaObservaciones).pipe(
      tap(res => {
        if (res != null) {
          this.cajaSubCategoriaObservaciones = res;
          this.cajaSubCategoriaObservacionBS.next(res);
        }
      })
    );
  }

  onSaveCajaSubCategoriaObservacion(cajaSubCategoriaObservacionInput: CajaSubCategoriaObservacionInput): Observable<any> {
    return this.genericService.onSave(this.saveCajaSubCategoriaObservacion, cajaSubCategoriaObservacionInput).pipe(
      tap((res: any) => {
        if (res != null) {
          const savedSubcat: CajaSubCategoriaObservacion = res.data ? res.data : res;
          
          if (this.cajaSubCategoriaObservaciones) { 
            const existingIndex = this.cajaSubCategoriaObservaciones.findIndex(item => item.id === savedSubcat.id);
            
            if (existingIndex !== -1) {
              this.cajaSubCategoriaObservaciones[existingIndex] = savedSubcat;
              this.cajaSubCategoriaObservaciones = [...this.cajaSubCategoriaObservaciones];
            } else {
              this.cajaSubCategoriaObservaciones = [...this.cajaSubCategoriaObservaciones, savedSubcat];
            }
          } else {
            this.cajaSubCategoriaObservaciones = [savedSubcat];
          }
          this.cajaSubCategoriaObservacionBS.next(this.cajaSubCategoriaObservaciones);
        }
      })
    );
  }

  onDeleteCajaSubCategoriaObservacion(id: number) {
    return this.deleteCajaSubCategoriaObservacion.mutate({ id }).pipe(
      tap(res => {
        if (!res.errors) {
          if (this.cajaSubCategoriaObservaciones) {
            this.cajaSubCategoriaObservaciones = this.cajaSubCategoriaObservaciones.filter(cat => cat.id !== id);
            this.cajaSubCategoriaObservacionBS.next(this.cajaSubCategoriaObservaciones);
          }
        }
      })
    );
  }
  
  onSearchCajaSubCategoriaObservacion(id, texto) {
    return this.genericService.onCustomQuery(this.cajaSubCategoriaObservacionSearch, { id, texto });
  }

}