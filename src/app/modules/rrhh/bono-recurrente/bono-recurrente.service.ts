import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { BonosRecurrentesPageGQL } from './graphql/BonosRecurrentesPage';
import { SaveBonoRecurrenteGQL } from './graphql/SaveBonoRecurrente';
import { CambiarEstadoBonoRecurrenteGQL } from './graphql/CambiarEstadoBonoRecurrente';
import { BonoRecurrente } from './bono-recurrente.model';

@Injectable({ providedIn: 'root' })
export class BonoRecurrenteService {
  constructor(
    private genericService: GenericCrudService,
    private bonosRecurrentesPageGQL: BonosRecurrentesPageGQL,
    private saveBonoRecurrenteGQL: SaveBonoRecurrenteGQL,
    private cambiarEstadoBonoRecurrenteGQL: CambiarEstadoBonoRecurrenteGQL
  ) { }

  /** Padron del SaaS: lista paginada y filtrada en el backend. */
  onGetPage(page: number, size: number, funcionarioId?: number, activo?: boolean,
            servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.bonosRecurrentesPageGQL,
      { page, size, funcionarioId, activo }, servidor);
  }

  onSave(input: any, servidor = true): Observable<BonoRecurrente> {
    return this.genericService.onSave<BonoRecurrente>(this.saveBonoRecurrenteGQL, input, null, null, servidor);
  }

  onCambiarEstado(id: number, activo: boolean, servidor = true): Observable<BonoRecurrente> {
    return this.genericService.onSaveCustom<BonoRecurrente>(this.cambiarEstadoBonoRecurrenteGQL,
      { id, activo }, servidor);
  }
}
