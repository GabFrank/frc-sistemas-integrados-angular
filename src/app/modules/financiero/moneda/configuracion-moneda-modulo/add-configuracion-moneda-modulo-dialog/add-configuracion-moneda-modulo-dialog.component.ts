import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { dateToString } from '../../../../../commons/core/utils/dateUtils';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { Sucursal } from '../../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../../empresarial/sucursal/sucursal.service';
import { Moneda } from '../../moneda.model';
import { MonedaService } from '../../moneda.service';
import {
  ConfiguracionMonedaModuloInput,
  ModuloMoneda,
  MODULOS_MONEDA
} from '../configuracion-moneda-modulo.model';
import { ConfiguracionMonedaModuloService } from '../configuracion-moneda-modulo.service';

export interface AddConfiguracionMonedaModuloData {
  /** Módulo con el que arranca el diálogo (el del filtro de la lista). */
  modulo?: ModuloMoneda | null;
}

/** "HH:mm" → [horas, minutos]; null si no es una hora válida. */
function leerHora(texto: string | null | undefined): [number, number] | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((texto || '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? [h, min] : null;
}

/**
 * Nueva configuración de moneda por módulo. Siempre crea una fila: no hay edición.
 * La sucursal solo existe para PDV (el central rechaza otra combinación); sin fecha, rige desde ya.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-add-configuracion-moneda-modulo-dialog',
  templateUrl: './add-configuracion-moneda-modulo-dialog.component.html',
  styleUrls: ['./add-configuracion-moneda-modulo-dialog.component.scss']
})
export class AddConfiguracionMonedaModuloDialogComponent implements OnInit {

  readonly modulos = MODULOS_MONEDA;

  moduloControl = new FormControl<ModuloMoneda | null>(null, Validators.required);
  sucursalControl = new FormControl<number | null>(null);
  monedaControl = new FormControl<number | null>(null, Validators.required);
  fechaControl = new FormControl<Date | null>(null);
  horaControl = new FormControl<string>('00:00');
  formGroup = new FormGroup({
    modulo: this.moduloControl,
    sucursal: this.sucursalControl,
    moneda: this.monedaControl,
    fecha: this.fechaControl,
    hora: this.horaControl,
  });

  esPdv = false;
  monedas: Moneda[] = [];
  sucursales: Sucursal[] = [];
  cargandoMonedas = true;
  errorMonedas = false;
  guardando = false;

  constructor(
    private dialogRef: MatDialogRef<AddConfiguracionMonedaModuloDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddConfiguracionMonedaModuloData,
    private service: ConfiguracionMonedaModuloService,
    private monedaService: MonedaService,
    private sucursalService: SucursalService,
    private notificacion: NotificacionSnackbarService,
  ) {}

  ngOnInit(): void {
    this.moduloControl.valueChanges.pipe(untilDestroyed(this)).subscribe((modulo) => {
      this.esPdv = modulo === ModuloMoneda.PDV;
      if (!this.esPdv) this.sucursalControl.setValue(null);
    });
    if (this.data?.modulo) this.moduloControl.setValue(this.data.modulo);
    this.cargarMonedas();
    this.sucursalService.onGetAllSucursales(true).pipe(untilDestroyed(this)).subscribe((res) => {
      this.sucursales = (res || []).filter((s) => s?.id != null);
    });
  }

  cargarMonedas(): void {
    this.cargandoMonedas = true;
    this.errorMonedas = false;
    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe({
      next: (res) => {
        this.cargandoMonedas = false;
        if (res == null) {
          this.errorMonedas = true;
          return;
        }
        this.monedas = res.filter((m) => m.activo !== false);
      },
      error: () => {
        this.cargandoMonedas = false;
        this.errorMonedas = true;
      },
    });
  }

  onLimpiarFecha(): void {
    this.fechaControl.setValue(null);
    this.horaControl.setValue('00:00');
  }

  onGuardar(): void {
    if (this.formGroup.invalid || this.guardando) return;
    let vigenteDesde: string = null;
    if (this.fechaControl.value) {
      const hora = leerHora(this.horaControl.value);
      if (hora == null) {
        this.notificacion.openWarn('La hora tiene que ser HH:mm');
        return;
      }
      const fecha = new Date(this.fechaControl.value);
      fecha.setHours(hora[0], hora[1], 0, 0);
      vigenteDesde = dateToString(fecha);
    }
    const input = new ConfiguracionMonedaModuloInput();
    input.modulo = this.moduloControl.value;
    input.sucursalId = this.esPdv ? this.sucursalControl.value : null;
    input.monedaId = this.monedaControl.value;
    input.vigenteDesde = vigenteDesde;

    this.guardando = true;
    this.service.onSave(input).pipe(untilDestroyed(this)).subscribe({
      next: (res) => {
        this.guardando = false;
        if (res != null) {
          this.notificacion.openSucess('Configuración guardada');
          this.dialogRef.close(res);
        }
      },
      // El rechazo (sin cotización, sucursal fuera de PDV, sin permiso) ya se avisó.
      error: () => (this.guardando = false),
    });
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
