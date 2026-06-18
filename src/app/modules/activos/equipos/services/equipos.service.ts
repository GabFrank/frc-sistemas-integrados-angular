import { Injectable, inject, Injector } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { PageInfo } from '../../../../app.component';
import { Equipo } from '../models/equipo.model';
import { EquipoInput } from '../models/equipo-input.model';
import { TipoEquipo } from '../models/tipo-equipo.model';
import { TipoEquipoInput } from '../models/tipo-equipo-input.model';
import { MarcaEquipo } from '../models/marca-equipo.model';
import { MarcaEquipoInput } from '../models/marca-equipo-input.model';
import { ModeloEquipo } from '../models/modelo-equipo.model';
import { ModeloEquipoInput } from '../models/modelo-equipo-input.model';
import { EquipoByIdGQL } from '../graphql/equipoById';
import { EquipoSearchPageGQL } from '../graphql/equipoSearchPage';
import { SaveEquipoGQL } from '../graphql/saveEquipo';
import { DeleteEquipoGQL } from '../graphql/deleteEquipo';
import { TipoEquipoSearchPageGQL } from '../graphql/tipoEquipoSearchPage';
import { SaveTipoEquipoGQL } from '../graphql/saveTipoEquipo';
import { MarcaEquipoSearchGQL } from '../graphql/marcaEquipoSearch';
import { ModeloEquipoSearchPageGQL } from '../graphql/modeloEquipoSearchPage';
import { SaveMarcaEquipoGQL } from '../graphql/saveMarcaEquipo';
import { SaveModeloEquipoGQL } from '../graphql/saveModeloEquipo';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { AdicionarTipoEquipoDialogComponent } from '../dialogs/adicionar-tipo-equipo-dialog/adicionar-tipo-equipo-dialog.component';
import { AdicionarModeloEquipoDialogComponent } from '../dialogs/adicionar-modelo-equipo-dialog/adicionar-modelo-equipo-dialog.component';
import { EquipoDialogService } from './equipo-dialog.service';

export type SearchDialogResponse<T> = T & { adicionar?: boolean };

@Injectable({
  providedIn: 'root'
})
export class EquiposService {
  private genericService = inject(GenericCrudService);
  private equipoByIdGQL = inject(EquipoByIdGQL);
  private saveEquipoGQL = inject(SaveEquipoGQL);
  private deleteEquipoGQL = inject(DeleteEquipoGQL);
  private equipoSearchPageGQL = inject(EquipoSearchPageGQL);
  private tipoEquipoSearchPageGQL = inject(TipoEquipoSearchPageGQL);
  private saveTipoEquipoGQL = inject(SaveTipoEquipoGQL);
  private marcaEquipoSearchGQL = inject(MarcaEquipoSearchGQL);
  private modeloEquipoSearchPageGQL = inject(ModeloEquipoSearchPageGQL);
  private saveMarcaEquipoGQL = inject(SaveMarcaEquipoGQL);
  private saveModeloEquipoGQL = inject(SaveModeloEquipoGQL);
  private dialog = inject(MatDialog);
  private injector = inject(Injector);

  private equiposSubject = new BehaviorSubject<Equipo[]>([]);
  public equipos$ = this.equiposSubject.asObservable();

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

  onBuscarPorId(id: number): Observable<Equipo> {
    return this.genericService.onGetById(this.equipoByIdGQL, id);
  }

  onFiltrar(texto: string, page: number, size: number): Observable<PageInfo<Equipo>> {
    return this.genericService.onCustomQuery(this.equipoSearchPageGQL, { texto, page, size });
  }

  refrescar(): void {
    this.loadingSubject.next(true);
    const texto = this._searchText$.value;
    const { pageIndex, pageSize } = this._paginationState$.value;
    this.onFiltrar(texto, pageIndex, pageSize).subscribe({
      next: (res) => {
        this.equiposSubject.next(res?.getContent || []);
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

  abrirFormulario(equipo?: Equipo): Observable<boolean | undefined> {
    return this.injector.get(EquipoDialogService).abrirFormulario(equipo);
  }

  onGuardar(input: EquipoInput): Observable<Equipo> {
    return this.genericService.onSave(this.saveEquipoGQL, input).pipe(
      tap((res) => {
        if (res) {
          this.refrescar();
        }
      })
    );
  }

  onEliminar(id: number): Observable<boolean> {
    return this.genericService.onDelete(
      this.deleteEquipoGQL,
      id,
      '¿Eliminar equipo?',
      null,
      true,
      true,
      '¿Está seguro que desea eliminar este equipo?'
    ).pipe(
      tap((res) => {
        if (res) {
          this.refrescar();
        }
      })
    );
  }

  abrirBuscadorTipoEquipo(): Observable<TipoEquipo | { adicionar: boolean } | undefined> {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'ID', width: '10%' },
      { id: 'descripcion', nombre: 'Descripción' }
    ];

    const data: SearchListtDialogData = {
      titulo: 'Buscar Tipo de Equipo',
      query: this.tipoEquipoSearchPageGQL,
      tableData,
      inicialSearch: true,
      isAdicionar: true,
      isServidor: true,
      paginator: true
    };

    return this.dialog.open(SearchListDialogComponent, {
      width: '600px',
      data
    }).afterClosed();
  }

  abrirAdicionarTipoEquipo(): Observable<TipoEquipo | undefined> {
    return this.dialog.open(AdicionarTipoEquipoDialogComponent, {
      width: '600px'
    }).afterClosed();
  }

  onGuardarTipoEquipo(input: TipoEquipoInput): Observable<TipoEquipo> {
    return this.genericService.onSave(this.saveTipoEquipoGQL, input);
  }

  onFiltrarMarcas(texto: string): Observable<MarcaEquipo[]> {
    return this.genericService.onGetByTexto(this.marcaEquipoSearchGQL, texto);
  }

  onGuardarMarca(input: MarcaEquipoInput): Observable<MarcaEquipo> {
    return this.genericService.onSave(this.saveMarcaEquipoGQL, input);
  }

  onGuardarModelo(input: ModeloEquipoInput): Observable<ModeloEquipo> {
    return this.genericService.onSave(this.saveModeloEquipoGQL, input);
  }

  abrirBuscadorModelo(isAdicionar: boolean = false): Observable<SearchDialogResponse<ModeloEquipo> | undefined> {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'ID', width: '10%' },
      { id: 'marca.descripcion', nombre: 'Marca' },
      { id: 'descripcion', nombre: 'Modelo' }
    ];

    const data: SearchListtDialogData = {
      titulo: 'Buscar Modelo de Equipo',
      query: this.modeloEquipoSearchPageGQL,
      tableData,
      inicialSearch: true,
      isServidor: true,
      isAdicionar: isAdicionar,
      paginator: true
    };

    return this.dialog.open(SearchListDialogComponent, {
      width: '800px',
      data
    }).afterClosed();
  }

  abrirAdicionarModelo(): Observable<ModeloEquipo | undefined> {
    return this.dialog.open(AdicionarModeloEquipoDialogComponent, {
      width: '600px'
    }).afterClosed();
  }
}
