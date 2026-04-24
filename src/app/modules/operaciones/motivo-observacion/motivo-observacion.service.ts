import { Injectable } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MotivoObservacion } from "./motivo-observacion.model";
import { BehaviorSubject, Observable, of, tap } from "rxjs";
import { MainService } from "../../../main.service";
import { GetAllMotivosObservacionesGQL, } from "./graphql/getAllMotivosObservaciones";
import { GetMotivoObservacionByIdGQL } from "./graphql/getMotivoObservacionById";
import { FindByMotivoIdOrDescGQL } from "./graphql/findByMotivoIdOrDesc";
import { SaveMotivoObservacionGQL } from "./graphql/saveMotivoObservacion";
import { DeleteMotivoObservacionGQL } from "./graphql/deleteMotivoObservacion";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { MotivoObservacionInput } from "./motivo-observacion.input";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: 'root',
})

export class MotivoObservacionService {
  motivoObservaciones: MotivoObservacion[];
  motivoObservacionBS = new BehaviorSubject<MotivoObservacion[]>(null);

  constructor(
    private mainService: MainService,
    private genericService: GenericCrudService,
    private getAllMotivosObservaciones: GetAllMotivosObservacionesGQL,
    private getMotivoObservacionById: GetMotivoObservacionByIdGQL,
    private findByMotivoIdOrDesc: FindByMotivoIdOrDescGQL,
    private saveMotivoObservacion: SaveMotivoObservacionGQL,
    private deleteMotivoObservacion: DeleteMotivoObservacionGQL
  ) {
      this.mainService.usuarioActual != null ? this.onGetMotivosObservaciones().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.motivoObservaciones = res;
      }
    }) : null;
  }

  onGetMotivosObservaciones(): Observable<MotivoObservacion[]> {
    if (this.motivoObservaciones?.length > 0) {
      this.motivoObservacionBS.next(this.motivoObservaciones);
      return of(this.motivoObservaciones);
    }
    return this.genericService.onGetAll(this.getAllMotivosObservaciones).pipe(
      tap(res => {
        if (res != null) {
          this.motivoObservaciones = res;
          this.motivoObservacionBS.next(res);
        }
      })
    );
  }

  onFindMotivoByIdOrDesc(id, texto) {
    return this.genericService.onCustomQuery(this.findByMotivoIdOrDesc, {id, texto} );
  }

  onSaveMotivoObservacion(motivoObservacionInput: MotivoObservacionInput): Observable<any> {
    return this.genericService.onSave(this.saveMotivoObservacion, motivoObservacionInput).pipe(
      tap((res: any) => {
        if (res != null) {
          const savedMotivo: MotivoObservacion = res.data ? res.data : res;

          if(this.motivoObservaciones) {
            const existingIndex = this.motivoObservaciones.findIndex(item => item.id === savedMotivo.id);
            
            if (existingIndex !== -1) {
              this.motivoObservaciones[existingIndex] = savedMotivo;
              this.motivoObservaciones = [...this.motivoObservaciones];
            } else {
              this.motivoObservaciones = [...this.motivoObservaciones, savedMotivo];
            }
          } else {
            this.motivoObservaciones = [savedMotivo];
          }
          this.motivoObservacionBS.next(this.motivoObservaciones);
        }
      })
    );
  }

  onDeleteMotivoObservacion(id: number) {
    return this.deleteMotivoObservacion.mutate({ id }).pipe(
      tap(res => {
        if (!res.errors) {
          if (this.motivoObservaciones) {
            this.motivoObservaciones = this.motivoObservaciones.filter(cat => cat.id !== id);
            this.motivoObservacionBS.next(this.motivoObservaciones);
          }
        }
      })
    );
  }

}
