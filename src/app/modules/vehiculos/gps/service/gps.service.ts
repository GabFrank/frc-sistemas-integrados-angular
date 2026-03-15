import { Injectable, inject } from '@angular/core';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
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
import { GpsComponent } from '../dialogs/gps-form/gps.component';
import { GpsConfigDialogComponent } from '../dialogs/gps-config-dialog/gps-config-dialog.component';

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
    private gpsSubject = new BehaviorSubject<Gps[]>([]);
    public gps$ = this.gpsSubject.asObservable();

    private loadingSubject = new BehaviorSubject<boolean>(false);
    public loading$ = this.loadingSubject.asObservable();

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

    onSave(input: GpsInput): Observable<any> {
        return this.genericService.onSave(this.saveGpsGQL, input).pipe(
            tap(res => {
                if (res) this.refrescar();
            })
        );
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

    refrescar(): void {
        this.loadingSubject.next(true);
        const texto = this._searchText$.value;
        this.onSearch(texto).subscribe({
            next: (res) => {
                this.gpsSubject.next(res || []);
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

    abrirFormulario(gps?: Gps): Observable<any> {
        const dialogRef = this.dialog.open(GpsComponent, {
            width: '800px',
            data: gps,
            disableClose: true,
            autoFocus: false
        });

        return dialogRef.afterClosed().pipe(
            take(1),
            tap(res => {
                if (res) this.refrescar();
            })
        );
    }

    abrirConfiguracion(gps: Gps): void {
        this.dialog.open(GpsConfigDialogComponent, {
            width: '900px',
            data: gps,
            disableClose: false,
            autoFocus: false,
            panelClass: 'modern-dialog'
        });
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
