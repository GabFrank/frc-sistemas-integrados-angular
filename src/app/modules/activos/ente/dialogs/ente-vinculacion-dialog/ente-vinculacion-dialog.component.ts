import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EnteService } from '../../service/ente.service';
import { Ente } from '../../models/ente.model';
import { EnteVinculacion, EnteVinculacionInput } from '../../models/ente-vinculacion.model';
import { TipoEnte } from '../../enums/tipo-ente.enum';
import { Sucursal } from '../../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../../empresarial/sucursal/sucursal.service';
import { MainService } from '../../../../../main.service';
import { Persona } from '../../../../personas/persona/persona.model';
import { AssetCommonDialogService } from '../../../../../shared/services/asset-common-dialog.service';
import { GenericCrudService } from '../../../../../generics/generic-crud.service';
import { SaveEnteVinculacionGQL } from '../../graphql/saveEnteVinculacion';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';

export type ModoVinculacion = 'LOCAL' | 'BIEN';

export interface EnteVinculacionDialogData {
  modo: ModoVinculacion;
  sucursalId?: number;
  vinculacion?: EnteVinculacion;
}

interface BienVinculadoItem {
  ente: Ente;
  observacion: string;
}

@Component({
  selector: 'app-ente-vinculacion-dialog',
  templateUrl: './ente-vinculacion-dialog.component.html',
  styleUrls: ['./ente-vinculacion-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnteVinculacionDialogComponent implements OnInit {
  private enteService = inject(EnteService);
  private sucursalService = inject(SucursalService);
  private mainService = inject(MainService);
  private assetDialog = inject(AssetCommonDialogService);
  private generic = inject(GenericCrudService);
  private saveVinculacionGQL = inject(SaveEnteVinculacionGQL);
  private notificacion = inject(NotificacionSnackbarService);
  private cdr = inject(ChangeDetectorRef);

  sucursales: Sucursal[] = [];
  sucursalControl = new FormControl<number | null>(null, Validators.required);
  esPropioControl = new FormControl<boolean>(true, Validators.required);
  observacionControl = new FormControl('');
  alquilerMontoControl = new FormControl<number | null>(null);
  alquilerDiaControl = new FormControl<number | null>(null);
  alquilerVigenciaControl = new FormControl<Date | null>(null);

  selectedInmueble: Ente | null = null;
  inmuebleDisplay = '';
  selectedArrendador: Persona | null = null;
  arrendadorDisplay = '';

  tipoEnteControl = new FormControl<TipoEnte | null>(TipoEnte.VEHICULO, Validators.required);
  selectedBien: Ente | null = null;
  bienDisplay = '';
  bienesAgregados: BienVinculadoItem[] = [];

  tiposBien = [TipoEnte.VEHICULO, TipoEnte.MUEBLE, TipoEnte.EQUIPO];
  isLoading = false;

  constructor(
    public dialogRef: MatDialogRef<EnteVinculacionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EnteVinculacionDialogData
  ) {}

  ngOnInit(): void {
    this.sucursalService.onGetAllSucursales().subscribe(res => {
      this.sucursales = res || [];
      if (this.data?.sucursalId) {
        this.sucursalControl.setValue(this.data.sucursalId);
      }
      this.cdr.markForCheck();
    });

    if (this.data?.vinculacion) {
      const v = this.data.vinculacion;
      this.sucursalControl.setValue(v.sucursal?.id || null);
      if (this.data.modo === 'LOCAL') {
        this.esPropioControl.setValue(v.esPropio ?? true);
        this.selectedInmueble = v.ente || null;
        this.inmuebleDisplay = v.ente?.descripcion || '';
        this.selectedArrendador = v.alquilerProveedor || null;
        this.arrendadorDisplay = v.alquilerProveedor?.nombre || '';
        this.alquilerMontoControl.setValue(v.alquilerMonto ?? null);
        this.alquilerDiaControl.setValue(v.alquilerDiaVencimiento ?? null);
        if (v.alquilerVigencia) {
          this.alquilerVigenciaControl.setValue(new Date(v.alquilerVigencia));
        }
      } else {
        this.observacionControl.setValue(v.observacion || '');
        this.selectedBien = v.ente || null;
        this.bienDisplay = v.ente?.descripcion || '';
        if (v.ente?.tipoEnte) {
          this.tipoEnteControl.setValue(v.ente.tipoEnte);
        }
      }
    }
  }

  get esModoLocal(): boolean {
    return this.data.modo === 'LOCAL';
  }

  get esAlquilado(): boolean {
    return this.esPropioControl.value === false;
  }

  onBuscarInmueble(): void {
    this.enteService.abrirBuscadorEnte(TipoEnte.INMUEBLE).subscribe(ente => {
      if (ente) {
        this.selectedInmueble = ente;
        this.inmuebleDisplay = ente.descripcion || `Inmueble #${ente.referenciaId}`;
        this.cdr.markForCheck();
      }
    });
  }

  onBuscarArrendador(): void {
    this.assetDialog.buscarPersona((persona) => {
      this.selectedArrendador = persona;
      this.arrendadorDisplay = persona.nombre || '';
      this.cdr.markForCheck();
    });
  }

  onBuscarBien(): void {
    const tipo = this.tipoEnteControl.value;
    if (!tipo) return;
    this.enteService.abrirBuscadorEnte(tipo).subscribe(ente => {
      if (ente) {
        this.selectedBien = ente;
        this.bienDisplay = ente.descripcion || '';
        this.cdr.markForCheck();
      }
    });
  }

  agregarBienALista(): void {
    if (!this.selectedBien) return;
    this.bienesAgregados = [
      ...this.bienesAgregados,
      { ente: this.selectedBien, observacion: this.observacionControl.value || '' },
    ];
    this.selectedBien = null;
    this.bienDisplay = '';
    this.observacionControl.setValue('');
    this.cdr.markForCheck();
  }

  quitarBien(index: number): void {
    this.bienesAgregados = this.bienesAgregados.filter((_, i) => i !== index);
    this.cdr.markForCheck();
  }

  onGuardar(): void {
    if (!this.sucursalControl.value) return;
    this.isLoading = true;

    if (this.esModoLocal) {
      const input: EnteVinculacionInput = {
        id: this.data?.vinculacion?.id,
        sucursalId: this.sucursalControl.value!,
        esPropio: this.esPropioControl.value ?? true,
        enteId: this.esPropioControl.value ? this.selectedInmueble?.id : undefined,
        alquilerProveedorId: !this.esPropioControl.value ? this.selectedArrendador?.id : undefined,
        alquilerMonto: !this.esPropioControl.value ? this.alquilerMontoControl.value ?? undefined : undefined,
        alquilerDiaVencimiento: !this.esPropioControl.value ? this.alquilerDiaControl.value ?? undefined : undefined,
        alquilerVigencia: !this.esPropioControl.value && this.alquilerVigenciaControl.value
          ? this.formatFecha(this.alquilerVigenciaControl.value)
          : undefined,
        usuarioId: this.mainService.usuarioActual?.id,
      };
      this.generic.onSave(this.saveVinculacionGQL, input).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res) {
            this.notificacion.openSucess('Configuración de local guardada');
            this.dialogRef.close(res);
          }
        },
        error: () => {
          this.isLoading = false;
          this.notificacion.openWarn('No se pudo guardar la configuración');
          this.cdr.markForCheck();
        },
      });
      return;
    }

    const items = this.bienesAgregados.length
      ? this.bienesAgregados
      : (this.selectedBien ? [{ ente: this.selectedBien, observacion: this.observacionControl.value || '' }] : []);

    if (!items.length) {
      this.isLoading = false;
      this.notificacion.openWarn('Debe seleccionar al menos un bien');
      return;
    }

    let pendientes = items.length;
    const resultados: EnteVinculacion[] = [];
    items.forEach(item => {
      const input: EnteVinculacionInput = {
        sucursalId: this.sucursalControl.value!,
        enteId: item.ente.id,
        observacion: item.observacion,
        usuarioId: this.mainService.usuarioActual?.id,
      };
      this.generic.onSave(this.saveVinculacionGQL, input).subscribe({
        next: (res) => {
          if (res) resultados.push(res);
          pendientes--;
          if (pendientes === 0) {
            this.isLoading = false;
            this.notificacion.openSucess('Vinculación guardada');
            this.dialogRef.close(resultados);
          }
        },
        error: () => {
          pendientes--;
          if (pendientes === 0) {
            this.isLoading = false;
            this.notificacion.openWarn('Error al guardar alguna vinculación');
            this.cdr.markForCheck();
          }
        },
      });
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
