import { Injectable, inject, Injector } from '@angular/core';
import { VehiculoByIdGQL } from '../graphql/vehiculoById';
import { SaveVehiculoGQL } from '../graphql/saveVehiculo';
import { DeleteVehiculoGQL } from '../graphql/deleteVehiculo';
import { VehiculoSearchPageGQL } from '../graphql/vehiculoSearchPage';
import { BehaviorSubject, Observable, of, forkJoin } from 'rxjs';
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
import { AdicionarModeloDialogComponent } from '../dialogs/adicionar-modelo-dialog/adicionar-modelo-dialog.component';
import { AdicionarTipoVehiculoDialogComponent } from '../dialogs/adicionar-tipo-vehiculo-dialog/adicionar-tipo-vehiculo-dialog.component';
import { ContextoConsulta, GenericCrudService, PROPAGAR_ERROR_DE_RED, QueryError } from '../../../../../generics/generic-crud.service';
import { FuncionarioSearchGQL } from '../../../../personas/funcionarios/graphql/funcionarioSearch';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { PageInfo } from '../../../../../app.component';
import { PaginacionLista } from '../../../../../shared/components/paginacion/paginacion-lista';
import { Funcionario } from '../../../../personas/funcionarios/funcionario.model';
import { VehiculoDialogService } from './vehiculo-dialog-service.service';
import { MatDialog } from '@angular/material/dialog';
import { EnteService } from '../../../ente/service/ente.service';
import { EnteSucursal } from '../../../ente/models/ente-sucursal.model';
import { TipoEnte } from '../../../ente/enums/tipo-ente.enum';
import { EnteSucursalInput } from '../../../ente/models/ente-sucursal-input.model';
import { EnteSucursalDialogComponent } from '../../../ente/dialogs/ente-sucursal-dialog/ente-sucursal-dialog.component';

export type SearchDialogResponse<T> = T & { adicionar?: boolean };

@Injectable({
  providedIn: 'root'
})
export class VehiculoService {
  private genericService = inject(GenericCrudService);
  private vehiculoByIdGQL = inject(VehiculoByIdGQL);
  private saveVehiculoGQL = inject(SaveVehiculoGQL);
  private deleteVehiculoGQL = inject(DeleteVehiculoGQL);
  private vehiculoSearchPageGQL = inject(VehiculoSearchPageGQL);
  private modeloSearchPageGQL = inject(ModeloSearchPageGQL);
  private tipoVehiculoSearchPageGQL = inject(TipoVehiculoSearchPageGQL);
  private marcaSearchGQL = inject(MarcaSearchGQL);
  private saveMarcaGQL = inject(SaveMarcaGQL);
  private saveModeloGQL = inject(SaveModeloGQL);
  private deleteModeloGQL = inject(DeleteModeloGQL);
  private saveTipoVehiculoGQL = inject(SaveTipoVehiculoGQL);
  private funcionarioSearchGQL = inject(FuncionarioSearchGQL);
  private enteService = inject(EnteService);
  private dialog = inject(MatDialog);
  private injector = inject(Injector);
  abrirFormulario(vehiculo?: Vehiculo): Observable<boolean | undefined> {
    return this.injector.get(VehiculoDialogService).abrirFormulario(vehiculo);
  }
  private _searchText$ = new BehaviorSubject<string>('');
  public searchText$ = this._searchText$.asObservable();

  private _tiposVehiculoSubject = new BehaviorSubject<TipoVehiculo[]>([]);
  public tiposVehiculo$ = this._tiposVehiculoSubject.asObservable();

  private _tipoFilter$ = new BehaviorSubject<number | null>(null);
  public tipoFilter$ = this._tipoFilter$.asObservable();

