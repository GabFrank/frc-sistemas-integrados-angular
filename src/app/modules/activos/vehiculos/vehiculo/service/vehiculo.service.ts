import { Injectable, inject, Injector } from '@angular/core';
import { VehiculoByIdGQL } from '../graphql/vehiculoById';
import { SaveVehiculoGQL } from '../graphql/saveVehiculo';
import { DeleteVehiculoGQL } from '../graphql/deleteVehiculo';
import { VehiculoSearchGQL } from '../graphql/vehiculoSearch';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { Vehiculo } from '../models/vehiculo.model';
import { VehiculoInput } from '../models/vehiculo-input.model';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { ModeloSearchPageGQL } from '../graphql/modeloSearchPage';
import { TipoVehiculoSearchPageGQL } from '../graphql/tipoVehiculoSearchPage';
import { MarcaSearchGQL } from '../graphql/marcaSearch';
import { SaveMarcaGQL } from '../graphql/saveMarca';
import { SaveModeloGQL } from '../graphql/saveModelo';
import { Modelo } from '../models/modelo.model';
import { TipoVehiculo } from '../models/tipo-vehiculo.model';
import { Marca } from '../models/marca.model';
import { MarcaInput } from '../models/marca-input.model';
import { ModeloInput } from '../models/modelo-input.model';
import { TipoVehiculoInput } from '../models/tipo-vehiculo-input.model';
import { SaveTipoVehiculoGQL } from '../graphql/saveTipoVehiculo';
import { DeleteModeloGQL } from '../graphql/deleteModelo';
import { VehiculosSucursalByVehiculoGQL } from '../graphql/vehiculosSucursalByVehiculo';
import { VehiculosSucursalBySucursalGQL } from '../graphql/vehiculosSucursalBySucursal';
import { VehiculosSucursalGQL } from '../graphql/vehiculosSucursal';
import { SaveVehiculoSucursalGQL } from '../graphql/saveVehiculoSucursal';
import { DeleteVehiculoSucursalGQL } from '../graphql/deleteVehiculoSucursal';
import { VehiculoSucursal } from '../models/vehiculo-sucursal.model';
import { VehiculoSucursalInput } from '../models/vehiculo-sucursal-input.model';
import { VehiculosSucursalSearchPageGQL } from '../graphql/vehiculosSucursalSearchPage';
import { MatDialog } from '@angular/material/dialog';
import { VehiculoSucursalDialogComponent } from '../dialogs/vehiculo-sucursal-dialog/vehiculo-sucursal-dialog.component';
import { AdicionarModeloDialogComponent } from '../dialogs/adicionar-modelo-dialog/adicionar-modelo-dialog.component';
import { AdicionarTipoVehiculoDialogComponent } from '../dialogs/adicionar-tipo-vehiculo-dialog/adicionar-tipo-vehiculo-dialog.component';
import { GenericCrudService } from '../../../../../generics/generic-crud.service';
import { FuncionarioSearchGQL } from '../../../../personas/funcionarios/graphql/funcionarioSearch';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { PageInfo } from '../../../../../app.component';
import { Funcionario } from '../../../../personas/funcionarios/funcionario.model';
import { VehiculoDialogService } from './vehiculo-dialog-service.service';
import { EnteService } from '../../../ente/service/ente.service';
import { TipoEnte } from '../../../ente/enums/tipo-ente.enum';
import { Ente } from '../../../ente/models/ente.model';
import { EnteInput } from '../../../ente/models/ente-input.model';
import { EnteSucursalInput } from '../../../ente/models/ente-sucursal-input.model';

export type SearchDialogResponse<T> = T & { adicionar?: boolean };

