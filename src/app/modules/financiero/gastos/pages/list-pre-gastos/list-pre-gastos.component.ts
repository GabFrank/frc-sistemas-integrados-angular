import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { WindowInfoService } from '../../../../../shared/services/window-info.service';
import { GastoService } from '../../service/gasto.service';
import { PreGasto } from '../../models/pre-gasto.model';
import { AdicionarPreGastoDialogComponent } from '../../dialogs/adicionar-pre-gasto-dialog/adicionar-pre-gasto-dialog.component';
import { AutorizarGastoDialogComponent } from '../../dialogs/autorizar-gasto-dialog/autorizar-gasto-dialog.component';
import { UntilDestroy } from '@ngneat/until-destroy';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { switchMap, tap, map, shareReplay, startWith, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'app-list-pre-gastos',
  templateUrl: './list-pre-gastos.component.html',
  styleUrls: ['./list-pre-gastos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListPreGastosComponent implements OnInit {
  private gastoService = inject(GastoService);
  private windowInfoService = inject(WindowInfoService);
  private matDialog = inject(MatDialog);

  alturaContenedor = this.windowInfoService.innerTabHeight;
  alturaTabla = this.windowInfoService.innerTabHeight * 0.7;

  tabEstados = ['PENDIENTE', 'TRAMITE', 'AUTORIZADO', 'RECHAZADO', null];
  tabEtiquetas = ['Pendientes', 'En Trámite', 'Autorizados', 'Rechazados', 'Todos'];

  columnasVisibles = [
    'id', 'funcionario', 'tipoGasto', 'descripcion',
    'monto', 'moneda', 'sucursal', 'estado', 'fecha', 'acciones'
  ];

  private tabActivaSubject = new BehaviorSubject<number>(0);
  public tabActiva$ = this.tabActivaSubject.asObservable();

  private refetchSubject = new BehaviorSubject<void>(void 0);

  public cargandoSubject = new BehaviorSubject<boolean>(false);
  public cargando$ = this.cargandoSubject.asObservable();

  public preGastoSeleccionadoSubject = new BehaviorSubject<PreGasto | null>(null);
  public preGastoSeleccionado$ = this.preGastoSeleccionadoSubject.asObservable();

  public listaFiltrada$: Observable<PreGasto[]> = combineLatest([
    this.tabActiva$,
    this.refetchSubject
  ]).pipe(
    tap(() => this.cargandoSubject.next(true)),
    switchMap(([tabIndex]) => this.gastoService.preGastoListarPorEstado(this.tabEstados[tabIndex]).pipe(
      catchError(err => {
        console.error('Error fetching pre_gastos:', err);
        return of([]);
      })
    )),
    tap(() => this.cargandoSubject.next(false)),
    map(res => res || []),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  ngOnInit(): void {
    // Initial fetch handled by subjects
  }

  cambiarTab(indice: number): void {
    this.tabActivaSubject.next(indice);
    this.preGastoSeleccionadoSubject.next(null);
  }

  seleccionarPreGasto(preGasto: PreGasto): void {
    this.preGastoSeleccionadoSubject.next(preGasto);
  }

  nuevaSolicitud(): void {
    this.matDialog
      .open(AdicionarPreGastoDialogComponent, {
        width: '55%',
        disableClose: true,
        restoreFocus: true,
        autoFocus: true,
      })
      .afterClosed()
      .subscribe(res => {
        if (res != null) {
          this.refetchSubject.next();
        }
      });
  }

  autorizarGasto(preGasto: PreGasto): void {
    this.matDialog
      .open(AutorizarGastoDialogComponent, {
        data: { preGasto },
        width: '50%',
        disableClose: true,
        restoreFocus: true,
        autoFocus: true,
      })
      .afterClosed()
      .subscribe(res => {
        if (res != null) {
          this.refetchSubject.next();
          // Update selected item if modified
          const actual = this.preGastoSeleccionadoSubject.value;
          if (actual?.id === preGasto.id) {
            this.preGastoSeleccionadoSubject.next(res);
          }
        }
      });
  }

  colorEstado(estado: string): string {
    const colores: Record<string, string> = {
      'PENDIENTE': '#ffa726',
      'TRAMITE': '#42a5f5',
      'AUTORIZADO': '#66bb6a',
      'RECHAZADO': '#ef5350',
      'COMPLETADO': '#78909c'
    };
    return colores[estado] || '#9e9e9e';
  }

  iconoEstado(estado: string): string {
    const iconos: Record<string, string> = {
      'PENDIENTE': 'hourglass_empty',
      'TRAMITE': 'swap_horiz',
      'AUTORIZADO': 'check_circle',
      'RECHAZADO': 'cancel',
      'COMPLETADO': 'task_alt'
    };
    return iconos[estado] || 'help_outline';
  }

  etiquetaEstado(estado: string): string {
    const etiquetas: Record<string, string> = {
      'PENDIENTE': 'Pendiente',
      'TRAMITE': 'En Trámite',
      'AUTORIZADO': 'Autorizado',
      'RECHAZADO': 'Rechazado',
      'COMPLETADO': 'Completado'
    };
    return etiquetas[estado] || estado;
  }
}
