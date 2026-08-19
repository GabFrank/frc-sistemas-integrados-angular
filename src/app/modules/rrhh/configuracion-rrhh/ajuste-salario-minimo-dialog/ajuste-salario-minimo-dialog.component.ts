import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { ConfiguracionRrhhService } from '../configuracion-rrhh.service';

export interface AjusteSalarioMinimoDialogData {
  /** Nuevo valor de SALARIO_MINIMO_LEGAL_PYG recien guardado. */
  minimo: number;
}

/**
 * TODO-8 — Al subir el salario minimo legal quedan funcionarios por debajo.
 *
 * Los salarios son registros legales con historico: no se pueden reescribir en
 * silencio. Este dialogo muestra a los afectados y deja que el usuario elija a
 * cuales ajustar; cada ajuste genera su funcionario_salario_historico con motivo
 * "AJUSTE POR CAMBIO DE SALARIO MINIMO".
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-ajuste-salario-minimo-dialog',
  templateUrl: './ajuste-salario-minimo-dialog.component.html',
  styleUrls: ['./ajuste-salario-minimo-dialog.component.scss']
})
export class AjusteSalarioMinimoDialogComponent implements OnInit {

  displayedColumns = ['seleccion', 'nombre', 'cargo', 'sueldoActual', 'diferencia'];
  dataSource = new MatTableDataSource<any>([]);
  seleccion = new SelectionModel<any>(true, []);

  cargando = true;
  todosSeleccionados = false;

  /** Total real de afectados. Se muestra fijo para que no dependa de cuanto entre en pantalla. */
  totalAfectados = 0;
  /** Precalculado: el template no llama funciones (convencion del repo). */
  tooltipTodos = 'Seleccionar todos';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AjusteSalarioMinimoDialogData,
    private dialogRef: MatDialogRef<AjusteSalarioMinimoDialogComponent>,
    private configuracionService: ConfiguracionRrhhService,
    public mainService: MainService,
    private notificacion: NotificacionSnackbarService
  ) { }

  puedeConfig = false;

  ngOnInit(): void {
    this.puedeConfig = this.mainService.tieneAlgunRol(['RRHH CONFIG']);
    this.configuracionService.onGetFuncionariosBajoMinimo(this.data.minimo)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.cargando = false;
        const filas = (res || []).map(f => ({
          ...f,
          diferencia: this.data.minimo - (f.sueldo || 0)
        }));
        this.dataSource.data = filas;
        this.totalAfectados = filas.length;
        this.tooltipTodos = 'Selecciona los ' + filas.length
          + ' funcionarios de la lista, incluidos los que no entren en pantalla';
        // Nada preseleccionado: ajustar un salario es una decision explicita.
      });
  }

  onToggleTodos() {
    if (this.todosSeleccionados) {
      this.seleccion.clear();
      this.todosSeleccionados = false;
    } else {
      this.dataSource.data.forEach(f => this.seleccion.select(f));
      this.todosSeleccionados = true;
    }
  }

  onToggleFila(row: any) {
    this.seleccion.toggle(row);
    this.todosSeleccionados = this.seleccion.selected.length === this.dataSource.data.length;
  }

  onCancelar() {
    this.dialogRef.close(null);
  }

  onConfirmar() {
    const ids = this.seleccion.selected.map(f => f.id);
    if (ids.length === 0) {
      this.notificacion.notification$.next({
        texto: 'Seleccione al menos un funcionario', color: NotificacionColor.warn, duracion: 3
      });
      return;
    }
    // La moneda NO se manda: el backend usa la de cada funcionario. Mandar una sola
    // estamparia la moneda del primer seleccionado en el historico de todos.
    this.configuracionService.onAjustarSalariosAlMinimo(
      ids, this.data.minimo, this.mainService.usuarioActual?.id
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res == null) return;
      this.notificacion.notification$.next({
        texto: res + ' salario/s ajustado/s', color: NotificacionColor.success, duracion: 4
      });
      this.dialogRef.close(res);
    });
  }
}
