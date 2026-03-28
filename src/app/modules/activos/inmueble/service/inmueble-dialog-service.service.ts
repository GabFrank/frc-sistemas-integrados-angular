import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
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

@Injectable({
  providedIn: 'root'
})
export class InmuebleDialogService {
  private inmuebleService = inject(InmuebleService);
  private dialog = inject(MatDialog);
  private mainService = inject(MainService);

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
    this.inmuebleService.abrirBuscadorPropietario().subscribe((res: any) => {
      if (res) {
        if (res.adicionar) {
          this.inmuebleService.abrirAdicionarPersona().subscribe(nuevaPersona => {
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

  onBuscarProveedor(callback: (persona: Persona) => void): void {
    this.inmuebleService.abrirBuscadorPropietario().subscribe((res: any) => {
      if (res) {
        if (res.adicionar) {
          this.inmuebleService.abrirAdicionarPersona().subscribe(nuevaPersona => {
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
    this.inmuebleService.abrirBuscadorMoneda().subscribe(res => {
      if (res) {
        callback(res);
      }
    });
  }

  onBuscarPais(callback: (pais: Pais) => void): void {
    this.inmuebleService.abrirBuscadorPais().subscribe(res => {
      if (res) {
        callback(res);
      }
    });
  }

  onBuscarCiudad(callback: (ciudad: Ciudad) => void): void {
    this.inmuebleService.abrirBuscadorCiudad().subscribe(res => {
      if (res) {
        callback(res);
      }
    });
  }

  onGuardar(form: any, inmueble: Inmueble, dialogRef: any): void {
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

  onCancelar(dialogRef: any): void {
    dialogRef.close();
  }
}
