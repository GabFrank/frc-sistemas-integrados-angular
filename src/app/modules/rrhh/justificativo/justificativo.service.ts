import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { JustificativosPorFuncionarioYRangoGQL } from './graphql/JustificativosPorFuncionarioYRango';
import { SaveJustificativoGQL } from './graphql/SaveJustificativo';
import { DeleteJustificativoGQL } from './graphql/DeleteJustificativo';
import { TiposJustificativoGQL } from './graphql/TiposJustificativo';
import { TiposJustificativoActivosGQL } from './graphql/TiposJustificativoActivos';
import { SaveTipoJustificativoGQL } from './graphql/SaveTipoJustificativo';
import { DeleteTipoJustificativoGQL } from './graphql/DeleteTipoJustificativo';
import { Justificativo, TipoJustificativo } from './justificativo.model';

@Injectable({ providedIn: 'root' })
export class JustificativoService {

  constructor(
    private genericService: GenericCrudService,
    private justificativosPorFuncionarioYRangoGQL: JustificativosPorFuncionarioYRangoGQL,
    private saveJustificativoGQL: SaveJustificativoGQL,
    private deleteJustificativoGQL: DeleteJustificativoGQL,
    private tiposJustificativoGQL: TiposJustificativoGQL,
    private tiposJustificativoActivosGQL: TiposJustificativoActivosGQL,
    private saveTipoJustificativoGQL: SaveTipoJustificativoGQL,
    private deleteTipoJustificativoGQL: DeleteTipoJustificativoGQL
  ) { }

  onGetPorFuncionarioYRango(funcionarioId: number, desde: string, hasta: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(
      this.justificativosPorFuncionarioYRangoGQL,
      { funcionarioId, desde, hasta },
      servidor
    );
  }

  onSave(input: any, servidor = true): Observable<Justificativo> {
    return this.genericService.onSave<Justificativo>(this.saveJustificativoGQL, input, null, null, servidor);
  }

  onDelete(id: number, servidor = true): Observable<any> {
    return this.genericService.onDelete(this.deleteJustificativoGQL, id, null, null, false, servidor);
  }

  // ---- catalogo de tipos ----

  onGetTipos(servidor = true): Observable<any> {
    return this.genericService.onGetAll(this.tiposJustificativoGQL, null, null, servidor);
  }

  onGetTiposActivos(servidor = true): Observable<any> {
    return this.genericService.onGetAll(this.tiposJustificativoActivosGQL, null, null, servidor);
  }

  onSaveTipo(input: any, servidor = true): Observable<TipoJustificativo> {
    return this.genericService.onSave<TipoJustificativo>(this.saveTipoJustificativoGQL, input, null, null, servidor);
  }

  onDeleteTipo(id: number, servidor = true): Observable<any> {
    return this.genericService.onDelete(this.deleteTipoJustificativoGQL, id, null, null, false, servidor);
  }
}
