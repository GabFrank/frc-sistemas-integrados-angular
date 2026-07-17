import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { ConfiguracionFacturaConVentaService } from './configuracion-factura-con-venta.service';
import { ConfiguracionFacturaConVenta } from './configuracion-factura-con-venta.model';

@Component({
  selector: 'app-configuracion-factura-con-venta-dialog',
  templateUrl: './configuracion-factura-con-venta-dialog.component.html',
  styleUrls: ['./configuracion-factura-con-venta-dialog.component.scss']
})
export class ConfiguracionFacturaConVentaDialogComponent implements OnInit {

  config: ConfiguracionFacturaConVenta = new ConfiguracionFacturaConVenta();
  isLoading = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<ConfiguracionFacturaConVentaDialogComponent>,
    private configuracionService: ConfiguracionFacturaConVentaService,
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
