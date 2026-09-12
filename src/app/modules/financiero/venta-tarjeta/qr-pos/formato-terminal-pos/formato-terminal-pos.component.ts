import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DialogosService } from '../../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { FormatoTerminalPos, TIPOS_FORMATO_TERMINAL } from './formato-terminal-pos.model';

/**
 * La fila que se dibuja. La etiqueta del tipo viene calculada de antemano: este repo prohibe
 * llamar funciones desde el HTML, porque se re-evaluan en cada ciclo de change detection.
 */
interface FilaFormato extends FormatoTerminalPos {
  tipoEtiqueta: string;
}
import { FormatoTerminalPosService } from './formato-terminal-pos.service';
import { EditFormatoTerminalPosComponent } from './edit-formato-terminal-pos/edit-formato-terminal-pos.component';
import { DerivarMapaDialogComponent } from './derivar-mapa-dialog/derivar-mapa-dialog.component';
import { TIPO_MAQUINA } from './formato-terminal-pos.model';

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
  formatos: FilaFormato[] = [];
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
        this.formatos = (res || []).map((f) => ({
          ...f,
          tipoEtiqueta:
            TIPOS_FORMATO_TERMINAL.find((t) => t.valor === f.tipo)?.etiqueta || f.tipo || '—',
        }));
      },
      error: () => (this.cargando = false),
    });
  }

  onNuevo(): void {
    this.abrir(null);
  }

  onEditar(formato: FormatoTerminalPos): void {
    this.abrir(formato);
  }

  /**
   * El mapa del cupon: que parte del ticket es cada campo.
   *
   * Solo para los formatos MAQUINA. Un WEB es patron puro --la cadena entra por el lector del
   * PDV-- asi que no hay imagen sobre la cual haya regiones que ubicar, y ofrecerlo daria la falsa
   * impresion de que hay algo para configurar. El backend lo rechaza igual.
   */
  onMapa(formato: FormatoTerminalPos): void {
    this.matDialog.open(DerivarMapaDialogComponent, {
      data: { formato },
      width: '660px',
      disableClose: false,
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(() => {});
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