@Injectable({
  providedIn: 'root'
})
export class VehiculoService {
  private genericService = inject(GenericCrudService);
  private vehiculoByIdGQL = inject(VehiculoByIdGQL);
  private saveVehiculoGQL = inject(SaveVehiculoGQL);
  private deleteVehiculoGQL = inject(DeleteVehiculoGQL);
  private vehiculoSearchGQL = inject(VehiculoSearchGQL);
  private modeloSearchPageGQL = inject(ModeloSearchPageGQL);
  private tipoVehiculoSearchPageGQL = inject(TipoVehiculoSearchPageGQL);
  private marcaSearchGQL = inject(MarcaSearchGQL);
  private saveMarcaGQL = inject(SaveMarcaGQL);
  private saveModeloGQL = inject(SaveModeloGQL);
  private deleteModeloGQL = inject(DeleteModeloGQL);
  private saveTipoVehiculoGQL = inject(SaveTipoVehiculoGQL);
  private vehiculosSucursalByVehiculoGQL = inject(VehiculosSucursalByVehiculoGQL);
  private vehiculosSucursalBySucursalGQL = inject(VehiculosSucursalBySucursalGQL);
  private vehiculosSucursalGQL = inject(VehiculosSucursalGQL);
  private saveVehiculoSucursalGQL = inject(SaveVehiculoSucursalGQL);
  private deleteVehiculoSucursalGQL = inject(DeleteVehiculoSucursalGQL);
  private vehiculosSucursalSearchPageGQL = inject(VehiculosSucursalSearchPageGQL);
  private funcionarioSearchGQL = inject(FuncionarioSearchGQL);
  private enteService = inject(EnteService);
  private dialog = inject(MatDialog);
  private injector = inject(Injector);
  private _vehiculoDialogService: VehiculoDialogService;
  private get vehiculoDialogService(): VehiculoDialogService {
    if (!this._vehiculoDialogService) {
      this._vehiculoDialogService = this.injector.get(VehiculoDialogService);
    }
    return this._vehiculoDialogService;
  }
  private vehiculosSubject = new BehaviorSubject<Vehiculo[]>([]);
  public vehiculos$ = this.vehiculosSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private _searchText$ = new BehaviorSubject<string>('');
  public searchText$ = this._searchText$.asObservable();

  private _tiposVehiculoSubject = new BehaviorSubject<TipoVehiculo[]>([]);
  public tiposVehiculo$ = this._tiposVehiculoSubject.asObservable();

  private _paginationState$ = new BehaviorSubject<{ pageIndex: number, pageSize: number }>({
    pageIndex: 0,
    pageSize: 15
  });
  public paginationState$ = this._paginationState$.asObservable();

  private _tipoFilter$ = new BehaviorSubject<number | null>(null);
  public tipoFilter$ = this._tipoFilter$.asObservable();

  public totalElements$ = combineLatest([
    this.vehiculos$,
    this._tipoFilter$
  ]).pipe(
    map(([vehiculos, tipoId]) => {
      if (tipoId !== null && tipoId !== undefined) {
        return vehiculos.filter(v => v.tipoVehiculo?.id == tipoId).length;
      }
      return vehiculos.length;
    })
  );

  public filteredVehiculos$ = combineLatest([
    this.vehiculos$,
    this._tipoFilter$,
    this._paginationState$
  ]).pipe(
    map(([vehiculos, tipoId, pag]) => {
      let filtered = vehiculos;
      if (tipoId !== null && tipoId !== undefined) {
        filtered = vehiculos.filter(v => v.tipoVehiculo?.id == tipoId);
      }
      const start = pag.pageIndex * pag.pageSize;
      const end = start + pag.pageSize;
      return filtered.slice(start, end);
    })
  );
  private vehiculosSucursalSubject = new BehaviorSubject<VehiculoSucursal[]>([]);
  public vehiculosSucursal$ = this.vehiculosSucursalSubject.asObservable();

  private _sucursalFilter$ = new BehaviorSubject<number | null>(null);
  public sucursalFilter$ = this._sucursalFilter$.asObservable();

  private _responsableFilter$ = new BehaviorSubject<number | null>(null);
  public responsableFilter$ = this._responsableFilter$.asObservable();

  private _paginationSucursalState$ = new BehaviorSubject<{ pageIndex: number, pageSize: number, totalElements: number }>({
    pageIndex: 0,
    pageSize: 15,
    totalElements: 0
  });
  public paginationSucursalState$ = this._paginationSucursalState$.asObservable();

