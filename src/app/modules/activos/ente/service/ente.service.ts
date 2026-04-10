import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, map } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { EnteByIdGQL } from '../graphql/enteById';
import { SaveEnteGQL } from '../graphql/saveEnte';
import { DeleteEnteGQL } from '../graphql/deleteEnte';

import { EnteSearchWithSummaryGQL } from '../graphql/enteSearchWithSummary';
import { SaveEnteSucursalGQL } from '../graphql/saveEnteSucursal';
import { DeleteEnteSucursalGQL } from '../graphql/deleteEnteSucursal';
import { EntesSucursalesByEnteIdGQL } from '../graphql/entesSucursalesByEnteId';
import { EnteByReferenciaIdGQL } from '../graphql/enteByReferenciaId';
import { EnteSucursalSearchPageGQL } from '../graphql/enteSucursalSearchPage';
import { Ente } from '../models/ente.model';
import { TipoEnte } from '../enums/tipo-ente.enum';
import { EnteSucursal } from '../models/ente-sucursal.model';
import { EnteInput } from '../models/ente-input.model';
import { EnteSucursalInput } from '../models/ente-sucursal-input.model';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { PageInfo } from '../../../../app.component';
import { MainService } from '../../../../main.service';
import { VehiculoSearchPageGQL } from '../../vehiculos/vehiculo/graphql/vehiculoSearchPage';
import { MuebleSearchPageGQL } from '../../muebles/graphql/muebleSearchPage';
import { InmuebleSearchPageGQL } from '../../inmueble/graphql/inmuebleSearchPage';
import { FuncionarioSearchGQL } from '../../../personas/funcionarios/graphql/funcionarioSearch';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';
import { Mueble } from '../../muebles/models/mueble.model';
import { Vehiculo } from '../../vehiculos/vehiculo/models/vehiculo.model';
import { Inmueble } from '../../inmueble/models/inmueble.model';

@Injectable({
  providedIn: 'root'
})
export class EnteService {
  private genericService = inject(GenericCrudService);
  private enteByIdGQL = inject(EnteByIdGQL);
  private saveEnteGQL = inject(SaveEnteGQL);
  private deleteEnteGQL = inject(DeleteEnteGQL);

  private enteSearchWithSummaryGQL = inject(EnteSearchWithSummaryGQL);
  private saveEnteSucursalGQL = inject(SaveEnteSucursalGQL);
  private deleteEnteSucursalGQL = inject(DeleteEnteSucursalGQL);
  private entesSucursalesByEnteIdGQL = inject(EntesSucursalesByEnteIdGQL);
  private enteByReferenciaIdGQL = inject(EnteByReferenciaIdGQL);
  private enteSucursalSearchPageGQL = inject(EnteSucursalSearchPageGQL);
  private dialog = inject(MatDialog);
  private mainService = inject(MainService);
  private vehiculoSearchPageGQL = inject(VehiculoSearchPageGQL);
  private muebleSearchPageGQL = inject(MuebleSearchPageGQL);
  private inmuebleSearchPageGQL = inject(InmuebleSearchPageGQL);
  private funcionarioSearchGQL = inject(FuncionarioSearchGQL);

  private entesSubject = new BehaviorSubject<Ente[]>([]);
  private totalElementsSubject = new BehaviorSubject<number>(0);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private searchTextSubject = new BehaviorSubject<string>('');
  private sucursalIdSubject = new BehaviorSubject<number | null>(null);
  private tipoEnteSubject = new BehaviorSubject<TipoEnte | null>(null);
  private situacionPagoSubject = new BehaviorSubject<string | null>(null);
  private estadoCuotaSubject = new BehaviorSubject<string | null>(null);
  private paginationSubject = new BehaviorSubject({ pageIndex: 0, pageSize: 15 });
  private summarySubject = new BehaviorSubject<any>(null);

  public entes$ = this.entesSubject.asObservable();
  public totalElements$ = this.totalElementsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public paginationState$ = this.paginationSubject.asObservable();
  public sucursalId$ = this.sucursalIdSubject.asObservable();
  public summary$ = this.summarySubject.asObservable();

  constructor() {
    combineLatest([
      this.searchTextSubject.pipe(debounceTime(300), distinctUntilChanged()),
      this.sucursalIdSubject,
      this.tipoEnteSubject,
      this.situacionPagoSubject,
      this.estadoCuotaSubject,
      this.paginationSubject
    ]).pipe(
      tap(() => this.loadingSubject.next(true)),
      switchMap(([texto, sucursalId, tipoEnte, situacionPago, estadoCuota, pag]) =>
        this.genericService.onCustomQuery(this.enteSearchWithSummaryGQL, { 
          texto, sucursalId, tipoEnte, situacionPago, estadoCuota,
          page: pag.pageIndex, size: pag.pageSize 
        })
      )
    ).subscribe((res: any) => {
      if (res) {
        this.entesSubject.next(res.page.getContent);
        this.totalElementsSubject.next(res.page.getTotalElements);
        this.summarySubject.next(res.summary);
      }
      this.loadingSubject.next(false);
    });
  }

  refrescar(): void {
    this.paginationSubject.next({ ...this.paginationSubject.value });
  }

  setSearchText(texto: string): void {
    this.searchTextSubject.next(texto);
    this.paginationSubject.next({ ...this.paginationSubject.value, pageIndex: 0 });
  }

  setSucursalId(id: number | null): void {
    this.sucursalIdSubject.next(id);
    this.paginationSubject.next({ ...this.paginationSubject.value, pageIndex: 0 });
  }

