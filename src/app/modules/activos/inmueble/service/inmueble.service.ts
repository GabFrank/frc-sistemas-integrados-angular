import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Inmueble } from '../models/inmueble.model';
import { InmuebleInput } from '../models/inmueble-input.model';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { PageInfo } from '../../../../app.component';
import { InmuebleByIdGQL } from '../graphql/inmuebleById';
import { SaveInmuebleGQL } from '../graphql/saveInmueble';
import { DeleteInmuebleGQL } from '../graphql/deleteInmueble';
import { InmuebleSearchPageGQL } from '../graphql/inmuebleSearchPage';

@Injectable({
  providedIn: 'root'
})
export class InmuebleService {
  private genericService = inject(GenericCrudService);
  private inmuebleByIdGQL = inject(InmuebleByIdGQL);
  private saveInmuebleGQL = inject(SaveInmuebleGQL);
  private deleteInmuebleGQL = inject(DeleteInmuebleGQL);
  private inmuebleSearchPageGQL = inject(InmuebleSearchPageGQL);

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  onBuscarPorId(id: number): Observable<Inmueble> {
    return this.genericService.onGetById(this.inmuebleByIdGQL, id);
  }

  onFiltrar(texto: string, page: number, size: number): Observable<PageInfo<Inmueble>> {
    return this.genericService.onCustomQuery(this.inmuebleSearchPageGQL, { texto, page, size });
  }

  onGuardar(input: InmuebleInput): Observable<Inmueble> {
    return this.genericService.onSave(this.saveInmuebleGQL, input);
  }

  onEliminar(id: number): Observable<boolean> {
    return this.genericService.onDelete(
      this.deleteInmuebleGQL,
      id,
      '¿Eliminar inmueble?',
      null,
      true,
      true,
      '¿Está seguro que desea eliminar este inmueble?'
    );
  }
}
