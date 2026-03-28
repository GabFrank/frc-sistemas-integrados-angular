import { Injectable, inject, Injector } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Inmueble } from '../models/inmueble.model';
import { InmuebleInput } from '../models/inmueble-input.model';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { PageInfo } from '../../../../app.component';
import { InmuebleByIdGQL } from '../graphql/inmuebleById';
import { SaveInmuebleGQL } from '../graphql/saveInmueble';
import { DeleteInmuebleGQL } from '../graphql/deleteInmueble';
import { InmuebleSearchPageGQL } from '../graphql/inmuebleSearchPage';
import { MatDialog } from '@angular/material/dialog';
import { tap } from 'rxjs/operators';
import { InmuebleDialogService } from './inmueble-dialog-service.service';
import { InmuebleSearchGQL } from '../graphql/inmuebleSearch';
import { Persona } from '../../../personas/persona/persona.model';
import { Pais } from '../../../general/pais/pais.model';
import { Ciudad } from '../../../general/ciudad/ciudad.model';

@Injectable({
  providedIn: 'root'
})
export class InmuebleService {
  private genericService = inject(GenericCrudService);
  private inmuebleByIdGQL = inject(InmuebleByIdGQL);
  private saveInmuebleGQL = inject(SaveInmuebleGQL);
  private deleteInmuebleGQL = inject(DeleteInmuebleGQL);
  private inmuebleSearchGQL = inject(InmuebleSearchGQL);
  private inmuebleSearchPageGQL = inject(InmuebleSearchPageGQL);
  private dialog = inject(MatDialog);
  private injector = inject(Injector);
  private _inmuebleDialogService: InmuebleDialogService;
  private get inmuebleDialogService(): InmuebleDialogService {
    if (!this._inmuebleDialogService) {
      this._inmuebleDialogService = this.injector.get(InmuebleDialogService);
    }
    return this._inmuebleDialogService;
  }

  private inmueblesSubject = new BehaviorSubject<Inmueble[]>([]);
  public inmuebles$ = this.inmueblesSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private _searchText$ = new BehaviorSubject<string>('');
  public searchText$ = this._searchText$.asObservable();

  private _paginationState$ = new BehaviorSubject<{ pageIndex: number; pageSize: number; totalElements: number }>({
    pageIndex: 0,
    pageSize: 15,
    totalElements: 0,
  });
  public paginationState$ = this._paginationState$.asObservable();

  onBuscarPorId(id: number): Observable<Inmueble> {
    return this.genericService.onGetById(this.inmuebleByIdGQL, id);
  }

  onFiltrar(texto: string, page: number, size: number): Observable<PageInfo<Inmueble>> {
    return this.genericService.onCustomQuery(this.inmuebleSearchPageGQL, { texto, page, size });
  }

  refrescar(): void {
    this.loadingSubject.next(true);
    const texto = this._searchText$.value;
    const { pageIndex, pageSize } = this._paginationState$.value;
    this.onFiltrar(texto, pageIndex, pageSize).subscribe({
      next: (res) => {
        this.inmueblesSubject.next(res?.getContent || []);
        this._paginationState$.next({
          ...this._paginationState$.value,
          totalElements: res?.getTotalElements || 0,
        });
        this.loadingSubject.next(false);
      },
      error: () => this.loadingSubject.next(false),
    });
  }

  setSearchText(texto: string): void {
    this._searchText$.next(texto);
    this.updatePagination(0, this._paginationState$.value.pageSize);
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this._paginationState$.next({
      ...this._paginationState$.value,
      pageIndex,
      pageSize,
    });
    this.refrescar();
  }

  abrirFormulario(inmueble?: Inmueble): Observable<boolean | undefined> {
    return this.inmuebleDialogService.abrirFormulario(inmueble);
  }

  onGuardar(input: InmuebleInput): Observable<Inmueble> {
    return this.genericService.onSave(this.saveInmuebleGQL, input).pipe(
      tap((res) => {
        if (res) this.refrescar();
      })
    );
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
    ).pipe(
      tap((res) => {
        if (res) this.refrescar();
      })
    );
  }
}