  onBuscarPorId(id: number): Observable<Vehiculo> {
    return this.genericService.onGetById(this.vehiculoByIdGQL, id);
  }

  onFiltrar(texto: string, page: number, size: number): Observable<Vehiculo[]> {
    return this.genericService.onCustomQuery(this.vehiculoSearchGQL, { texto, page, size });
  }

  refrescar(): void {
    this.loadingSubject.next(true);
    const texto = this._searchText$.value;
    this.onFiltrar(texto, 0, 1000).subscribe({
      next: (res) => {
        this.vehiculosSubject.next(res || []);
        this.loadingSubject.next(false);
      },
      error: () => {
        this.loadingSubject.next(false);
      }
    });
  }

  setSearchText(texto: string): void {
    this._searchText$.next(texto);
    this.refrescar();
  }

  cargarTiposCache(): void {
    if (this._tiposVehiculoSubject.value.length === 0) {
      this.onFiltrarTipos('%').subscribe(res => {
        this._tiposVehiculoSubject.next(res);
      });
    }
  }

  abrirFormulario(vehiculo?: Vehiculo): Observable<boolean | undefined> {
    return this.vehiculoDialogService.abrirFormulario(vehiculo);
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this._paginationState$.next({ pageIndex, pageSize });
  }

  updateTipoFilter(tipoId: number | null): void {
    this._tipoFilter$.next(tipoId);
    this.updatePagination(0, this._paginationState$.value.pageSize);
  }

  onGuardar(input: VehiculoInput): Observable<Vehiculo> {
    return this.genericService.onSave(this.saveVehiculoGQL, input).pipe(
      tap(res => {
        if (res) this.refrescar();
      })
    );
  }

  onEliminar(id: number): Observable<boolean> {
    return this.genericService.onDelete(
      this.deleteVehiculoGQL,
      id,
      '¿Eliminar vehículo?',
      null,
      true,
      true,
      '¿Está seguro que desea eliminar este vehículo?'
    ).pipe(
      tap(res => {
        if (res) this.refrescar();
      })
    );
  }

  onFiltrarModelos(texto: string): Observable<Modelo[]> {
    return new Observable(obs => {
      this.genericService.onCustomQuery(this.modeloSearchPageGQL, { texto, page: 0, size: 500 }).subscribe(res => {
        obs.next(res?.getContent || []);
        obs.complete();
      });
    });
  }

  onFiltrarTipos(texto: string): Observable<TipoVehiculo[]> {
    return new Observable(obs => {
      this.genericService.onCustomQuery(this.tipoVehiculoSearchPageGQL, { texto, page: 0, size: 500 }).subscribe(res => {
        obs.next(res?.getContent || []);
        obs.complete();
      });
    });
  }

  onFiltrarMarcas(texto: string): Observable<Marca[]> {
    return this.genericService.onGetByTexto(this.marcaSearchGQL, texto);
  }

  onGuardarMarca(input: MarcaInput): Observable<Marca> {
    return this.genericService.onSave(this.saveMarcaGQL, input);
  }

  onGuardarModelo(input: ModeloInput): Observable<Modelo> {
    return this.genericService.onSave(this.saveModeloGQL, input);
  }

  onEliminarModelo(id: number): Observable<boolean> {
    return this.genericService.onDelete(
      this.deleteModeloGQL,
      id,
      '¿Eliminar modelo?',
      null,
      true,
      true,
      '¿Está seguro que desea eliminar este modelo?'
    );
  }

  onGuardarTipo(input: TipoVehiculoInput): Observable<TipoVehiculo> {
    return this.genericService.onSave(this.saveTipoVehiculoGQL, input);
  }

  onBuscarVehiculosSucursalPorVehiculo(vehiculoId: number): Observable<VehiculoSucursal[]> {
    return this.genericService.onCustomQuery(this.vehiculosSucursalByVehiculoGQL, { vehiculoId });
  }

  onGuardarVehiculoSucursal(input: VehiculoSucursalInput): Observable<VehiculoSucursal> {
    return this.genericService.onSave(this.saveVehiculoSucursalGQL, input).pipe(
      switchMap((vehiculoSucursal) =>
        this.syncEnteSucursalForVehiculo(input).pipe(
          map(() => vehiculoSucursal)
        )
      )
    );
  }

