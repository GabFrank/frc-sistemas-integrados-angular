import { Injectable, inject } from '@angular/core';
import { DeleteMuebleGQL } from '../graphql/deleteMueble';
import { MuebleSearchPageGQL } from '../graphql/muebleSearchPage';
import { BehaviorSubject, Observable } from 'rxjs';
import { Mueble } from '../models/mueble.model';
import { MuebleInput } from '../models/mueble-input.model';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { PageInfo } from '../../../../app.component';
import { MuebleByIdGQL } from '../graphql/muebleById';
import { SaveMuebleGQL } from '../graphql/saveMueble';

@Injectable({
  providedIn: 'root'
})
export class MuebleService {
  private genericService = inject(GenericCrudService);
  private muebleByIdGQL = inject(MuebleByIdGQL);
  private saveMuebleGQL = inject(SaveMuebleGQL);
  private deleteMuebleGQL = inject(DeleteMuebleGQL);
  private muebleSearchPageGQL = inject(MuebleSearchPageGQL);

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  onBuscarPorId(id: number): Observable<Mueble> {
    return this.genericService.onGetById(this.muebleByIdGQL, id);
  }

  onFiltrar(texto: string, page: number, size: number): Observable<PageInfo<Mueble>> {
    return this.genericService.onCustomQuery(this.muebleSearchPageGQL, { texto, page, size });
  }

  onGuardar(input: MuebleInput): Observable<Mueble> {
    return this.genericService.onSave(this.saveMuebleGQL, input);
  }

  onEliminar(id: number): Observable<boolean> {
    return this.genericService.onDelete(
      this.deleteMuebleGQL,
      id,
      '¿Eliminar mueble?',
      null,
      true,
      true,
      '¿Está seguro que desea eliminar este mueble?'
    );
  }
}
