import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { NovedadesPorFuncionarioYRangoGQL } from './graphql/NovedadesPorFuncionarioYRango';
import { SaveNovedadGQL } from './graphql/SaveNovedad';
import { DeleteNovedadGQL } from './graphql/DeleteNovedad';
import { JornadaNovedad } from './jornada-novedad.model';

@Injectable({ providedIn: 'root' })
export class JornadaNovedadService {

  constructor(
    private genericService: GenericCrudService,
    private novedadesPorFuncionarioYRangoGQL: NovedadesPorFuncionarioYRangoGQL,
    private saveNovedadGQL: SaveNovedadGQL,
    private deleteNovedadGQL: DeleteNovedadGQL
  ) { }

  onGetPorFuncionarioYRango(funcionarioId: number, desde: string, hasta: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(
      this.novedadesPorFuncionarioYRangoGQL,
      { funcionarioId, desde, hasta },
      servidor
    );
  }

  onSave(input: any, servidor = true): Observable<JornadaNovedad> {
    return this.genericService.onSave<JornadaNovedad>(this.saveNovedadGQL, input, null, null, servidor);
  }

  onDelete(id: number, servidor = true): Observable<any> {
    return this.genericService.onDelete(this.deleteNovedadGQL, id, null, null, false, servidor);
  }
}
