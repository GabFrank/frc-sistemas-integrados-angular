import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InmuebleService } from './inmueble.service';
import { Inmueble } from '../models/inmueble.model';
import { InmuebleInput } from '../models/inmueble-input.model';
import { InmuebleFormComponent } from '../dialogs/inmueble-form/inmueble-form.component';
import { Persona } from '../../../personas/persona/persona.model';
import { Pais } from '../../../general/pais/pais.model';
import { Ciudad } from '../../../general/ciudad/ciudad.model';
import { MainService } from '../../../../main.service';
import { AssetCommonDialogService } from '../../../../shared/services/asset-common-dialog.service';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class InmuebleDialogService {
  private inmuebleService = inject(InmuebleService);
  private dialog = inject(MatDialog);
  private mainService = inject(MainService);
  private assetCommonDialogService = inject(AssetCommonDialogService);

  abrirFormulario(inmueble?: Inmueble): Observable<boolean | undefined> {
    const dialogRef = this.dialog.open(InmuebleFormComponent, {
      width: '800px',
      data: inmueble,
      disableClose: true,
      autoFocus: false,
    });

    return dialogRef.afterClosed().pipe(
      tap((res) => {
        if (res) this.inmuebleService.refrescar();
      })
    );
  }

  onBuscarPropietario(callback: (persona: Persona) => void): void {
    this.assetCommonDialogService.buscarPersona(callback);
  }

  onBuscarProveedor(callback: (persona: Persona) => void): void {
    this.assetCommonDialogService.buscarPersona(callback);
  }

  onBuscarMoneda(callback: (moneda: Moneda) => void): void {
    this.assetCommonDialogService.buscarMoneda(callback);
  }

  onBuscarPais(callback: (pais: Pais) => void): void {
    this.assetCommonDialogService.buscarPais(callback);
  }

  onBuscarCiudad(callback: (ciudad: Ciudad) => void): void {
    this.assetCommonDialogService.buscarCiudad(callback);
  }

  onGuardar(form: FormGroup, inmueble: Inmueble, dialogRef: MatDialogRef<InmuebleFormComponent>): void {
    if (form.valid) {
      const values = form.getRawValue();
      const input: InmuebleInput = {
        ...values,
        id: values.id ? Number(values.id) : undefined,
        propietarioId: Number(values.propietarioId),
        paisId: Number(values.paisId),
        ciudadId: Number(values.ciudadId),
        proveedorId: values.proveedorId ? Number(values.proveedorId) : undefined,
        monedaId: values.monedaId ? Number(values.monedaId) : undefined,
        usuarioId: this.mainService.usuarioActual?.id || inmueble?.usuario?.id
      };
      this.inmuebleService.onGuardar(input).subscribe(res => {
        if (res) dialogRef.close(true);
      });
    }
  }

  onCancelar(dialogRef: MatDialogRef<any>): void {
    dialogRef.close();
  }
}