  private syncEnteSucursalForVehiculo(input: VehiculoSucursalInput): Observable<any> {
    if (!input?.vehiculoId || !input?.sucursalId) return of(null);

    return this.ensureEnteVehiculo(input.vehiculoId, input.usuarioId).pipe(
      switchMap((ente) => {
        if (!ente?.id) return of(null);
        return this.enteService.getEnteSucursalByEnteAndSucursal(ente.id, input.sucursalId).pipe(
          switchMap((exists) => {
            if (exists?.id) return of(exists);
            const enteSucursalInput: EnteSucursalInput = {
              enteId: ente.id,
              sucursalId: input.sucursalId,
              responsableId: input.responsableId || null,
              usuarioId: input.usuarioId
            };
            return this.enteService.onGuardarEnteSucursal(enteSucursalInput);
          })
        );
      })
    );
  }

  private ensureEnteVehiculo(vehiculoId: number, usuarioId?: number): Observable<Ente> {
    return this.enteService.onGetByReferenciaId(TipoEnte.VEHICULO, vehiculoId).pipe(
      catchError(() => {
        const enteInput: EnteInput = {
          tipoEnte: TipoEnte.VEHICULO,
          referenciaId: vehiculoId,
          activo: true,
          usuarioId
        };
        return this.enteService.onGuardar(enteInput);
      })
    );
  }


  onBuscarTodosVehiculosSucursal(page: number = 0, size: number = 1000): Observable<VehiculoSucursal[]> {
    return this.genericService.onCustomQuery(this.vehiculosSucursalGQL, { page, size });
  }

  onBuscarVehiculosSucursalPorSucursal(sucursalId: number): Observable<VehiculoSucursal[]> {
    return this.genericService.onCustomQuery(this.vehiculosSucursalBySucursalGQL, { sucursalId });
  }

  onBuscarVehiculosSucursalSearchPage(sucursalId: number | null, responsableId: number | null, page: number, size: number): Observable<PageInfo<VehiculoSucursal>> {
    return this.genericService.onCustomQuery(this.vehiculosSucursalSearchPageGQL, { sucursalId, responsableId, page, size });
  }

  refrescarSucursal(): void {
    this.loadingSubject.next(true);
    const sucursalId = this._sucursalFilter$.value;
    const responsableId = this._responsableFilter$.value;
    const { pageIndex, pageSize } = this._paginationSucursalState$.value;

    this.onBuscarVehiculosSucursalSearchPage(sucursalId, responsableId, pageIndex, pageSize).subscribe({
      next: (res) => {
        this.vehiculosSucursalSubject.next(res?.getContent || []);
        this._paginationSucursalState$.next({
          ...this._paginationSucursalState$.value,
          totalElements: res?.getTotalElements || 0
        });
        this.loadingSubject.next(false);
      },
      error: () => this.loadingSubject.next(false)
    });
  }

  setSucursalFilter(id: number | null): void {
    this._sucursalFilter$.next(id);
    this.updatePaginationSucursal(0, this._paginationSucursalState$.value.pageSize);
  }

  setResponsableFilter(id: number | null): void {
    this._responsableFilter$.next(id);
    this.updatePaginationSucursal(0, this._paginationSucursalState$.value.pageSize);
  }

  updatePaginationSucursal(pageIndex: number, pageSize: number): void {
    this._paginationSucursalState$.next({
      ...this._paginationSucursalState$.value,
      pageIndex,
      pageSize
    });
    this.refrescarSucursal();
  }

  abrirFormularioSucursal(vehiculoSucursal?: VehiculoSucursal): Observable<VehiculoSucursal | undefined> {
    const dialogRef = this.dialog.open(VehiculoSucursalDialogComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false,
      data: vehiculoSucursal ? { vehiculoSucursal, vehiculo: vehiculoSucursal.vehiculo } : {}
    });

