import { Injectable, inject } from '@angular/core';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { VehiculoByIdGQL } from '../graphql/vehiculoById';
import { SaveVehiculoGQL } from '../graphql/saveVehiculo';
import { DeleteVehiculoGQL } from '../graphql/deleteVehiculo';
import { VehiculoSearchGQL } from '../graphql/vehiculoSearch';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { Vehiculo } from '../models/vehiculo.model';
import { VehiculoInput } from '../models/vehiculo-input.model';
import { map, tap } from 'rxjs/operators';
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
import { VehiculoComponent } from '../dialogs/vehiculo-form/vehiculo.component';

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
  private dialog = inject(MatDialog);
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
      if (tipoId) {
        return vehiculos.filter(v => v.tipoVehiculo?.id === tipoId).length;
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
      if (tipoId) {
        filtered = vehiculos.filter(v => v.tipoVehiculo?.id === tipoId);
      }
      const start = pag.pageIndex * pag.pageSize;
      const end = start + pag.pageSize;
      return filtered.slice(start, end);
    })
  );

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

  abrirFormulario(vehiculo?: Vehiculo): Observable<any> {
    const dialogRef = this.dialog.open(VehiculoComponent, {
      width: '800px',
      data: vehiculo,
      disableClose: true,
      autoFocus: false
    });

    return dialogRef.afterClosed().pipe(
      tap(res => {
        if (res) this.refrescar();
      })
    );
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
    return this.genericService.onSave(this.saveVehiculoSucursalGQL, input);
  }

  onEliminarVehiculoSucursal(id: number): Observable<boolean> {
    return this.genericService.onDelete(
      this.deleteVehiculoSucursalGQL,
      id,
      '¿Eliminar asignación de vehículo a sucursal?',
      null,
      true,
      true,
      '¿Está seguro que desea eliminar esta asignación?'
    );
  }

  onBuscarTodosVehiculosSucursal(page: number = 0, size: number = 1000): Observable<VehiculoSucursal[]> {
    return this.genericService.onCustomQuery(this.vehiculosSucursalGQL, { page, size });
  }

  onBuscarVehiculosSucursalPorSucursal(sucursalId: number): Observable<VehiculoSucursal[]> {
    return this.genericService.onCustomQuery(this.vehiculosSucursalBySucursalGQL, { sucursalId });
  }

  onBuscarVehiculosSucursalSearchPage(sucursalId: number | null, responsableId: number | null, page: number, size: number): Observable<any> {
    return this.genericService.onCustomQuery(this.vehiculosSucursalSearchPageGQL, { sucursalId, responsableId, page, size });
  }
}

