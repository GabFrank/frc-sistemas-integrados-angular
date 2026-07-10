import { Injectable, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { MainService } from '../../../../main.service';
import { AssetCommonDialogService } from '../../../../shared/services/asset-common-dialog.service';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { Persona } from '../../../personas/persona/persona.model';
import { Proveedor } from '../../../personas/proveedor/proveedor.model';
import { EquipoFormComponent } from '../dialogs/equipo-form/equipo-form.component';
import { EquipoInput } from '../models/equipo-input.model';
import { Equipo } from '../models/equipo.model';
import { TipoEquipo } from '../models/tipo-equipo.model';
import { ModeloEquipo } from '../models/modelo-equipo.model';
import { EquiposService } from './equipos.service';
import { sanitizarCuotasDetalle } from '../../shared/models/cuota-detalle.model';

@Injectable({
  providedIn: 'root'
})
export class EquipoDialogService {
  private equiposService = inject(EquiposService);
  private dialog = inject(MatDialog);
  private mainService = inject(MainService);
  private assetCommonDialogService = inject(AssetCommonDialogService);

  abrirFormulario(equipo?: Equipo): Observable<boolean | undefined> {
    const dialogRef = this.dialog.open(EquipoFormComponent, {
      width: '800px',
      data: equipo,
      disableClose: true,
      autoFocus: false,
    });

    return dialogRef.afterClosed().pipe(
      tap((res) => {
        if (res) {
          this.equiposService.refrescar();
        }
      })
    );
  }

  onBuscarPropietario(callback: (persona: Persona) => void): void {
    this.assetCommonDialogService.buscarPersona(callback);
  }

  onBuscarModelo(callback: (modelo: ModeloEquipo) => void): void {
    this.equiposService.abrirBuscadorModelo(true).subscribe((res) => {
      if (res) {
        if (res.adicionar) {
          this.equiposService.abrirAdicionarModelo().subscribe((nuevoModelo) => {
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

  onBuscarTipoEquipo(callback: (tipo: TipoEquipo) => void): void {
    this.equiposService.abrirBuscadorTipoEquipo().subscribe((res) => {
      if (res) {
        if ('adicionar' in res && res.adicionar) {
          this.equiposService.abrirAdicionarTipoEquipo().subscribe((nuevoTipo) => {
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

  onBuscarProveedor(callback: (proveedor: Proveedor) => void): void {
    this.assetCommonDialogService.buscarProveedor(callback);
  }

  onBuscarMoneda(callback: (moneda: Moneda) => void): void {
    this.assetCommonDialogService.buscarMoneda(callback);
  }

  onGuardar(
    form: FormGroup,
    equipo: Equipo,
    dialogRef: MatDialogRef<EquipoFormComponent>,
    cuotasDetalle: { numeroCuota: number; monto: number; pagado?: boolean }[] = [],
    cerrarAlGuardar = false
  ): Observable<Equipo | null> {
    if (!form.valid) {
      form.markAllAsTouched();
      return of(null);
    }

    const values = form.getRawValue();
    const input: EquipoInput = {
      id: values.id ? Number(values.id) : undefined,
      propietarioId: Number(values.propietarioId),
      identificador: values.identificador?.toUpperCase() || '',
      modeloId: values.modeloId ? Number(values.modeloId) : undefined,
      descripcion: values.descripcion?.toUpperCase() || '',
      tipoEquipoId: Number(values.tipoEquipoId),
      consumeEnergia: values.consumeEnergia,
      consumoValor: values.consumoValor?.toUpperCase() || '',
      usuarioId: this.mainService.usuarioActual?.id || equipo?.usuario?.id,
      costo: values.costo,
      valorTasacion: values.valorTasacion,
      valorTasacionPyg: values.valorTasacionPyg,
      valorTasacionBrl: values.valorTasacionBrl,
      situacionPago: values.situacionPago,
      proveedorId: values.proveedorId ? Number(values.proveedorId) : undefined,
      monedaId: values.monedaId ? Number(values.monedaId) : undefined,
      montoTotal: values.montoTotal,
      montoYaPagado: values.montoYaPagado,
      cantidadCuotas: values.cantidadCuotas,
      cantidadCuotasPagadas: values.cantidadCuotasPagadas,
      diaVencimiento: values.diaVencimiento,
      financiero: {
        costo: values.costo,
        valorTasacion: values.valorTasacion,
        valorTasacionPyg: values.valorTasacionPyg,
        valorTasacionBrl: values.valorTasacionBrl,
        situacionPago: values.situacionPago,
        proveedorId: values.proveedorId ? Number(values.proveedorId) : undefined,
        monedaId: values.monedaId ? Number(values.monedaId) : undefined,
        montoTotal: values.montoTotal,
        montoYaPagado: values.montoYaPagado,
        cantidadCuotas: values.cantidadCuotas,
        cantidadCuotasPagadas: values.cantidadCuotasPagadas,
        diaVencimiento: values.diaVencimiento,
        cuotasDetalle: values.situacionPago === 'PAGANDO' ? sanitizarCuotasDetalle(cuotasDetalle) : undefined,
      },
    };

    return this.equiposService.onGuardar(input).pipe(
      tap((res) => {
        if (res && cerrarAlGuardar) {
          dialogRef.close(true);
        }
      }),
      map((res) => res || null)
    );
  }

  onCancelar(dialogRef: MatDialogRef<unknown>): void {
    dialogRef.close();
  }
}
