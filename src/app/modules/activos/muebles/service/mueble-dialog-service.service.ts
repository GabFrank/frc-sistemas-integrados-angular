import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
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

@Injectable({
  providedIn: 'root'
})
export class MuebleDialogService {
  private muebleService = inject(MuebleService);
  private dialog = inject(MatDialog);
  private mainService = inject(MainService);

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
    this.muebleService.abrirBuscadorPropietario().subscribe((res: any) => {
      if (res) {
        if (res.adicionar) {
          this.muebleService.abrirAdicionarPersona().subscribe(nuevaPersona => {
            if (nuevaPersona) {
              callback(nuevaPersona);
            }
          });
        } else {
          callback(res);
        }
      }
    });
  }

  onBuscarFamilia(callback: (familia: FamiliaMueble) => void): void {
    this.muebleService.abrirBuscadorFamilia().subscribe((res: any) => {
      if (res) {
        if (res.adicionar) {
          this.muebleService.abrirAdicionarFamilia().subscribe(nuevaFamilia => {
            if (nuevaFamilia) {
              callback(nuevaFamilia);
            }
          });
        } else {
          callback(res);
        }
      }
    });
  }

  onBuscarTipo(familiaId: number | undefined, callback: (tipo: TipoMueble) => void): void {
    this.muebleService.abrirBuscadorTipo().subscribe((res: any) => {
      if (res) {
        if (res.adicionar) {
          this.muebleService.abrirAdicionarTipo(familiaId).subscribe(nuevoTipo => {
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

  onBuscarProveedor(callback: (persona: Persona) => void): void {
    this.muebleService.abrirBuscadorPropietario().subscribe((res: any) => {
      if (res) {
        if (res.adicionar) {
          this.muebleService.abrirAdicionarPersona().subscribe(nuevaPersona => {
            if (nuevaPersona) {
              callback(nuevaPersona);
            }
          });
        } else {
          callback(res);
        }
      }
    });
  }

  onBuscarMoneda(callback: (moneda: any) => void): void {
    this.muebleService.abrirBuscadorMoneda().subscribe(res => {
      if (res) {
        callback(res);
      }
    });
  }

  onGuardar(form: any, mueble: Mueble, dialogRef: any): void {
    if (form.valid) {
      const values = form.getRawValue();
      const input: MuebleInput = {
        ...values,
        id: values.id ? Number(values.id) : undefined,
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

  onCancelar(dialogRef: any): void {
    dialogRef.close();
  }
}
