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
import { MatDialog } from '@angular/material/dialog';
import { tap } from 'rxjs/operators';
import { InmuebleFormComponent } from '../dialogs/inmueble-form/inmueble-form.component';
import { PaisSearchGQL } from '../../../general/pais/graphql/paisSearch';
import { CiudadesSearchGQL } from '../../../general/ciudad/graphql/ciudadesSearchGQL';
import { InmuebleSearchGQL } from '../graphql/inmuebleSearch';
import { PersonaSearchGQL } from '../../../personas/persona/graphql/personaSearch';
import { Persona } from '../../../personas/persona/persona.model';
import { Pais } from '../../../general/pais/pais.model';
import { Ciudad } from '../../../general/ciudad/ciudad.model';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../../../../shared/components/search-list-dialog/search-list-dialog.component';

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
  private personaSearchGQL = inject(PersonaSearchGQL);
  private paisSearchGQL = inject(PaisSearchGQL);
  private ciudadSearchGQL = inject(CiudadesSearchGQL);
  private dialog = inject(MatDialog);

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
    const dialogRef = this.dialog.open(InmuebleFormComponent, {
      width: '800px',
      data: inmueble,
      disableClose: true,
      autoFocus: false,
    });

    return dialogRef.afterClosed().pipe(
      tap((res) => {
        if (res) this.refrescar();
      })
    );
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

  abrirBuscadorPropietario(): Observable<Persona | undefined> {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'ID', width: '10%' },
      { id: 'nombre', nombre: 'Nombre' },
      { id: 'documento', nombre: 'Documento' }
    ];

    const data: SearchListtDialogData = {
      titulo: 'Buscar Propietario',
      query: this.personaSearchGQL,
      tableData: tableData,
      inicialSearch: true,
      paginator: true
    };

    return this.dialog.open(SearchListDialogComponent, {
      width: '800px',
      data: data
    }).afterClosed();
  }

  abrirBuscadorPais(): Observable<Pais | undefined> {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'ID', width: '10%' },
      { id: 'descripcion', nombre: 'Descripción' },
      { id: 'codigo', nombre: 'Código' }
    ];

    const data: SearchListtDialogData = {
      titulo: 'Buscar País',
      query: this.paisSearchGQL,
      tableData: tableData,
      inicialSearch: true
    };

    return this.dialog.open(SearchListDialogComponent, {
      width: '600px',
      data: data
    }).afterClosed();
  }

  abrirBuscadorCiudad(): Observable<Ciudad | undefined> {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'ID', width: '10%' },
      { id: 'descripcion', nombre: 'Descripción' }
    ];

    const data: SearchListtDialogData = {
      titulo: 'Buscar Ciudad',
      query: this.ciudadSearchGQL,
      tableData: tableData,
      inicialSearch: true
    };

    return this.dialog.open(SearchListDialogComponent, {
      width: '600px',
      data: data
    }).afterClosed();
  }
}
