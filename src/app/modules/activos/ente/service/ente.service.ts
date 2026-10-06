import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, take, tap, map } from 'rxjs/operators';
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
import { EnteCuotasByEnteIdGQL } from '../graphql/enteCuotasByEnteId';
import { CuotaDetalle } from '../../shared/models/cuota-detalle.model';
import { Ente } from '../models/ente.model';
import { TipoEnte } from '../enums/tipo-ente.enum';
import { EnteSucursal } from '../models/ente-sucursal.model';
import { EnteInput } from '../models/ente-input.model';
import { EnteSucursalInput } from '../models/ente-sucursal-input.model';
import { ContextoConsulta, GenericCrudService, PROPAGAR_ERROR_DE_RED, QueryError, TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../../generics/generic-crud.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { esTimeoutDeLink, TIMEOUT_POR_DEFECTO_MS } from '../../../../shared/services/timeout-link';
import { PageInfo } from '../../../../app.component';
import { MainService } from '../../../../main.service';
import { VehiculoSearchPageGQL } from '../../vehiculos/vehiculo/graphql/vehiculoSearchPage';
import { MuebleSearchPageGQL } from '../../muebles/graphql/muebleSearchPage';
import { InmuebleSearchPageGQL } from '../../inmueble/graphql/inmuebleSearchPage';
import { EquipoSearchPageGQL } from '../../equipos/graphql/equipoSearchPage';
import { FuncionarioSearchGQL } from '../../../personas/funcionarios/graphql/funcionarioSearch';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';
import { Mueble } from '../../muebles/models/mueble.model';
import { Vehiculo } from '../../vehiculos/vehiculo/models/vehiculo.model';
import { Inmueble } from '../../inmueble/models/inmueble.model';
import { Equipo } from '../../equipos/models/equipo.model';
import { EnteVinculacionDialogComponent, EnteVinculacionDialogData } from '../dialogs/ente-vinculacion-dialog/ente-vinculacion-dialog.component';
import { esRechazoDelServidor } from '../../../../commons/core/utils/graphqlErrorUtils';

/**
 * Lecturas donde un error NO puede confundirse con «no existe» o «no hay»: el error de red y el del servidor
 * llegan a quien llama, sin aviso del servicio genérico (avisa quien llama, una vez) (#390).
 */
const LECTURA_ENTE: QueryError = {
  networkError: { propagate: true, show: false },
  graphError: { propagate: true, show: false },
};
const CONSULTA_ENTE: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };
/** La lista de bienes recorre todos los candidatos en el central: corte más largo. */
const CONSULTA_LISTA: ContextoConsulta = { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true };
/** Marca de «la búsqueda falló» dentro del stream (para que no muera con el primer error). */
const BUSQUEDA_FALLIDA = { fallo: true };

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
  private enteCuotasGQL = inject(EnteCuotasByEnteIdGQL);
  private dialog = inject(MatDialog);
  private mainService = inject(MainService);
  private notificacionService = inject(NotificacionSnackbarService);
  private vehiculoSearchPageGQL = inject(VehiculoSearchPageGQL);
  private muebleSearchPageGQL = inject(MuebleSearchPageGQL);
  private inmuebleSearchPageGQL = inject(InmuebleSearchPageGQL);
  private equipoSearchPageGQL = inject(EquipoSearchPageGQL);
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
  private errorSubject = new BehaviorSubject<boolean>(false);

  public entes$ = this.entesSubject.asObservable();
  public totalElements$ = this.totalElementsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public paginationState$ = this.paginationSubject.asObservable();
  public sucursalId$ = this.sucursalIdSubject.asObservable();
  public summary$ = this.summarySubject.asObservable();
  /** La última búsqueda falló: la lista vacía no significa «no hay bienes» (#390). */
  public error$ = this.errorSubject.asObservable();

  constructor() {
    combineLatest([
      this.searchTextSubject.pipe(debounceTime(300), distinctUntilChanged()),
      this.sucursalIdSubject,
      this.tipoEnteSubject,
      this.situacionPagoSubject,
      this.estadoCuotaSubject,
      this.paginationSubject
    ]).pipe(
      tap(() => {
        this.loadingSubject.next(true);
        this.errorSubject.next(false);
      }),
      switchMap(([texto, sucursalId, tipoEnte, situacionPago, estadoCuota, pag]) =>
        // Sin modal (la pantalla muestra `loading$`) y con el error dentro del switchMap: la búsqueda sigue viva
        // después de un fallo. Antes un error dejaba a la vista la lista y los montos del filtro anterior.
        this.genericService.onCustomQuery(this.enteSearchWithSummaryGQL, { 
          texto, sucursalId, tipoEnte, situacionPago, estadoCuota,
          page: pag.pageIndex, size: pag.pageSize 
        }, true, LECTURA_ENTE, true, CONSULTA_LISTA).pipe(
          catchError(() => of(BUSQUEDA_FALLIDA))
        )
      )
    ).subscribe((res: any) => {
      if (res?.page != null) {
        this.entesSubject.next(res.page.getContent);
        this.totalElementsSubject.next(res.page.getTotalElements);
        this.summarySubject.next(res.summary);
      } else {
        // Falló (o vino sin datos): no quedan los bienes ni los montos de otra búsqueda
        this.entesSubject.next([]);
        this.totalElementsSubject.next(0);
        this.summarySubject.next(null);
        this.errorSubject.next(true);
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

  /** Con `errorConf` el error llega a quien llama; sin él, la consulta no emite nada si falla. */
  onBuscarPorId(id: number, errorConf?: QueryError, contexto?: ContextoConsulta): Observable<Ente> {
    return this.genericService.onGetById(this.enteByIdGQL, id, null, null, true, null, null, null, null, null, null,
      errorConf, contexto);
  }

  onGuardar(input: EnteInput): Observable<Ente> {
    return this.genericService.onSave(this.saveEnteGQL, input);
  }

  onEliminar(id: number): Observable<boolean> {
    return this.genericService.onDelete(this.deleteEnteGQL, id, '¿Eliminar ente?');
  }

  /**
   * Ente de un bien. El central devuelve `null` cuando el bien todavía no tiene ente. Sin `errorConf` un error del
   * servidor también llega como `null` y uno de red no emite: quien decide algo a partir de «no existe» tiene que
   * pasar `errorConf` (#390).
   */
  onGetByReferenciaId(tipoEnte: TipoEnte, referenciaId: number, errorConf?: QueryError,
                      contexto?: ContextoConsulta): Observable<Ente> {
    return this.genericService.onCustomQuery(this.enteByReferenciaIdGQL, { tipoEnte, referenciaId }, true,
      errorConf, undefined, contexto);
  }



  /**
   * Ente de un bien y, si `conCuotas`, sus cuotas guardadas (los cuatro formularios de bienes hacían esto por su
   * cuenta, sin manejo de error). Resultados válidos: sin ente (`enteId` null) y sin cuotas (lista vacía).
   * - `conCuotas = true` (el bien está en «pagando»): cualquier fallo es ERROR — con las cuotas sin leer, guardar
   *   regeneraría o borraría el plan en el central.
   * - `conCuotas = false`: el ente solo sirve para los archivos; si no se puede consultar se devuelve
   *   `enteFallo` y no hay error.
   */
  cargarEnteYCuotas(tipoEnte: TipoEnte, referenciaId: number, conCuotas: boolean):
    Observable<{ enteId: number | null; cuotas: CuotaDetalle[] | null; enteFallo: boolean }> {
    const ente$ = this.onGetByReferenciaId(tipoEnte, referenciaId, LECTURA_ENTE, CONSULTA_ENTE);
    if (!conCuotas) {
      return ente$.pipe(
        map(ente => ({ enteId: ente?.id ?? null, cuotas: null, enteFallo: false })),
        catchError(() => of({ enteId: null, cuotas: null, enteFallo: true }))
      );
    }
    return ente$.pipe(
      switchMap(ente => {
        if (!ente?.id) return of({ enteId: null, cuotas: [] as CuotaDetalle[], enteFallo: false });
        return this.genericService.onCustomQuery(this.enteCuotasGQL, { enteId: ente.id }, true, LECTURA_ENTE, true, CONSULTA_ENTE).pipe(
          map((cuotas: any[]) => {
            // El central devuelve [] cuando no hay cuotas: un null es un fallo
            if (cuotas == null) throw new Error('Las cuotas del bien no llegaron');
            return {
              enteId: ente.id,
              cuotas: cuotas.map(c => ({ numeroCuota: c.numeroCuota || 0, monto: c.monto || 0, pagado: c.pagado })),
              enteFallo: false,
            };
          })
        );
      })
    );
  }

  onBuscarPagina(texto: string | null, sucursalId: number | null, page: number, size: number, tipoEnte: TipoEnte | null = null): Observable<PageInfo<Ente>> {
    return this.genericService.onCustomQuery(this.enteSearchWithSummaryGQL, { texto, sucursalId, tipoEnte, page, size }).pipe(
      map((res: any) => res?.page)
    );
  }

  onBuscarAsignacionesPagina(texto: string | null, sucursalId: number | null, tipoEnte: TipoEnte | null, responsableId: number | null, page: number, size: number): Observable<PageInfo<EnteSucursal>> {
    return this.genericService.onCustomQuery(this.enteSucursalSearchPageGQL, { texto, sucursalId, tipoEnte, responsableId, page, size });
  }

  /** Asignaciones de un ente ([] si no tiene). Con `errorConf` un fallo llega como error, no como «sin asignación». */
  getEnteSucursalByEnteId(enteId: number, errorConf?: QueryError, contexto?: ContextoConsulta): Observable<EnteSucursal[]> {
    return this.genericService.onCustomQuery(this.entesSucursalesByEnteIdGQL, { enteId }, true, errorConf, undefined, contexto);
  }

  getEnteSucursalByEnteAndSucursal(enteId: number, sucursalId: number, errorConf?: QueryError,
                                   contexto?: ContextoConsulta): Observable<EnteSucursal | null> {
    return this.getEnteSucursalByEnteId(enteId, errorConf, contexto).pipe(
      map(res => {
        const assignments = (res ?? []) as EnteSucursal[];
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
    let query: VehiculoSearchPageGQL | MuebleSearchPageGQL | InmuebleSearchPageGQL | EquipoSearchPageGQL | undefined;
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
      case TipoEnte.EQUIPO:
        query = this.equipoSearchPageGQL;
        titulo = 'Buscar Equipo';
        tableData = [
          { id: 'id', nombre: 'Id', width: '10%' },
          { id: 'identificador', nombre: 'Identificador', width: '20%' },
          { id: 'modelo.marca.descripcion', nombre: 'Marca', width: '25%' },
          { id: 'modelo.descripcion', nombre: 'Modelo', width: '25%' },
          { id: 'descripcion', nombre: 'Descripción', width: '20%' }
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
      switchMap((res: Vehiculo | Mueble | Inmueble | Equipo | undefined) => {
        if (res) {
          // Solo un «no existe» de verdad crea el ente. Antes un error del servidor llegaba como null y se creaba
          // un SEGUNDO ente para un bien que ya tenía (y con dos entes el bien ya no se puede volver a guardar).
          return this.onGetByReferenciaId(tipo, res.id!, LECTURA_ENTE, CONSULTA_ENTE).pipe(
            map(ente => ({ ente })),
            catchError(() => {
              this.notificacionService.openWarn('No se pudo consultar el bien: no se seleccionó. Volvé a intentar.', 6);
              return of(null);
            }),
            switchMap(consulta => {
              if (consulta == null) return of(undefined); // igual que cancelar
              if (consulta.ente) return of(consulta.ente);
              const input: EnteInput = {
                tipoEnte: tipo,
                referenciaId: res.id,
                activo: true,
                usuarioId: this.mainService.usuarioActual?.id
              };
              // Con el error de red propagado (sin eso quien abrió el buscador quedaba esperando). Si el alta
              // llegó a aplicarse, la próxima búsqueda encuentra el ente: no se duplica.
              return this.genericService.onSave<Ente>(this.saveEnteGQL, input, null, null, true, PROPAGAR_ERROR_DE_RED).pipe(
                take(1),
                catchError((error) => {
                  // Un rechazo del servidor ya lo avisó el genérico; en el corte por tiempo, el link. La respuesta
                  // vacía llega como arreglo pero el genérico solo la nombra: se avisa igual.
                  if (!esRechazoDelServidor(error) && !esTimeoutDeLink(error)) {
                    this.notificacionService.openWarn('No se pudo registrar el bien: no se seleccionó. Volvé a buscarlo.', 6);
                  }
                  return of(undefined);
                })
              );
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

  abrirVincularBienSucursal(sucursalId?: number): Observable<unknown> {
    return this.dialog.open(EnteVinculacionDialogComponent, {
      data: { modo: 'BIEN', sucursalId } as EnteVinculacionDialogData,
      width: '620px',
      disableClose: true,
      autoFocus: false,
    }).afterClosed();
  }
}
