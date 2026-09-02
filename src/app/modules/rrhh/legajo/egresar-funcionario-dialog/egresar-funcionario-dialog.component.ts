import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { LegajoService } from '../legajo.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

export interface EgresarFuncionarioDialogData { funcionarioId: number; nombre?: string; }

@UntilDestroy()
@Component({
  selector: 'app-egresar-funcionario-dialog',
  templateUrl: './egresar-funcionario-dialog.component.html',
  styleUrls: ['./egresar-funcionario-dialog.component.scss']
})
export class EgresarFuncionarioDialogComponent {

  fechaControl = new FormControl(new Date());
  motivoControl = new FormControl(null, Validators.required);

  /**
   * Gate de confirmacion: hay que escribir el nombre completo del funcionario para
   * habilitar el boton, como al borrar un repositorio.
   *
   * Egresar no es reversible desde la pantalla que lo dispara y hace mas dano del que
   * anuncia: apaga el login, borra el credito del funcionario y el del cliente, y
   * devuelve al cliente a NORMAL. Un click de mas en la fila equivocada le saca el
   * acceso y el credito a alguien que sigue trabajando.
   */
  confirmacionControl = new FormControl('');
  /** Nombre a escribir, ya normalizado en espacios, para mostrarlo en el dialogo. */
  nombreEsperado = '';
  /** Precalculado: el repo no llama funciones desde el HTML. */
  puedeEgresar = false;
  /** Si el funcionario no tiene nombre no hay nada que escribir; no se puede pedir el gate. */
  hayGate = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EgresarFuncionarioDialogData,
    private dialogRef: MatDialogRef<EgresarFuncionarioDialogComponent>,
    private legajoService: LegajoService,
    private notificacion: NotificacionSnackbarService
  ) {
    this.nombreEsperado = (this.data?.nombre || '').trim().replace(/\s+/g, ' ');
    this.hayGate = this.nombreEsperado.length > 0;
    this.puedeEgresar = !this.hayGate;
    this.confirmacionControl.valueChanges.pipe(untilDestroyed(this)).subscribe(v => {
      this.puedeEgresar = !this.hayGate
        || this.normalizar(v) === this.normalizar(this.nombreEsperado);
    });
  }

  /**
   * Compara sin acentos, sin mayusculas y con los espacios colapsados.
   *
   * El objetivo del gate es obligar a mirar a quien se esta egresando, no a pelear con
   * el teclado: varios nombres del padron tienen tildes y espacios de sobra al final
   * (ej. "WILIAN ISMAEL MARTINEZ BENITEZ "). Aflojar eso no permite confundir a dos
   * personas distintas.
   */
  private normalizar(v: string): string {
    return (v || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .trim().replace(/\s+/g, ' ')
      .toUpperCase();
  }

  onEgresar() {
    if (this.motivoControl.invalid) {
      this.notificacion.notification$.next({ texto: 'Ingrese el motivo del egreso', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    if (!this.puedeEgresar) {
      this.notificacion.notification$.next({
        texto: 'Escribí el nombre completo del funcionario para confirmar el egreso',
        color: NotificacionColor.warn, duracion: 4
      });
      return;
    }
    const motivo = this.motivoControl.value ? this.motivoControl.value.toUpperCase() : null;
    this.legajoService.onEgresar(this.data.funcionarioId, dateToString(this.fechaControl.value), motivo)
      .pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.dialogRef.close(res); });
  }

  onCancelar() { this.dialogRef.close(); }
}