  /**
   * Vehículos paginados y filtrados por tipo en el central (#772); antes se traían 1000 y se filtraba y paginaba
   * acá. Gana la última página pedida; si falla un cambio de página vuelve a la anterior.
   */
  readonly pag = new PaginacionLista<Vehiculo>({
    cargar: (page, size) => this.genericService.onCustomQuery(this.vehiculoSearchPageGQL,
      { texto: this._searchText$.value, page, size, tipoVehiculoId: this._tipoFilter$.value }),
    pageSize: 15,
  });
  public filteredVehiculos$ = this.pag.items$;
  public loading$ = this.pag.cargando$;

  private _sucursalFilter$ = new BehaviorSubject<number | null>(null);
  public sucursalFilter$ = this._sucursalFilter$.asObservable();

  private _responsableFilter$ = new BehaviorSubject<number | null>(null);
  public responsableFilter$ = this._responsableFilter$.asObservable();

  private _searchTextSucursal$ = new BehaviorSubject<string | null>(null);
  public searchTextSucursal$ = this._searchTextSucursal$.asObservable();

  /** Ente del vehículo elegido en «Vehículo por sucursal» (#774). */
  private _enteFilterSucursal$ = new BehaviorSubject<number | null>(null);

  /** Vehículos asignados a sucursales, paginados en el central (#772). */
  readonly pagSucursal = new PaginacionLista<EnteSucursal>({
    cargar: (page, size) => this.enteService.onBuscarAsignacionesPagina(this._searchTextSucursal$.value,
      this._sucursalFilter$.value, TipoEnte.VEHICULO, this._responsableFilter$.value, page, size,
      this._enteFilterSucursal$.value),
    pageSize: 15,
  });
  public vehiculosSucursal$ = this.pagSucursal.items$;

  /** Sin `errorConf` un error falla hacia quien llama. Con él llega solo lo que se pida propagar: pedir el de red, o queda esperando (#390). */
  onBuscarPorId(id: number, errorConf?: QueryError, contexto?: ContextoConsulta): Observable<Vehiculo> {
    return this.genericService.onGetById(this.vehiculoByIdGQL, id, null, null, true, null, null, null, null, null, null,
      errorConf, contexto);
  }

  /** `volverAPagina1`: un filtro nuevo (Buscar); sin él repite la página a la vista (tras guardar o borrar). */
  refrescar(volverAPagina1 = false): void {
    if (volverAPagina1) this.pag.filtrar();
    else this.pag.recargar();
  }

  setSearchText(texto: string): void {
    this._searchText$.next(texto);
    this.pag.filtrar();
  }

  /** El servicio es singleton: una lista recién abierta arranca sin el filtro ni la página de la anterior (#589). Conserva el tamaño de página. */
  reiniciarFiltros(): void {
    this._searchText$.next('');
    this._tipoFilter$.next(null);
    this.pag.limpiar();
  }

  cargarTiposCache(): void {
    if (this._tiposVehiculoSubject.value.length === 0) {
      this.onFiltrarTipos('%').subscribe(res => {
        this._tiposVehiculoSubject.next(res);
      });
    }
  }



  updateTipoFilter(tipoId: number | null): void {
    this._tipoFilter$.next(tipoId);
    this.pag.filtrar();
  }

