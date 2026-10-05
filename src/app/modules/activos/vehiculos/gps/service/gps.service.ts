import { Injectable, inject, Injector } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { Gps } from '../models/gps.model';
import { GpsInput } from '../models/gps-input.model';
import { map, tap, take } from 'rxjs/operators';
import { SaveGpsGQL } from '../graphql/saveGps';
import { DeleteGpsGQL } from '../graphql/deleteGps';
import { GpsByIdGQL } from '../graphql/gpsById';
import { GpsListGQL } from '../graphql/gpsList';
import { GpsSearchGQL } from '../graphql/gpsSearch';
import { GpsByVehiculoGQL } from '../graphql/gpsByVehiculo';
import { GpsByImeiGQL } from '../graphql/gpsByImei';
import { EnviarComandoGpsGQL } from '../graphql/enviarComandoGps';
import { GuardarConfigAlertasGpsGQL } from '../graphql/guardarConfigAlertasGps';
import { MatDialog } from '@angular/material/dialog';
import { GpsDialogService } from './gps-dialog-service.service';
import { ContextoConsulta, GenericCrudService, QueryError, TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../../../generics/generic-crud.service';

/**
 * `error`: no se pudo cargar y no hay nada que mostrar. `desactualizada`: falló un refresco de la misma búsqueda y
 * se conservan las filas que ya estaban.
 */
export type EstadoListaGps = 'cargando' | 'ok' | 'error' | 'desactualizada';

/** Lecturas de GPS: el error de red y el del servidor llegan a quien llama, que es quien avisa (#390). */
export const LECTURA_GPS: QueryError = {
    networkError: { propagate: true, show: false },
    graphError: { propagate: true, show: false },
};
export const CONSULTA_GPS: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };

@Injectable({
    providedIn: 'root'
})
export class GpsService {
    private genericService = inject(GenericCrudService);
    private saveGpsGQL = inject(SaveGpsGQL);
    private deleteGpsGQL = inject(DeleteGpsGQL);
    private gpsByIdGQL = inject(GpsByIdGQL);
    private gpsListGQL = inject(GpsListGQL);
    private gpsSearchGQL = inject(GpsSearchGQL);
    private gpsByVehiculoGQL = inject(GpsByVehiculoGQL);
    private gpsByImeiGQL = inject(GpsByImeiGQL);
    private enviarComandoGpsGQL = inject(EnviarComandoGpsGQL);
    private guardarConfigAlertasGpsGQL = inject(GuardarConfigAlertasGpsGQL);
    private dialog = inject(MatDialog);
    private injector = inject(Injector);
    private gpsSubject = new BehaviorSubject<Gps[]>([]);
    public gps$ = this.gpsSubject.asObservable();

    private loadingSubject = new BehaviorSubject<boolean>(false);
    public loading$ = this.loadingSubject.asObservable();

    private estadoListaSubject = new BehaviorSubject<EstadoListaGps>('cargando');
    public estadoLista$ = this.estadoListaSubject.asObservable();
    /** Solo se aplica la última búsqueda pedida: una respuesta lenta de un texto anterior no pisa a la nueva. */
    private lecturaLista = 0;
    /** Texto de la última respuesta buena, que es lo que está en pantalla (`null`: nada). */
    private textoMostrado: string | null = null;

    private _searchText$ = new BehaviorSubject<string>('');
    public searchText$ = this._searchText$.asObservable();

    private _paginationState$ = new BehaviorSubject<{ pageIndex: number, pageSize: number }>({
        pageIndex: 0,
        pageSize: 15
    });
    public paginationState$ = this._paginationState$.asObservable();

    public totalElements$ = this.gps$.pipe(
        map(gps => gps.length)
    );

    public filteredGps$ = combineLatest([
        this.gps$,
        this._paginationState$
    ]).pipe(
        map(([gps, pag]) => {
            const start = pag.pageIndex * pag.pageSize;
            const end = start + pag.pageSize;
            return gps.slice(start, end);
        })
    );

    onGetById(id: number): Observable<Gps> {
        return this.genericService.onGetById(this.gpsByIdGQL, id);
    }

    onSave(input: GpsInput): Observable<Gps> {
        // La lista la refresca el formulario al cerrar (`GpsDialogService.abrirFormulario`).
        return this.genericService.onSave(this.saveGpsGQL, input) as Observable<Gps>;
    }

