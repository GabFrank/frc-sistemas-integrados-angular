import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DialogosService } from '../../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { FormatoTerminalPos, TIPOS_FORMATO_TERMINAL } from './formato-terminal-pos.model';
import { FormatoTerminalPosService } from './formato-terminal-pos.service';
import { EditFormatoTerminalPosComponent } from './edit-formato-terminal-pos/edit-formato-terminal-pos.component';

/**
 * Listado de formatos de terminal POS.
 *
 * Un formato no se borra nunca: se desactiva. Borrarlo dejaria sin explicacion las ventas que ya
 * completo, y ademas la FK desde `terminal_pos` lo impediria.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-formato-terminal-pos',
  templateUrl: './formato-terminal-pos.component.html',
  styleUrls: ['./formato-terminal-pos.component.scss'],
})
export class FormatoTerminalPosComponent implements OnInit {

  displayedColumns = ['id', 'nombre', 'tipo', 'proveedor', 'ejemplo', 'activo', 'acciones'];
  formatos: FormatoTerminalPos[] = [];
  cargando = false;

  constructor(
    private formatoService: FormatoTerminalPosService,
    private matDialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacionSnackbar: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.formatoService.onGetTodos().pipe(untilDestroyed(this)).subscribe({
      next: (res) => {
        this.cargando = false;
        this.formatos = res || [];
      },
      error: () => (this.cargando = false),
    });
  }

  /** La etiqueta larga del tipo; si llega uno desconocido se muestra crudo en vez de vacio. */
  etiquetaTipo(tipo: string): string {
    return TIPOS_FORMATO_TERMINAL.find((t) => t.valor === tipo)?.etiqueta || tipo || '—';
  }

  onNuevo(): void {
    this.abrir(null);
  }

  onEditar(formato: FormatoTerminalPos): void {
    this.abrir(formato);
  }

  private abrir(formato: FormatoTerminalPos): void {
    this.matDialog
      .open(EditFormatoTerminalPosComponent, { data: { formato }, width: '65vw', height: '70vh' })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) this.cargar();
      });
  }

  /**
   * Desactivar NO apaga las terminales que ya lo tienen: el backend rechaza desactivar un formato
   * en uso. Se consulta cuantas lo usan ANTES de preguntar, para decirselo al usuario en vez de
   * dejarlo confirmar y comerse el error.
   */
  onDesactivar(formato: FormatoTerminalPos): void {
    this.formatoService
      .onContarTerminalesQueLoUsan(formato.id)
      .pipe(untilDestroyed(this))
      .subscribe((enUso) => {
        if (enUso > 0) {
          this.dialogosService.confirm(
            'No se puede desactivar',
            `"${formato.nombre}" lo usan ${enUso} terminal(es).`,
            'Reasignalas a otro formato antes de desactivarlo. Una terminal sin formato no puede vender con tarjeta.'
          );
          return;
        }
        this.dialogosService
          .confirm(
            'Atención',
            `¿Desactivar el formato "${formato.nombre}"?`,
            'Deja de ofrecerse para asignar a terminales nuevas. No afecta a ninguna terminal en uso.'
          )
          .pipe(untilDestroyed(this))
          .subscribe((confirmado) => {
            if (!confirmado) return;
            this.formatoService.onDesactivar(formato.id).pipe(untilDestroyed(this)).subscribe({
              next: () => {
                this.notificacionSnackbar.openSucess('Formato desactivado');
                this.cargar();
              },
            });
          });
      });
  }
}
