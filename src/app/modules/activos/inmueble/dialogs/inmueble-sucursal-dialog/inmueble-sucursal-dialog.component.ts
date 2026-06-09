import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EnteVinculacion, EnteVinculacionInput } from '../../../ente/models/ente-vinculacion.model';
import { Sucursal } from '../../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../../empresarial/sucursal/sucursal.service';
import { MainService } from '../../../../../main.service';
import { Persona } from '../../../../personas/persona/persona.model';
import { AssetCommonDialogService } from '../../../../../shared/services/asset-common-dialog.service';
import { GenericCrudService } from '../../../../../generics/generic-crud.service';
import { SaveEnteVinculacionGQL } from '../../../ente/graphql/saveEnteVinculacion';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { Inmueble } from '../../models/inmueble.model';
import { EnteService } from '../../../ente/service/ente.service';
import { TipoEnte } from '../../../ente/enums/tipo-ente.enum';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

export interface InmuebleSucursalDialogData {
  inmueble: Inmueble;
  vinculacion?: EnteVinculacion;
}

@Component({
  selector: 'app-inmueble-sucursal-dialog',
  templateUrl: './inmueble-sucursal-dialog.component.html',
  styleUrls: ['./inmueble-sucursal-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InmuebleSucursalDialogComponent implements OnInit {
  private sucursalService = inject(SucursalService);
  private mainService = inject(MainService);
  private assetDialog = inject(AssetCommonDialogService);
  private generic = inject(GenericCrudService);
  private saveVinculacionGQL = inject(SaveEnteVinculacionGQL);
  private notificacion = inject(NotificacionSnackbarService);
  private enteService = inject(EnteService);
  private cdr = inject(ChangeDetectorRef);

  sucursales: Sucursal[] = [];
  sucursalControl = new FormControl<number | null>(null, Validators.required);
  esPropioControl = new FormControl<boolean>(true, Validators.required);
  alquilerMontoControl = new FormControl<number | null>(null);
  alquilerDiaControl = new FormControl<number | null>(null);
  alquilerVigenciaControl = new FormControl<Date | null>(null);

  selectedArrendador: Persona | null = null;
  arrendadorDisplay = '';
  isLoading = false;

  constructor(
    public dialogRef: MatDialogRef<InmuebleSucursalDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InmuebleSucursalDialogData
  ) {}

  ngOnInit(): void {
    this.sucursalService.onGetAllSucursales().subscribe(res => {
      this.sucursales = res || [];
      this.cdr.markForCheck();
    });

    const v = this.data?.vinculacion;
    if (v) {
      this.sucursalControl.setValue(v.sucursal?.id || null);
      this.esPropioControl.setValue(v.esPropio ?? true);
      this.selectedArrendador = v.alquilerProveedor || null;
      this.arrendadorDisplay = v.alquilerProveedor?.nombre || '';
      this.alquilerMontoControl.setValue(v.alquilerMonto ?? null);
      this.alquilerDiaControl.setValue(v.alquilerDiaVencimiento ?? null);
      if (v.alquilerVigencia) {
        this.alquilerVigenciaControl.setValue(new Date(v.alquilerVigencia));
      }
    }
  }

  get inmuebleDisplay(): string {
    return this.data?.inmueble?.nombreAsignado || this.data?.inmueble?.direccion || `Inmueble #${this.data?.inmueble?.id}`;
  }

  get esAlquilado(): boolean {
    return this.esPropioControl.value === false;
  }

  onBuscarArrendador(): void {
    this.assetDialog.buscarPersona((persona) => {
      this.selectedArrendador = persona;
      this.arrendadorDisplay = persona.nombre || '';
      this.cdr.markForCheck();
    });
  }

  onGuardar(): void {
    if (!this.sucursalControl.value || !this.data?.inmueble?.id) return;
    this.isLoading = true;

    const esPropio = this.esPropioControl.value ?? true;
    this.enteService.onGetByReferenciaId(TipoEnte.INMUEBLE, this.data.inmueble.id).pipe(
      switchMap(ente => {
        if (!ente?.id) {
          this.notificacion.openWarn('No se encontró el ente del inmueble');
          this.isLoading = false;
          this.cdr.markForCheck();
          return of(null);
        }

        const vinculacionInput: EnteVinculacionInput = {
          id: this.data?.vinculacion?.id,
          sucursalId: this.sucursalControl.value!,
          enteId: ente.id,
          esPropio,
          alquilerProveedorId: !esPropio ? this.selectedArrendador?.id : undefined,
          alquilerMonto: !esPropio ? this.alquilerMontoControl.value ?? undefined : undefined,
          alquilerDiaVencimiento: !esPropio ? this.alquilerDiaControl.value ?? undefined : undefined,
          alquilerVigencia: !esPropio && this.alquilerVigenciaControl.value
            ? this.formatFecha(this.alquilerVigenciaControl.value)
            : undefined,
          usuarioId: this.mainService.usuarioActual?.id,
        };

        return this.generic.onSave(this.saveVinculacionGQL, vinculacionInput);
      })
    ).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res) {
          this.notificacion.openSucess('Inmueble vinculado a la sucursal');
          this.dialogRef.close(res);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.notificacion.openWarn('No se pudo guardar la vinculación');
        this.cdr.markForCheck();
      },
    });
  }

  onCancelar(): void {
    this.dialogRef.close();
  }

  private formatFecha(fecha: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T00:00:00`;
  }
}
