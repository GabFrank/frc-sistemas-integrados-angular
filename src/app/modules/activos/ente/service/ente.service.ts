import { Injectable, inject } from '@angular/core';
import { EnteByIdGQL } from '../graphql/enteById';
import { SaveEnteGQL } from '../graphql/saveEnte';
import { DeleteEnteGQL } from '../graphql/deleteEnte';
import { EnteSearchPageGQL } from '../graphql/enteSearchPage';
import { BehaviorSubject, Observable } from 'rxjs';
import { Ente } from '../models/ente.model';
import { TipoEnte } from '../enums/tipo-ente.enum';
import { EnteInput } from '../models/ente-input.model';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { PageInfo } from '../../../../app.component';
import { EnteArchivo } from '../models/ente-archivo.model';
import { EnteArchivoInput } from '../models/ente-archivo-input.model';

@Injectable({
  providedIn: 'root'
})
export class EnteService {
  private genericService = inject(GenericCrudService);
  private enteByIdGQL = inject(EnteByIdGQL);
  private saveEnteGQL = inject(SaveEnteGQL);
  private deleteEnteGQL = inject(DeleteEnteGQL);
  private enteSearchPageGQL = inject(EnteSearchPageGQL);

  onBuscarPorId(id: number): Observable<Ente> {
    return this.genericService.onGetById(this.enteByIdGQL, id);
  }

  onFiltrar(texto: string, page: number, size: number): Observable<PageInfo<Ente>> {
    return this.genericService.onCustomQuery(this.enteSearchPageGQL, { texto, page, size });
  }

  onGuardar(input: EnteInput): Observable<Ente> {
    return this.genericService.onSave(this.saveEnteGQL, input);
  }

  onEliminar(id: number): Observable<boolean> {
    return this.genericService.onDelete(this.deleteEnteGQL, id, '¿Eliminar ente?');
  }
}
