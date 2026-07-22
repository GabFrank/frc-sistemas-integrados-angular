import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { MotivosValeGQL } from './graphql/MotivosVale';
import { MotivosValePageGQL } from './graphql/MotivosValePage';
import { SaveMotivoValeGQL } from './graphql/SaveMotivoVale';
import { DeleteMotivoValeGQL } from './graphql/DeleteMotivoVale';
import { MotivoVale } from './motivo-vale.model';

@Injectable({ providedIn: 'root' })
export class MotivoValeService {
  constructor(
    private genericService: GenericCrudService,
    private motivosValeGQL: MotivosValeGQL,
    private motivosValePageGQL: MotivosValePageGQL,
    private saveMotivoValeGQL: SaveMotivoValeGQL,
    private deleteMotivoValeGQL: DeleteMotivoValeGQL
  ) { }

  onGetAll(servidor = true): Observable<any> {
    return this.genericService.onGetAll(this.motivosValeGQL, 0, 200, servidor);
  }

  /** Padron del SaaS: lista paginada y filtrada en el backend. */
  onGetPage(page: number, size: number, descripcion?: string, activo?: boolean, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.motivosValePageGQL, { page, size, descripcion, activo }, servidor);
  }

  onSave(input: any, servidor = true): Observable<MotivoVale> {
    return this.genericService.onSave<MotivoVale>(this.saveMotivoValeGQL, input, null, null, servidor);
  }

  onDelete(id: number, servidor = true): Observable<any> {
    return this.genericService.onDelete(this.deleteMotivoValeGQL, id, null, null, false, servidor);
  }
}
