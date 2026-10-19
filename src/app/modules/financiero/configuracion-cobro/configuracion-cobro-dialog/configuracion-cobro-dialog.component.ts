import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { ConfiguracionCobroService } from '../configuracion-cobro.service';
import { ConfiguracionCobro, ConfiguracionCobroInput, TOPE_AUMENTO_DEFAULT } from '../configuracion-cobro.model';

@UntilDestroy()
@Component({
  selector: 'app-configuracion-cobro-dialog',
  templateUrl: './configuracion-cobro-dialog.component.html',
  styleUrls: ['./configuracion-cobro-dialog.component.scss']
})
export class ConfiguracionCobroDialogComponent implements OnInit {

  conTopeControl = new FormControl<boolean>(true);
  porcentajeControl = new FormControl<number>(TOPE_AUMENTO_DEFAULT);
  modificadoPor: string = null;
  modificadoEn: Date = null;
  isLoading = true;
  /** El central no respondió o todavía no tiene la configuración: no se deja guardar. */
  noDisponible = false;
  guardando = false;

  constructor(
    public dialogRef: MatDialogRef<ConfiguracionCobroDialogComponent>,
    private configuracionService: ConfiguracionCobroService,
    private notificacionService: NotificacionSnackbarService,
  ) { }

  ngOnInit(): void {
    this.configuracionService.onGetConfiguracion().pipe(untilDestroyed(this)).subscribe({
      next: (res) => this.cargar(res),
      error: () => {
        this.isLoading = false;
        this.noDisponible = true;
      },
    });
  }

  private cargar(config: ConfiguracionCobro): void {
    this.conTopeControl.setValue(config?.aumentoConTope !== false);
    this.porcentajeControl.setValue(config?.aumentoTopePorcentaje > 0 ? config.aumentoTopePorcentaje : TOPE_AUMENTO_DEFAULT);
    this.modificadoPor = config?.id != null ? config?.usuario?.nickname ?? null : null;
    this.modificadoEn = config?.id != null ? config?.modificadoEn ?? null : null;
    this.isLoading = false;
  }

  onGuardar(): void {
    if (this.noDisponible || this.guardando) return;
    const conTope = this.conTopeControl.value === true;
    const pct = Number(this.porcentajeControl.value);
    if (conTope && !(pct > 0 && pct <= 100)) {
      this.notificacionService.openWarn('El tope es un porcentaje del total: tiene que ser mayor a 0 y hasta 100.');
      return;
    }
    const input = new ConfiguracionCobroInput();
    input.aumentoConTope = conTope;
    // Sin tope no se manda el porcentaje: se conserva el guardado para cuando se vuelva a activar.
    if (conTope) input.aumentoTopePorcentaje = pct;
    this.guardando = true;
    this.configuracionService.onSaveConfiguracion(input).pipe(untilDestroyed(this)).subscribe({
      next: (res) => {
        this.guardando = false;
        if (res != null) {
          this.notificacionService.openSucess('Configuración de cobro guardada');
          this.dialogRef.close(res);
        }
      },
      error: () => (this.guardando = false),
    });
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}
