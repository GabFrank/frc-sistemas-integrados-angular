import { Injectable, inject, Injector } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Inmueble } from '../models/inmueble.model';
import { InmuebleInput } from '../models/inmueble-input.model';
import { ContextoConsulta, GenericCrudService, PROPAGAR_ERROR_DE_RED, QueryError } from '../../../../generics/generic-crud.service';
import { PageInfo } from '../../../../app.component';
import { InmuebleByIdGQL } from '../graphql/inmuebleById';
import { SaveInmuebleGQL } from '../graphql/saveInmueble';
import { DeleteInmuebleGQL } from '../graphql/deleteInmueble';
import { InmuebleSearchPageGQL } from '../graphql/inmuebleSearchPage';
import { MatDialog } from '@angular/material/dialog';
import { tap } from 'rxjs/operators';
import { InmuebleDialogService } from './inmueble-dialog-service.service';
import { InmuebleSearchGQL } from '../graphql/inmuebleSearch';
import { InmuebleSucursalDialogComponent, InmuebleSucursalDialogData } from '../dialogs/inmueble-sucursal-dialog/inmueble-sucursal-dialog.component';
import { EnteVinculacion } from '../../ente/models/ente-vinculacion.model';
import { DeleteEnteVinculacionGQL } from '../../ente/graphql/deleteEnteVinculacion';
import { map } from 'rxjs/operators';

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
  private deleteEnteVinculacionGQL = inject(DeleteEnteVinculacionGQL);
  private dialog = inject(MatDialog);
  private injector = inject(Injector);
  abrirFormulario(inmueble?: Inmueble): Observable<boolean | undefined> {
    return this.injector.get(InmuebleDialogService).abrirFormulario(inmueble);
  }

  abrirVinculacionSucursal(inmueble: Inmueble, vinculacion?: EnteVinculacion): Observable<EnteVinculacion | undefined> {
    return this.dialog.open(InmuebleSucursalDialogComponent, {
      data: { inmueble, vinculacion } as InmuebleSucursalDialogData,
      width: '620px',
      disableClose: true,
      autoFocus: false,
    }).afterClosed().pipe(
      tap((res) => {
        if (res) this.refrescar();
      }),
      map(res => res || undefined)
    );
  }

  onDesvincularSucursal(vinculacionId: number): Observable<boolean> {
    return this.genericService.onDelete(
      this.deleteEnteVinculacionGQL,
      vinculacionId,
      '¿Desvincular inmueble de sucursal?',
      null,
      true,
      true,
      '¿Está seguro que desea quitar la vinculación con la sucursal?'
    ).pipe(
      tap((res) => {
        if (res) this.refrescar();
      })
    );
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

  /** Con `errorConf` el error llega a quien llama; sin él, la consulta no emite nada si falla (#390). */
  onBuscarPorId(id: number, errorConf?: QueryError, contexto?: ContextoConsulta): Observable<Inmueble> {
    return this.genericService.onGetById(this.inmuebleByIdGQL, id, null, null, true, null, null, null, null, null, null,
      errorConf, contexto);
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



  /** Propaga el error de red: sin eso el genérico se lo traga y el formulario no se entera (#390). */
  onGuardar(input: InmuebleInput): Observable<Inmueble> {
    return this.genericService.onSave(this.saveInmuebleGQL, input, undefined, undefined, true, PROPAGAR_ERROR_DE_RED).pipe(
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
