import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { ConfiguracionTransferenciaService } from './configuracion-transferencia.service';
import { ConfiguracionTransferencia, ConfiguracionTransferenciaInput } from './configuracion-transferencia.model';

@Component({
  selector: 'app-configuracion-transferencia-dialog',
  templateUrl: './configuracion-transferencia-dialog.component.html',
  styleUrls: ['./configuracion-transferencia-dialog.component.scss']
})
export class ConfiguracionTransferenciaDialogComponent implements OnInit {

  config: ConfiguracionTransferencia = new ConfiguracionTransferencia();
  isLoading = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<ConfiguracionTransferenciaDialogComponent>,
    private configuracionService: ConfiguracionTransferenciaService,
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

  onToggleStockNegativo(): void {
    this.config.permitirStockNegativo = !this.config.permitirStockNegativo;
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
