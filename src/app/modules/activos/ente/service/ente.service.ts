import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, map } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { EnteByIdGQL } from '../graphql/enteById';
import { SaveEnteGQL } from '../graphql/saveEnte';
import { DeleteEnteGQL } from '../graphql/deleteEnte';
import { EnteSearchPageGQL } from '../graphql/enteSearchPage';
import { SaveEnteSucursalGQL } from '../graphql/saveEnteSucursal';
import { DeleteEnteSucursalGQL } from '../graphql/deleteEnteSucursal';
import { EntesSucursalesByEnteIdGQL } from '../graphql/entesSucursalesByEnteId';
import { EnteByReferenciaIdGQL } from '../graphql/enteByReferenciaId';
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

@Injectable({
  providedIn: 'root'
})
export class EnteService {
  private genericService = inject(GenericCrudService);
  private enteByIdGQL = inject(EnteByIdGQL);
  private saveEnteGQL = inject(SaveEnteGQL);
  private deleteEnteGQL = inject(DeleteEnteGQL);
  private enteSearchPageGQL = inject(EnteSearchPageGQL);
  private saveEnteSucursalGQL = inject(SaveEnteSucursalGQL);
  private deleteEnteSucursalGQL = inject(DeleteEnteSucursalGQL);
  private entesSucursalesByEnteIdGQL = inject(EntesSucursalesByEnteIdGQL);
  private enteByReferenciaIdGQL = inject(EnteByReferenciaIdGQL);
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
  private paginationSubject = new BehaviorSubject({ pageIndex: 0, pageSize: 15 });

  public entes$ = this.entesSubject.asObservable();
  public totalElements$ = this.totalElementsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public paginationState$ = this.paginationSubject.asObservable();
  public sucursalId$ = this.sucursalIdSubject.asObservable();

  constructor() {
    combineLatest([
      this.searchTextSubject.pipe(debounceTime(300), distinctUntilChanged()),
      this.sucursalIdSubject,
      this.paginationSubject
    ]).pipe(
      tap(() => this.loadingSubject.next(true)),
      switchMap(([texto, sucursalId, pag]) =>
        this.genericService.onCustomQuery(this.enteSearchPageGQL, { texto, sucursalId, page: pag.pageIndex, size: pag.pageSize })
      )
    ).subscribe((res: PageInfo<Ente>) => {
      this.entesSubject.next(res.getContent);
      this.totalElementsSubject.next(res.getTotalElements);
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

  onBuscarPagina(texto: string, sucursalId: number | null, page: number, size: number): Observable<PageInfo<Ente>> {
    return this.genericService.onCustomQuery(this.enteSearchPageGQL, { texto, sucursalId, page, size });
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
    let query: any;
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
      switchMap((res: any) => {
        if (res) {
          return this.onGetByReferenciaId(tipo, res.id).pipe(
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
