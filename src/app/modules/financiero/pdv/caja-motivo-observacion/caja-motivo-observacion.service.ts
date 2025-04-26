import { BehaviorSubject, Observable, of, tap } from "rxjs";
import { CajaMotivoObservacion } from "./caja-motivo-observacion.model";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Injectable } from "@angular/core";
import { MainService } from "../../../../main.service";
import { GenericCrudService } from "../../../../generics/generic-crud.service";
import { GetAllCajaMotivosObservacionesGQL } from "./graphql/getAllCajaMotivosObservaciones";
import { GetCajaMotivoObservacionByIdGQL } from "./graphql/getCajaMotivoObservacionById";
import { FindByCajaMotivoIdOrDescGQL } from "./graphql/findByCajaMotivoIdOrDesc";
import { SaveCajaMotivoObservacionGQL } from "./graphql/saveCajaMotivoObservacion";
import { DeleteCajaMotivoObservacionGQL } from "./graphql/deleteCajaMotivoObservacion";
import { CajaMotivoObservacionInput } from "./caja-motivo-observacion-input.model";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: 'root',
})

export class CajaMotivoObservacionService {
  cajaMotivoObservaciones: CajaMotivoObservacion[];
  cajaMotivoObservacionBS = new BehaviorSubject<CajaMotivoObservacion[]>(null);

  constructor(
    private mainService: MainService,
    private genericService: GenericCrudService,
    private getAllCajaMotivosObservaciones: GetAllCajaMotivosObservacionesGQL,
    private getCajaMotivoObservacionById: GetCajaMotivoObservacionByIdGQL,
    private findByCajaMotivoIdOrDesc: FindByCajaMotivoIdOrDescGQL,
    private saveCajaMotivoObservacion: SaveCajaMotivoObservacionGQL,
    private deleteCajaMotivoObservacion: DeleteCajaMotivoObservacionGQL
  ) {
      this.mainService.usuarioActual != null ? this.onGetCajaMotivosObservaciones().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.cajaMotivoObservaciones = res;
      }
    }) : null;
  }

  onGetCajaMotivosObservaciones(): Observable<CajaMotivoObservacion[]> {
    if (this.cajaMotivoObservaciones?.length > 0) {
      this.cajaMotivoObservacionBS.next(this.cajaMotivoObservaciones);
      return of(this.cajaMotivoObservaciones);
    }
    return this.genericService.onGetAll(this.getAllCajaMotivosObservaciones).pipe(
      tap(res => {
        if (res != null) {
          this.cajaMotivoObservaciones = res;
          this.cajaMotivoObservacionBS.next(res);
        }
      })
    );
  }

  onFindCajaMotivoByIdOrDesc(id, texto) {
    return this.genericService.onCustomQuery(this.findByCajaMotivoIdOrDesc, {id, texto} );
  }

  onSaveCajaMotivoObservacion(cajaMotivoObservacionInput: CajaMotivoObservacionInput): Observable<any> {
    return this.genericService.onSave(this.saveCajaMotivoObservacion, cajaMotivoObservacionInput).pipe(
      tap((res: any) => {
        if (res != null) {
          const newCajaMotivo: CajaMotivoObservacion = res.data ? res.data : res;

          if(this.cajaMotivoObservaciones) {
            this.cajaMotivoObservaciones = [...this.cajaMotivoObservaciones, newCajaMotivo];
          } else {
            this.cajaMotivoObservaciones = [newCajaMotivo];
          }
          this.cajaMotivoObservacionBS.next(this.cajaMotivoObservaciones);
        }
      })
    );
  }

  onDeleteCajaMotivoObservacion(id: number) {
    return this.deleteCajaMotivoObservacion.mutate({ id }).pipe(
      tap(res => {
        if (!res.errors) {
          if (this.cajaMotivoObservaciones) {
            this.cajaMotivoObservaciones = this.cajaMotivoObservaciones.filter(cat => cat.id !== id);
            this.cajaMotivoObservacionBS.next(this.cajaMotivoObservaciones);
          }
        }
      })
    );
  }

}