    return dialogRef.afterClosed().pipe(
      tap(res => {
        if (res) this.refrescarSucursal();
      })
    );
  }

  onEliminarVehiculoSucursal(vehiculoSucursal: VehiculoSucursal): Observable<boolean> {
    const id = vehiculoSucursal?.id;
    if (!id) return of(false);
    return this.genericService.onDelete(
      this.deleteVehiculoSucursalGQL,
      id,
      '¿Eliminar asignación de vehículo a sucursal?',
      null,
      true,
      true,
      '¿Está seguro que desea eliminar esta asignación?'
    ).pipe(
      switchMap(res => {
        if (!res) return of(false);
        return this.unlinkEnteSucursalForVehiculo(vehiculoSucursal).pipe(
          map(() => true),
          catchError(() => of(true))
        );
      }),
      tap(res => {
        if (res) this.refrescarSucursal();
      })
    );
  }

  private unlinkEnteSucursalForVehiculo(vehiculoSucursal: VehiculoSucursal): Observable<any> {
    const vehiculoId = vehiculoSucursal?.vehiculo?.id;
    const sucursalId = vehiculoSucursal?.sucursal?.id;
    if (!vehiculoId || !sucursalId) return of(null);

    return this.enteService.onGetByReferenciaId(TipoEnte.VEHICULO, vehiculoId).pipe(
      switchMap((ente) => {
        if (!ente?.id) return of(null);
        return this.enteService.getEnteSucursalByEnteAndSucursal(ente.id, sucursalId).pipe(
          switchMap((enteSucursal) => {
            if (!enteSucursal?.id) return of(null);
            return this.enteService.onEliminarEnteSucursal(enteSucursal.id);
          })
        );
      }),
      catchError(() => of(null))
    );
  }

  abrirBuscadorTipoVehiculo(isAdicionar: boolean = false): Observable<SearchDialogResponse<TipoVehiculo> | undefined> {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'ID', width: '10%' },
      { id: 'descripcion', nombre: 'Descripción' }
    ];

    const data: SearchListtDialogData = {
      titulo: 'Buscar Tipo de Vehículo',
      query: this.tipoVehiculoSearchPageGQL,
      tableData: tableData,
      inicialSearch: true,
      isServidor: true,
      isAdicionar: isAdicionar,
      paginator: true
    };

    return this.dialog.open(SearchListDialogComponent, {
      width: '800px',
      data: data
    }).afterClosed();
  }

  abrirBuscadorModelo(isAdicionar: boolean = false): Observable<SearchDialogResponse<Modelo> | undefined> {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'ID', width: '10%' },
      { id: 'marca.descripcion', nombre: 'Marca' },
      { id: 'descripcion', nombre: 'Modelo' }
    ];

    const data: SearchListtDialogData = {
      titulo: 'Buscar Modelo',
      query: this.modeloSearchPageGQL,
      tableData: tableData,
      inicialSearch: true,
      isServidor: true,
      isAdicionar: isAdicionar,
      paginator: true
    };

    return this.dialog.open(SearchListDialogComponent, {
      width: '800px',
      data: data
    }).afterClosed();
  }

  abrirAdicionarModelo(): Observable<Modelo> {
    return this.dialog.open(AdicionarModeloDialogComponent, {
      width: '500px'
    }).afterClosed();
  }

  abrirAdicionarTipoVehiculo(): Observable<TipoVehiculo> {
    return this.dialog.open(AdicionarTipoVehiculoDialogComponent, {
      width: '500px'
    }).afterClosed();
  }

  abrirBuscadorResponsable(): Observable<SearchDialogResponse<Funcionario> | undefined> {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'Id' },
      {
        id: 'nombre',
        nombre: 'Nombre',
        nested: true,
        nestedId: 'persona',
        nestedColumnId: 'nombre'
      }
    ];

    const data: SearchListtDialogData = {
      query: this.funcionarioSearchGQL,
      tableData: tableData,
      titulo: 'Buscar Responsable',
      search: true,
      inicialSearch: true
    };

    return this.dialog.open(SearchListDialogComponent, {
      data: data,
      width: '60%',
      height: '80%'
    }).afterClosed();
  }
}