  /** Propaga el error de red: sin eso el genérico se lo traga y el formulario no se entera (#390). */
  onGuardar(input: VehiculoInput): Observable<Vehiculo> {
    return this.genericService.onSave(this.saveVehiculoGQL, input, undefined, undefined, true, PROPAGAR_ERROR_DE_RED).pipe(
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
      this.genericService.onCustomQuery(this.modeloSearchPageGQL, { texto, page: 0, size: 500 }).subscribe({
        next: res => {
          obs.next(res?.getContent || []);
          obs.complete();
        },
        error: err => obs.error(err)
      });
    });
  }

  onFiltrarTipos(texto: string): Observable<TipoVehiculo[]> {
    return new Observable(obs => {
      this.genericService.onCustomQuery(this.tipoVehiculoSearchPageGQL, { texto, page: 0, size: 500 }).subscribe({
        next: res => {
          obs.next(res?.getContent || []);
          obs.complete();
        },
        error: err => obs.error(err)
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

  onBuscarVehiculosSucursalPorVehiculo(vehiculoId: number): Observable<EnteSucursal[]> {
    return this.enteService.onGetByReferenciaId(TipoEnte.VEHICULO, vehiculoId).pipe(
      switchMap(ente => {
        if (!ente) return of([]);
        return this.enteService.getEnteSucursalByEnteId(ente.id!);
      })
    );
  }

  onGuardarVehiculoSucursal(input: EnteSucursalInput): Observable<EnteSucursal> {
    return this.enteService.onGuardarEnteSucursal(input);
  }

  onBuscarTodosVehiculosSucursal(page: number = 0, size: number = 1000): Observable<EnteSucursal[]> {
    return of([]);
  }

  onBuscarVehiculosSucursalPorSucursal(sucursalId: number): Observable<EnteSucursal[]> {
    return of([]);
  }

  onBuscarVehiculosSucursalSearchPage(sucursalId: number | null, responsableId: number | null, page: number, size: number): Observable<PageInfo<EnteSucursal>> {
    return of({ getContent: [], getTotalElements: 0 } as any);
  }

  /** Repite la página a la vista. */
  refrescarSucursal(): void {
    this.pagSucursal.recargar();
  }

  setSucursalFilter(id: number | null): void {
    this._sucursalFilter$.next(id);
    this.pagSucursal.filtrar();
  }

  setResponsableFilter(id: number | null): void {
    this._responsableFilter$.next(id);
    this.pagSucursal.filtrar();
  }

  setSearchTextSucursal(texto: string | null): void {
    this._searchTextSucursal$.next(texto);
    this.pagSucursal.filtrar();
  }

  setEnteFilterSucursal(enteId: number | null): void {
    this._enteFilterSucursal$.next(enteId);
    this.pagSucursal.filtrar();
  }

  /**
   * El servicio es singleton: la lista por sucursal recién abierta arranca sin los filtros de la anterior, que la
   * pantalla ya no muestra, y en la página 1 (como #589).
   */
  reiniciarFiltrosSucursal(): void {
    this._sucursalFilter$.next(null);
    this._responsableFilter$.next(null);
    this._searchTextSucursal$.next(null);
    this._enteFilterSucursal$.next(null);
    this.pagSucursal.filtrar();
  }

  abrirFormularioSucursal(enteSucursal?: EnteSucursal, vehiculo?: Vehiculo): Observable<EnteSucursal | undefined> {
    if (vehiculo && !enteSucursal) {
      return this.enteService.onGetByReferenciaId(TipoEnte.VEHICULO, vehiculo.id!).pipe(
        switchMap(ente => {
          if (!ente) return of(undefined);
          const dialogRef = this.dialog.open(EnteSucursalDialogComponent, {
            width: '600px',
            disableClose: true,
            autoFocus: false,
            data: { ente, sucursalId: this._sucursalFilter$.value }
          });
          return dialogRef.afterClosed();
        }),
        tap(res => {
          if (res) this.refrescarSucursal();
        })
      );
    }

    const dialogRef = this.dialog.open(EnteSucursalDialogComponent, {
      width: '600px',
      disableClose: true,
      autoFocus: false,
      data: enteSucursal ? { enteSucursal } : { sucursalId: this._sucursalFilter$.value }
    });

    return dialogRef.afterClosed().pipe(
      tap(res => {
        if (res) this.refrescarSucursal();
      })
    );
  }

  onEliminarVehiculoSucursal(enteSucursal: EnteSucursal): Observable<boolean> {
    const id = enteSucursal?.id;
    if (!id) return of(false);
    return this.enteService.onEliminarEnteSucursal(id).pipe(
      tap(res => {
        if (res) this.refrescarSucursal();
      })
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

    const data: any = {
      query: this.funcionarioSearchGQL,
      tableData: tableData,
      titulo: 'Buscar Responsable',
      search: true,
      inicialSearch: true,
      isServidor: true
    };

    return this.dialog.open(SearchListDialogComponent, {
      data: data,
      width: '60%',
      height: '80%'
    }).afterClosed();
  }
}