  setFilters(tipo: TipoEnte | null, situacion: string | null, estado: string | null): void {
    this.tipoEnteSubject.next(tipo);
    this.situacionPagoSubject.next(situacion);
    this.estadoCuotaSubject.next(estado);
    this.paginationSubject.next({ ...this.paginationSubject.value, pageIndex: 0 });
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.paginationSubject.next({ pageIndex, pageSize });
  }

  onBuscarPorId(id: number): Observable<Ente> {
    return this.genericService.onGetById(this.enteByIdGQL, id);
  }

  onGuardar(input: EnteInput): Observable<Ente> {
    return this.genericService.onSave(this.saveEnteGQL, input);
  }

  onEliminar(id: number): Observable<boolean> {
    return this.genericService.onDelete(this.deleteEnteGQL, id, '¿Eliminar ente?');
  }

  onGetByReferenciaId(tipoEnte: TipoEnte, referenciaId: number): Observable<Ente> {
    return this.genericService.onCustomQuery(this.enteByReferenciaIdGQL, { tipoEnte, referenciaId });
  }



  onBuscarPagina(texto: string | null, sucursalId: number | null, page: number, size: number, tipoEnte: TipoEnte | null = null): Observable<PageInfo<Ente>> {
    return this.genericService.onCustomQuery(this.enteSearchWithSummaryGQL, { texto, sucursalId, tipoEnte, page, size }).pipe(
      map((res: any) => res?.page)
    );
  }

  onBuscarAsignacionesPagina(texto: string | null, sucursalId: number | null, tipoEnte: TipoEnte | null, responsableId: number | null, page: number, size: number): Observable<PageInfo<EnteSucursal>> {
    return this.genericService.onCustomQuery(this.enteSucursalSearchPageGQL, { texto, sucursalId, tipoEnte, responsableId, page, size });
  }

  getEnteSucursalByEnteId(enteId: number): Observable<EnteSucursal[]> {
    return this.genericService.onCustomQuery(this.entesSucursalesByEnteIdGQL, { enteId });
  }

  getEnteSucursalByEnteAndSucursal(enteId: number, sucursalId: number): Observable<EnteSucursal | null> {
    return this.genericService.onCustomQuery(this.entesSucursalesByEnteIdGQL, { enteId }).pipe(
      map(res => {
        const assignments = res as EnteSucursal[];
        return assignments.find(a => a.sucursal.id == sucursalId) || null;
      })
    );
  }

  onGuardarEnteSucursal(input: EnteSucursalInput): Observable<EnteSucursal> {
    return this.genericService.onSave(this.saveEnteSucursalGQL, input);
  }

  onEliminarEnteSucursal(id: number): Observable<boolean> {
    return this.genericService.onDelete(this.deleteEnteSucursalGQL, id, '¿Desvincular de la sucursal?', null, true, true, '¿Está seguro que desea retirar este bien de la sucursal?');
  }

  abrirBuscadorEnte(tipo: TipoEnte): Observable<Ente | undefined> {
    let query: VehiculoSearchPageGQL | MuebleSearchPageGQL | InmuebleSearchPageGQL | undefined;
    let tableData: TableData[] = [];
    let titulo = '';

    switch (tipo) {
      case TipoEnte.VEHICULO:
        query = this.vehiculoSearchPageGQL;
        titulo = 'Buscar Vehículo';
        tableData = [
          { id: 'id', nombre: 'Id', width: '10%' },
          { id: 'chapa', nombre: 'Chapa', width: '30%' },
          { id: 'modelo.marca.descripcion', nombre: 'Marca', width: '30%' },
          { id: 'modelo.descripcion', nombre: 'Modelo', width: '30%' }
        ];
        break;
      case TipoEnte.MUEBLE:
        query = this.muebleSearchPageGQL;
        titulo = 'Buscar Mueble';
        tableData = [
          { id: 'id', nombre: 'Id', width: '10%' },
          { id: 'descripcion', nombre: 'Descripción', width: '90%' }
        ];
        break;
      case TipoEnte.INMUEBLE:
        query = this.inmuebleSearchPageGQL;
        titulo = 'Buscar Inmueble';
        tableData = [
          { id: 'id', nombre: 'Id', width: '10%' },
          { id: 'nombreAsignado', nombre: 'Descripción', width: '90%' }
        ];
        break;
    }

    if (!query) return of(undefined);

    const data: SearchListtDialogData = {
      query,
      tableData,
      titulo,
      search: true,
      inicialSearch: true,
      paginator: true,
      isServidor: true
    };

    return this.dialog.open(SearchListDialogComponent, {
      data,
      width: '70vw',
      height: '80vh',
      disableClose: false,
      autoFocus: false
    }).afterClosed().pipe(
      switchMap((res: Vehiculo | Mueble | Inmueble | undefined) => {
        if (res) {
          return this.onGetByReferenciaId(tipo, res.id!).pipe(
            switchMap(ente => {
              if (ente) {
                return of(ente);
              } else {
                const input: EnteInput = {
                  tipoEnte: tipo,
                  referenciaId: res.id,
                  activo: true,
                  usuarioId: this.mainService.usuarioActual?.id
                };
                return this.onGuardar(input);
              }
            })
          );
        }
        return of(undefined);
      })
    );
  }

  abrirBuscadorResponsable(): Observable<Funcionario | undefined> {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'Id' },
      { id: 'persona.nombre', nombre: 'Nombre' }
    ];

    const data: SearchListtDialogData = {
      query: this.funcionarioSearchGQL,
      tableData,
      titulo: 'Buscar Responsable',
      search: true,
      inicialSearch: true,
      isServidor: true
    };

    return this.dialog.open(SearchListDialogComponent, {
      data,
      width: '60vw',
      height: '80vh',
      disableClose: false,
      autoFocus: false
    }).afterClosed();
  }
}
