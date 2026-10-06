import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { GpsService } from './gps.service';
import { Gps } from '../models/gps.model';
import { GpsInput } from '../models/gps-input.model';
import { GPSComponent } from '../dialogs/gps-form/gps.component';
import { GpsConfigDialogComponent } from '../dialogs/gps-config-dialog/gps-config-dialog.component';
import { Vehiculo } from '../../vehiculo/models/vehiculo.model';
import { AssetCommonDialogService } from '../../../../../shared/services/asset-common-dialog.service';

@Injectable({
  providedIn: 'root'
})
export class GpsDialogService {
  private gpsService = inject(GpsService);
  private dialog = inject(MatDialog);
  private assetCommonDialogService = inject(AssetCommonDialogService);

  /** Emite `true` si se guardó y `'sin-confirmar'` si un alta quedó sin respuesta: en los dos casos refresca. */
  abrirFormulario(gps?: Gps): Observable<boolean | string | undefined> {
    const dialogRef = this.dialog.open(GPSComponent, {
      width: '800px',
      data: gps,
      disableClose: true,
      autoFocus: false
    });

    return dialogRef.afterClosed().pipe(
      take(1),
      tap(res => {
        if (res) this.gpsService.refrescar();
      })
    );
  }

  abrirConfiguracion(gps: Gps): void {
    const dialogRef = this.dialog.open(GpsConfigDialogComponent, {
      width: '900px',
      data: gps,
      disableClose: false,
      autoFocus: false,
      panelClass: 'modern-dialog'
    });
    // El diálogo trabaja sobre una copia: la lista se relee si se envió o guardó algo (también al cerrar con Esc).
    const dialogo = dialogRef.componentInstance;
    dialogRef.afterClosed().pipe(take(1)).subscribe(() => {
      if (dialogo.huboCambios) this.gpsService.refrescar();
    });
  }

  onBuscarVehiculo(callback: (vehiculo: Vehiculo) => void): void {
    this.assetCommonDialogService.buscarVehiculo(callback);
  }

  onGuardar(form: any, dialogRef: any): void {
    if (form.valid) {
      const values = form.getRawValue();
      const input: GpsInput = {
        id: values.id,
        imei: values.imei,
        modeloTracker: values.modeloTracker,
        simNumero: values.simNumero,
        vehiculoId: values.vehiculoId,
        activo: values.activo
      };

      this.gpsService.onSave(input).subscribe(res => {
        if (res) {
          dialogRef.close(true);
        }
      });
    }
  }

  onCancelar(dialogRef: any): void {
    dialogRef.close();
  }
}
