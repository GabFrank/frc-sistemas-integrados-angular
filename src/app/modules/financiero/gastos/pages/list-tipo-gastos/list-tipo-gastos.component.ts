import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { WindowInfoService } from '../../../../../shared/services/window-info.service';
import { GastoService } from '../../service/gasto.service';
import { TipoGasto, TipoGastoInput } from '../../models/tipo-gasto.model';
import { AdicionarTipoGastoDialogComponent } from '../../dialogs/adicionar-tipo-gasto-dialog/adicionar-tipo-gasto-dialog.component';
import { UntilDestroy } from '@ngneat/until-destroy';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { switchMap, tap, map, shareReplay, catchError } from 'rxjs/operators';
import { PageEvent } from '@angular/material/paginator';
import { FormControl, FormGroup } from '@angular/forms';

@UntilDestroy()
@Component({
  selector: 'app-list-tipo-gastos',
  templateUrl: './list-tipo-gastos.component.html',
  styleUrls: ['./list-tipo-gastos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListTipoGastosComponent implements OnInit {
  private gastoService = inject(GastoService);
  private windowInfoService = inject(WindowInfoService);
  private matDialog = inject(MatDialog);

  alturaContenedor = this.windowInfoService.innerTabHeight;
  alturaTabla = this.windowInfoService.innerTabHeight * 0.72;

  tabNaturalezas = [null, 'CONTINUO', 'RECURRENTE', 'VARIABLE'];
  tabEtiquetas = ['Todos', 'Continuos', 'Recurrentes', 'Variables'];

  columnasVisibles = [
    'id', 'descripcion', 'tipoNaturaleza', 'clasificacion', 'autorizacion', 'activo', 'acciones'
  ];

  // Tab activa (Naturaleza)
  private tabActivaSubject = new BehaviorSubject<number>(0); // Todos por defecto
  public tabActiva$ = this.tabActivaSubject.asObservable();

  // Paginación
  private paginationSubject = new BehaviorSubject<{ pageIndex: number, pageSize: number }>({ pageIndex: 0, pageSize: 15 });
  public pagination$ = this.paginationSubject.asObservable();

  private refetchSubject = new BehaviorSubject<void>(void 0);

  public totalElements$ = new BehaviorSubject<number>(0);

  public cargandoSubject = new BehaviorSubject<boolean>(false);
  public cargando$ = this.cargandoSubject.asObservable();

  // Formulario de búsqueda por texto
  searchFormGroup = new FormGroup({
    texto: new FormControl<string | null>('')
  });

  public listaFiltrada$: Observable<TipoGasto[]> = combineLatest([
    this.tabActiva$,
    this.refetchSubject,
    this.pagination$
  ]).pipe(
    tap(() => this.cargandoSubject.next(true)),
    switchMap(([tabIndex, _, pag]) => {
      const naturaleza = this.tabNaturalezas[tabIndex];
      const texto = this.searchFormGroup.controls.texto.value || null;

      return this.gastoService.tipoGastoFilter(
        naturaleza,
        texto,
        pag.pageIndex,
        pag.pageSize
      ).pipe(
        catchError(err => {
          console.error('Error fetching tipo_gastos:', err);
          return of(null);
        })
      );
    }),
    tap(res => {
      this.cargandoSubject.next(false);
      if (res) {
        this.totalElements$.next(res.getTotalElements || 0);
      }
    }),
    map(res => res?.getContent || []),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  ngOnInit(): void {
  }

  cambiarTab(indice: number): void {
    this.tabActivaSubject.next(indice);
    this.paginationSubject.next({ ...this.paginationSubject.value, pageIndex: 0 });
  }

  onBuscar(): void {
    this.paginationSubject.next({ ...this.paginationSubject.value, pageIndex: 0 });
    this.refetchSubject.next();
  }

  onLimpiar(): void {
    this.searchFormGroup.reset();
    this.tabActivaSubject.next(0);
    this.paginationSubject.next({ ...this.paginationSubject.value, pageIndex: 0 });
    this.refetchSubject.next();
  }

  agregarNuevo(parent?: TipoGasto): void {
    this.matDialog
      .open(AdicionarTipoGastoDialogComponent, {
        data: { parent },
        width: '50%',
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

  editarItem(tipoGasto: TipoGasto): void {
    this.matDialog
      .open(AdicionarTipoGastoDialogComponent, {
        data: {
          tipoGasto: tipoGasto,
          parent: tipoGasto.clasificacionGasto,
        },
        width: '50%',
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

  eliminarItem(tipoGasto: TipoGasto): void {
    this.gastoService.tipoGastoOnDelete(tipoGasto.id)
      .subscribe(res => {
        if (res) {
          this.refetchSubject.next();
        }
      });
  }

  handlePageEvent(e: PageEvent): void {
    this.paginationSubject.next({ pageIndex: e.pageIndex, pageSize: e.pageSize });
  }

  colorNaturaleza(naturaleza: string): string {
    const colores: Record<string, string> = {
      'CONTINUO': '#42a5f5',
      'RECURRENTE': '#ffa726',
      'VARIABLE': '#66bb6a'
    };
    return colores[naturaleza] || '#9e9e9e';
  }
}
