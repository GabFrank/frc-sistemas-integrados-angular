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
import { MatDialog } from '@angular/material/dialog';
import { tap } from 'rxjs/operators';
import { MuebleFormComponent } from '../dialogs/mueble-form/mueble-form.component';
import { AdicionarFamiliaMuebleDialogComponent } from '../dialogs/adicionar-familia-mueble-dialog/adicionar-familia-mueble-dialog.component';
import { AdicionarTipoMuebleDialogComponent } from '../dialogs/adicionar-tipo-mueble-dialog/adicionar-tipo-mueble-dialog.component';
import { PersonaSearchGQL } from '../../../personas/persona/graphql/personaSearch';
import { FamiliaMuebleSearchGQL } from '../graphql/familiaMuebleSearch';
import { TipoMuebleSearchGQL } from '../graphql/tipoMuebleSearch';
import { SaveFamiliaMuebleGQL } from '../graphql/saveFamiliaMueble';
import { SaveTipoMuebleGQL } from '../graphql/saveTipoMueble';
import { MonedasSearchGQL } from '../../../financiero/moneda/graphql/monedasSearch';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { Persona } from '../../../personas/persona/persona.model';
import { FamiliaMueble } from '../models/familia-mueble.model';
import { TipoMueble } from '../models/tipo-mueble.model';
import { MuebleSearchGQL } from '../graphql/muebleSearch';

@Injectable({
  providedIn: 'root'
})
export class MuebleService {
  private genericService = inject(GenericCrudService);
  private muebleByIdGQL = inject(MuebleByIdGQL);
  private saveMuebleGQL = inject(SaveMuebleGQL);
  private deleteMuebleGQL = inject(DeleteMuebleGQL);
  private muebleSearchGQL = inject(MuebleSearchGQL);
  private muebleSearchPageGQL = inject(MuebleSearchPageGQL);
  private personaSearchGQL = inject(PersonaSearchGQL);
  private familiaSearchGQL = inject(FamiliaMuebleSearchGQL);
  private tipoMuebleSearchGQL = inject(TipoMuebleSearchGQL);
  private saveFamiliaGQL = inject(SaveFamiliaMuebleGQL);
  private saveTipoGQL = inject(SaveTipoMuebleGQL);
  private monedasSearchGQL = inject(MonedasSearchGQL);
  private dialog = inject(MatDialog);

  private mueblesSubject = new BehaviorSubject<Mueble[]>([]);
  public muebles$ = this.mueblesSubject.asObservable();

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

  onBuscarPorId(id: number): Observable<Mueble> {
    return this.genericService.onGetById(this.muebleByIdGQL, id);
  }

  onFiltrar(texto: string, page: number, size: number): Observable<PageInfo<Mueble>> {
    return this.genericService.onCustomQuery(this.muebleSearchPageGQL, { texto, page, size });
  }

  refrescar(): void {
    this.loadingSubject.next(true);
    const texto = this._searchText$.value;
    const { pageIndex, pageSize } = this._paginationState$.value;
    this.onFiltrar(texto, pageIndex, pageSize).subscribe({
      next: (res) => {
        this.mueblesSubject.next(res?.getContent || []);
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

  abrirFormulario(mueble?: Mueble): Observable<boolean | undefined> {
    const dialogRef = this.dialog.open(MuebleFormComponent, {
      width: '800px',
      data: mueble,
      disableClose: true,
      autoFocus: false,
    });

    return dialogRef.afterClosed().pipe(
      tap((res) => {
        if (res) this.refrescar();
      })
    );
  }

  onGuardar(input: MuebleInput): Observable<Mueble> {
    return this.genericService.onSave(this.saveMuebleGQL, input).pipe(
      tap((res) => {
        if (res) this.refrescar();
      })
    );
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

  abrirBuscadorFamilia(): Observable<FamiliaMueble | undefined> {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'ID', width: '10%' },
      { id: 'descripcion', nombre: 'Descripción' }
    ];

    const data: SearchListtDialogData = {
      titulo: 'Buscar Familia de Mueble',
      query: this.familiaSearchGQL,
      tableData: tableData,
      inicialSearch: true,
      isAdicionar: true
    };

    return this.dialog.open(SearchListDialogComponent, {
      width: '600px',
      data: data
    }).afterClosed();
  }

  abrirBuscadorTipo(): Observable<TipoMueble | undefined> {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'ID', width: '10%' },
      { id: 'descripcion', nombre: 'Descripción' }
    ];

    const data: SearchListtDialogData = {
      titulo: 'Buscar Tipo de Mueble',
      query: this.tipoMuebleSearchGQL,
      tableData: tableData,
      inicialSearch: true,
      isAdicionar: true
    };

    return this.dialog.open(SearchListDialogComponent, {
      width: '600px',
      data: data
    }).afterClosed();
  }

  abrirAdicionarFamilia(): Observable<FamiliaMueble | undefined> {
    return this.dialog.open(AdicionarFamiliaMuebleDialogComponent, {
      width: '600px'
    }).afterClosed();
  }

  onGuardarFamilia(input: any): Observable<FamiliaMueble> {
    return this.genericService.onSave(this.saveFamiliaGQL, input);
  }

  onGuardarTipo(input: any): Observable<TipoMueble> {
    return this.genericService.onSave(this.saveTipoGQL, input);
  }

  onFiltrarFamilias(texto: string): Observable<FamiliaMueble[]> {
    return this.genericService.onGetByTexto(this.familiaSearchGQL, texto);
  }

  onFiltrarTipos(texto: string): Observable<TipoMueble[]> {
    return this.genericService.onGetByTexto(this.tipoMuebleSearchGQL, texto);
  }

  abrirAdicionarTipo(familiaId?: number): Observable<TipoMueble | undefined> {
    return this.dialog.open(AdicionarTipoMuebleDialogComponent, {
      width: '600px',
      data: { familiaId }
    }).afterClosed();
  }

  abrirBuscadorMoneda(): Observable<any | undefined> {
    const tableData: TableData[] = [
      { id: 'denominacion', nombre: 'Denominación' },
      { id: 'simbolo', nombre: 'Símbolo' }
    ];

    const data: SearchListtDialogData = {
      titulo: 'Buscar Moneda',
      query: this.monedasSearchGQL,
      tableData: tableData,
      inicialSearch: true
    };

    return this.dialog.open(SearchListDialogComponent, {
      width: '400px',
      data: data
    }).afterClosed();
  }
}
