import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MuebleService } from './mueble.service';
import { Mueble } from '../models/mueble.model';
import { MuebleInput } from '../models/mueble-input.model';
import { MuebleFormComponent } from '../dialogs/mueble-form/mueble-form.component';
import { Persona } from '../../../personas/persona/persona.model';
import { FamiliaMueble } from '../models/familia-mueble.model';
import { TipoMueble } from '../models/tipo-mueble.model';
import { MainService } from '../../../../main.service';
import { AssetCommonDialogService } from '../../../../shared/services/asset-common-dialog.service';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class MuebleDialogService {
  private muebleService = inject(MuebleService);
  private dialog = inject(MatDialog);
  private mainService = inject(MainService);
  private assetCommonDialogService = inject(AssetCommonDialogService);

  abrirFormulario(mueble?: Mueble): Observable<boolean | undefined> {
    const dialogRef = this.dialog.open(MuebleFormComponent, {
      width: '800px',
      data: mueble,
      disableClose: true,
      autoFocus: false,
    });

    return dialogRef.afterClosed().pipe(
      tap((res) => {
        if (res) this.muebleService.refrescar();
      })
    );
  }

  onBuscarPropietario(callback: (persona: Persona) => void): void {
    this.assetCommonDialogService.buscarPersona(callback);
  }

  onBuscarFamilia(callback: (familia: FamiliaMueble) => void): void {
    this.muebleService.abrirBuscadorFamilia().subscribe((res) => {
      if (res) {
        if ('adicionar' in res && res.adicionar) {
          this.muebleService.abrirAdicionarFamilia().subscribe(nuevaFamilia => {
            if (nuevaFamilia) {
              callback(nuevaFamilia);
            }
          });
        } else if (!('adicionar' in res)) {
          callback(res);
        }
      }
    });
  }

  onBuscarTipo(familiaId: number | undefined, callback: (tipo: TipoMueble) => void): void {
    this.muebleService.abrirBuscadorTipo().subscribe((res) => {
      if (res) {
        if ('adicionar' in res && res.adicionar) {
          this.muebleService.abrirAdicionarTipo(familiaId).subscribe(nuevoTipo => {
            if (nuevoTipo) {
              callback(nuevoTipo);
            }
          });
        } else if (!('adicionar' in res)) {
          callback(res);
        }
      }
    });
  }

  onBuscarProveedor(callback: (persona: Persona) => void): void {
    this.assetCommonDialogService.buscarPersona(callback);
  }

  onBuscarMoneda(callback: (moneda: Moneda) => void): void {
    this.assetCommonDialogService.buscarMoneda(callback);
  }

  onGuardar(form: FormGroup, mueble: Mueble, dialogRef: MatDialogRef<MuebleFormComponent>): void {
    if (form.valid) {
      const values = form.getRawValue();
      const input: MuebleInput = {
        ...values,
        id: values.id ? Number(values.id) : undefined,
        identificador: values.identificador?.toUpperCase() || '',
        descripcion: values.descripcion?.toUpperCase() || '',
        consumoValor: values.consumoValor?.toUpperCase() || '',
        propietarioId: Number(values.propietarioId),
        familiaId: Number(values.familiaId),
        tipoMuebleId: Number(values.tipoMuebleId),
        proveedorId: values.proveedorId ? Number(values.proveedorId) : undefined,
        monedaId: values.monedaId ? Number(values.monedaId) : undefined,
        usuarioId: this.mainService.usuarioActual?.id || mueble?.usuario?.id
      };
      this.muebleService.onGuardar(input).subscribe(res => {
        if (res) dialogRef.close(true);
      });
    }
  }

  onCancelar(dialogRef: MatDialogRef<any>): void {
    dialogRef.close();
  }
}