    onDelete(id: number): Observable<boolean> {
        return this.genericService.onDelete(
            this.deleteGpsGQL,
            id,
            '¿Eliminar GPS?',
            null,
            true,
            true,
            '¿Está seguro que desea eliminar este GPS?'
        ).pipe(
            tap(res => {
                if (res) this.refrescar();
            })
        );
    }

    onSearch(texto: string): Observable<Gps[]> {
        return this.genericService.onGetByTexto(this.gpsSearchGQL, texto);
    }

    /**
     * Búsqueda de GPS con los errores propagados. `silencioso`: sin el modal «Buscando…» (el mapa).
     * No usa `onGetByTexto`: ante un error no emite nada y no admite corte propio.
     */
    onBuscar(texto: string, silencioso = false): Observable<Gps[]> {
        return this.genericService.onCustomQuery(this.gpsSearchGQL, { texto }, true, LECTURA_GPS, silencioso, CONSULTA_GPS);
    }

    /**
     * Carga la lista. Con `texto` cambia la búsqueda (y vuelve a la primera página); sin él repite la actual.
     * Si falla un refresco de lo que ya está en pantalla se conservan las filas (`desactualizada`); si falla una
     * búsqueda distinta se vacía (`error`): no se muestran resultados de otra búsqueda como si fueran de esta.
     */
    refrescar(texto?: string): void {
        if (texto != null && texto !== this._searchText$.value) {
            this._searchText$.next(texto);
            this._paginationState$.next({ pageIndex: 0, pageSize: this._paginationState$.value.pageSize });
        }
        const buscado = this._searchText$.value;
        const lectura = ++this.lecturaLista;
        this.loadingSubject.next(true);
        this.estadoListaSubject.next('cargando');
        this.onBuscar(buscado).pipe(take(1)).subscribe({
            next: (res) => {
                if (lectura !== this.lecturaLista) return;
                const lista = res || [];
                const pag = this._paginationState$.value;
                if (pag.pageIndex > 0 && pag.pageIndex * pag.pageSize >= lista.length) {
                    this._paginationState$.next({ pageIndex: 0, pageSize: pag.pageSize });
                }
                this.textoMostrado = buscado;
                this.gpsSubject.next(lista);
                this.loadingSubject.next(false);
                this.estadoListaSubject.next('ok');
            },
            error: () => {
                if (lectura !== this.lecturaLista) return;
                this.loadingSubject.next(false);
                if (this.textoMostrado === buscado) {
                    this.estadoListaSubject.next('desactualizada');
                } else {
                    this.textoMostrado = null;
                    this.gpsSubject.next([]);
                    this.estadoListaSubject.next('error');
                }
            }
        });
    }

    setSearchText(texto: string): void {
        if (texto === this._searchText$.value) return;
        this.refrescar(texto);
    }

    abrirFormulario(gps?: Gps): Observable<boolean | undefined> {
        return this.injector.get(GpsDialogService).abrirFormulario(gps);
    }

    abrirConfiguracion(gps: Gps): void {
        this.injector.get(GpsDialogService).abrirConfiguracion(gps);
    }

    updatePagination(pageIndex: number, pageSize: number): void {
        this._paginationState$.next({ pageIndex, pageSize });
    }

    onGetList(page: number, size: number): Observable<Gps[]> {
        return this.genericService.onCustomQuery(this.gpsListGQL, { page, size });
    }

    onGetByVehiculoId(vehiculoId: number): Observable<Gps[]> {
        return this.genericService.onCustomQuery(this.gpsByVehiculoGQL, { vehiculoId });
    }

    onGetByImei(imei: string): Observable<Gps> {
        return this.genericService.onCustomQuery(this.gpsByImeiGQL, { imei });
    }

    onEnviarComando(id: number, tipo: string, valor?: string): Observable<boolean> {
        return this.genericService.onCustomMutation(this.enviarComandoGpsGQL, { id, tipo, valor });
    }

    onGuardarConfigAlertas(id: number, alertaVelocidad: boolean, velocidadLimite: number,
        alertaVibracion: boolean, alertaBateriaBaja: boolean, alertaAcc: boolean): Observable<Gps> {
        return this.genericService.onCustomMutation(this.guardarConfigAlertasGpsGQL, {
            id, alertaVelocidad, velocidadLimite, alertaVibracion, alertaBateriaBaja, alertaAcc
        });
    }
}
