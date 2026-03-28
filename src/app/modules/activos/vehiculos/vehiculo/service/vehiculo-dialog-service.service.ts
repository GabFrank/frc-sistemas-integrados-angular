import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { VehiculoService } from './vehiculo.service';
import { Vehiculo } from '../models/vehiculo.model';
import { VehiculoInput } from '../models/vehiculo-input.model';
import { VehiculoComponent } from '../dialogs/vehiculo-form/vehiculo.component';
import { Modelo } from '../models/modelo.model';
import { TipoVehiculo } from '../models/tipo-vehiculo.model';
import { Persona } from '../../../../personas/persona/persona.model';
import { MainService } from '../../../../../main.service';
import { TabService } from '../../../../../layouts/tab/tab.service';
import { dateToString } from '../../../../../commons/core/utils/dateUtils';
import { AssetCommonDialogService } from '../../../../../shared/services/asset-common-dialog.service';

@Injectable({
  providedIn: 'root'
})
export class VehiculoDialogService {
  private vehiculoService = inject(VehiculoService);
  private dialog = inject(MatDialog);
  private mainService = inject(MainService);
  private tabService = inject(TabService);
  private assetCommonDialogService = inject(AssetCommonDialogService);

  abrirFormulario(vehiculo?: Vehiculo): Observable<boolean | undefined> {
    const dialogRef = this.dialog.open(VehiculoComponent, {
      width: '800px',
      data: vehiculo,
      disableClose: true,
      autoFocus: false
    });

    return dialogRef.afterClosed().pipe(
      tap(res => {
        if (res) this.vehiculoService.refrescar();
      })
    );
  }

  onBuscarModelo(callback: (modelo: Modelo) => void): void {
    this.vehiculoService.abrirBuscadorModelo(true).subscribe(res => {
      if (res) {
        if (res.adicionar) {
          this.vehiculoService.abrirAdicionarModelo().subscribe(nuevoModelo => {
            if (nuevoModelo) {
              callback(nuevoModelo);
            }
          });
        } else {
          callback(res);
        }
      }
    });
  }

  onBuscarTipoVehiculo(callback: (tipo: TipoVehiculo) => void): void {
    this.vehiculoService.abrirBuscadorTipoVehiculo(true).subscribe(res => {
      if (res) {
        if (res.adicionar) {
          this.vehiculoService.abrirAdicionarTipoVehiculo().subscribe(nuevoTipo => {
            if (nuevoTipo) {
              callback(nuevoTipo);
            }
          });
        } else {
          callback(res);
        }
      }
    });
  }

  onBuscarPropietario(callback: (persona: Persona) => void): void {
    this.assetCommonDialogService.buscarPersona(callback);
  }

  onBuscarProveedor(callback: (persona: Persona) => void): void {
    this.assetCommonDialogService.buscarPersona(callback);
  }

  onBuscarMoneda(callback: (moneda: any) => void): void {
    this.assetCommonDialogService.buscarMoneda(callback);
  }

  onGuardar(form: any, vehiculo: Vehiculo, dialogRef: any): void {
    if (form.valid) {
      const values = form.getRawValue();
      const modeloId = Number(values.modeloId);
      const tipoVehiculoId = Number(values.tipoVehiculoId);
      const input: VehiculoInput = {
        ...values,
        id: values.id ? Number(values.id) : undefined,
        chapa: values.chapa?.trim()?.toUpperCase(),
        color: values.color?.trim()?.toUpperCase(),
        fechaAdquisicion: values.fechaAdquisicion ? dateToString(new Date(values.fechaAdquisicion), 'yyyy-MM-dd') : null,
        primerKilometraje: values.primerKilometraje || null,
        capacidadKg: values.capacidadKg || null,
        capacidadPasajeros: values.capacidadPasajeros || null,
        modeloId: Number.isFinite(modeloId) ? modeloId : null,
        tipoVehiculoId: Number.isFinite(tipoVehiculoId) ? tipoVehiculoId : null,
        proveedorId: values.proveedorId ? Number(values.proveedorId) : undefined,
        monedaId: values.monedaId ? Number(values.monedaId) : undefined,
        usuarioId: this.mainService.usuarioActual?.id || vehiculo?.usuario?.id
      };
      this.vehiculoService.onGuardar(input).subscribe(res => {
        if (res) {
          if (dialogRef) {
            dialogRef.close(true);
          } else {
            this.tabService.removeTab(this.tabService.currentIndex);
          }
        }
      });
    }
  }

  onCancelar(dialogRef: any): void {
    if (dialogRef) {
      dialogRef.close();
    } else {
      this.tabService.removeTab(this.tabService.currentIndex);
    }
  }
}
