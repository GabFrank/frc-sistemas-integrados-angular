import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { ConfiguracionVentaTarjetaService } from './configuracion-venta-tarjeta.service';
import { ConfiguracionVentaTarjeta } from './configuracion-venta-tarjeta.model';

@Component({
  selector: 'app-configuracion-venta-tarjeta-dialog',
  templateUrl: './configuracion-venta-tarjeta-dialog.component.html',
  styleUrls: ['./configuracion-venta-tarjeta-dialog.component.scss']
})
export class ConfiguracionVentaTarjetaDialogComponent implements OnInit {

  config: ConfiguracionVentaTarjeta = new ConfiguracionVentaTarjeta();
  isLoading = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<ConfiguracionVentaTarjetaDialogComponent>,
    private configuracionService: ConfiguracionVentaTarjetaService,
    private notificacionService: NotificacionSnackbarService,
    public mainService: MainService
  ) { }

  ngOnInit(): void {
    this.configuracionService.onGetConfiguracion().subscribe({
      next: (res) => {
        if (res != null) {
          Object.assign(this.config, res);
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notificacionService.openAlgoSalioMal('Error al cargar la configuración');
      }
    });
  }

  onToggleHabilitado(): void {
    this.config.habilitado = !this.config.habilitado;
  }

  onGuardar(): void {
    const input = this.config.toInput();
    input.usuarioId = this.mainService.usuarioActual?.id;
    this.configuracionService.onSaveConfiguracion(input).subscribe({
      next: (res) => {
        if (res != null) {
          this.config = res;
          this.notificacionService.openSucess('Configuración guardada correctamente');
          this.dialogRef.close(this.config);
        }
      },
      error: () => {
        this.notificacionService.openAlgoSalioMal('Error al guardar la configuración');
      }
    });
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}
