import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { startWith } from 'rxjs/operators';
import { CargandoDialogService } from '../../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { Cargo } from '../../../../empresarial/cargo/cargo.model';
import { CargoService } from '../../../../empresarial/cargo/cargo.service';
import { TipoGasto, TipoGastoInput } from '../../models/tipo-gasto.model';
import { GastoService } from '../../service/gasto.service';
import { ModuloGastoService } from '../../service/modulo-gasto.service';
import {
  CampoCapturaContinuo,
  ModuloGastoInfo,
  ReglasTipoGastoModulo,
  buscarModuloInfo,
  calcularReglasTipoGastoModulo,
  camposCapturaGastoContinuo,
  esGastoContinuoRecurrente,
} from '../../utils/tipo-gasto-modulo-reglas.util';

export class AdicionarTipoGastoData {
  tipoGasto?: TipoGasto;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-adicionar-tipo-gasto-dialog',
  templateUrl: './adicionar-tipo-gasto-dialog.component.html',
  styleUrls: ['./adicionar-tipo-gasto-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdicionarTipoGastoDialogComponent implements OnInit {

  idControl = new FormControl();
  descripcionControl = new FormControl(null, Validators.required);
  autorizacionControl = new FormControl(true, Validators.required);
  cargoControl = new FormControl();
  moduloPadreControl = new FormControl<string | null>(null, Validators.required);
  activoControl = new FormControl(true);
  activoEnSucursalesControl = new FormControl(true);
  naturezaControl = new FormControl('VARIABLE');
  esPagoCuotaControl = new FormControl(false);
  afectaFinanzasControl = new FormControl(false);
  creadoEnControl = new FormControl();
  usuarioControl = new FormControl();
  selectedTipoGasto: TipoGasto;
  listCargo: Cargo[] = [];
  moduloPadreList: ModuloGastoInfo[] = [];
  modulosActivos: ModuloGastoInfo[] = [];
  modulosServicio: ModuloGastoInfo[] = [];
  modulosOtros: ModuloGastoInfo[] = [];
  reglas: ReglasTipoGastoModulo = calcularReglasTipoGastoModulo(null, 'VARIABLE');
  naturalezaServicioForzada = false;
  requisitosContinuo: CampoCapturaContinuo[] = [];
  mostrarRequisitosContinuo = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarTipoGastoData,
    private matDialogRef: MatDialogRef<AdicionarTipoGastoDialogComponent>,
    private gastoService: GastoService,
    private moduloGastoService: ModuloGastoService,
    private cargoService: CargoService,
    private cargandoService: CargandoDialogService,
    private cdr: ChangeDetectorRef
  ) {
    if (data.tipoGasto != null) {
      this.selectedTipoGasto = data.tipoGasto;
    }
  }

  ngOnInit(): void {
    this.idControl.disable();
    this.creadoEnControl.disable();
    this.usuarioControl.disable();

    this.moduloPadreControl.valueChanges
      .pipe(startWith(this.moduloPadreControl.value), untilDestroyed(this))
      .subscribe(() => this.actualizarReglasModulo());

    this.naturezaControl.valueChanges
      .pipe(startWith(this.naturezaControl.value), untilDestroyed(this))
      .subscribe(() => this.actualizarReglasModulo());

    this.moduloGastoService.obtenerModulos().pipe(untilDestroyed(this)).subscribe(modulos => {
      this.moduloPadreList = modulos;
      this.modulosActivos = modulos.filter((item) => item.grupo === 'ACTIVO');
      this.modulosServicio = modulos.filter((item) => item.grupo === 'SERVICIO');
      this.modulosOtros = modulos.filter((item) => item.grupo === 'OTRO');
      this.actualizarReglasModulo();
      this.cdr.markForCheck();
    });

    this.cargoService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.listCargo = res;
        if (this.selectedTipoGasto != null) {
          this.cargarDatos();
        }
        this.cdr.markForCheck();
      }
    });
  }

  private actualizarReglasModulo(): void {
    const modulo = this.moduloPadreControl.value;
    const info = buscarModuloInfo(this.moduloPadreList, modulo);
    const servicio = info?.esServicioContinuo === true;

    if (servicio && this.naturezaControl.value !== 'CONTINUO') {
      this.naturalezaServicioForzada = true;
      this.naturezaControl.setValue('CONTINUO', { emitEvent: false });
    } else {
      this.naturalezaServicioForzada = false;
    }

    this.reglas = calcularReglasTipoGastoModulo(info, this.naturezaControl.value);

    if (this.reglas.mostrarCuotas) {
      this.esPagoCuotaControl.setValue(this.reglas.esPagoCuotaActivo, { emitEvent: false });
    } else {
      this.esPagoCuotaControl.setValue(false, { emitEvent: false });
    }

    if (this.reglas.mostrarAfectaFinanzas) {
      this.afectaFinanzasControl.setValue(this.reglas.afectaFinanzasActivo, { emitEvent: false });
    } else {
      this.afectaFinanzasControl.setValue(false, { emitEvent: false });
    }

    const esContinuo = esGastoContinuoRecurrente(this.naturezaControl.value);
    this.mostrarRequisitosContinuo = servicio || (esContinuo && modulo != null && modulo !== 'OTRO');
    this.requisitosContinuo = this.mostrarRequisitosContinuo
      ? camposCapturaGastoContinuo(modulo)
      : [];

    this.cdr.markForCheck();
  }

  cargarDatos(): void {
    this.idControl.setValue(this.selectedTipoGasto.id);
    this.descripcionControl.setValue(this.selectedTipoGasto?.descripcion);
    this.activoControl.setValue(this.selectedTipoGasto?.activo ?? true);
    this.activoEnSucursalesControl.setValue(this.selectedTipoGasto?.activoEnSucursales ?? true);
    this.autorizacionControl.setValue(this.selectedTipoGasto?.autorizacion);
    this.cargoControl.setValue(this.selectedTipoGasto?.cargo?.id);
    this.moduloPadreControl.setValue(this.selectedTipoGasto?.moduloPadre ?? null);
    this.naturezaControl.setValue(this.selectedTipoGasto?.tipoNaturaleza || 'VARIABLE');
    this.esPagoCuotaControl.setValue(this.selectedTipoGasto?.esPagoCuotaActivo ?? false);
    this.afectaFinanzasControl.setValue(this.selectedTipoGasto?.afectaFinanzasActivo ?? false);
    this.creadoEnControl.setValue(this.selectedTipoGasto?.creadoEn);
    this.usuarioControl.setValue(this.selectedTipoGasto?.usuario?.persona?.nombre);
    this.actualizarReglasModulo();
  }

  onSave(): void {
    const input = new TipoGastoInput();
    if (this.selectedTipoGasto != null) {
      input.id = this.selectedTipoGasto.id;
      input.creadoEn = this.selectedTipoGasto.creadoEn;
      input.usuarioId = this.selectedTipoGasto?.usuario?.id;
    }
    input.moduloPadre = this.moduloPadreControl.value;
    input.descripcion = this.descripcionControl.value;
    input.autorizacion = this.autorizacionControl.value;
    input.cargoId = this.cargoControl.value;
    input.activo = this.activoControl.value;
    input.activoEnSucursales = this.activoEnSucursalesControl.value;
    input.tipoNaturaleza = this.naturezaControl.value;
    input.esPagoCuotaActivo = this.reglas.mostrarCuotas ? this.esPagoCuotaControl.value : false;
    input.afectaFinanzasActivo = this.reglas.mostrarAfectaFinanzas ? this.afectaFinanzasControl.value : false;
    this.gastoService.tipoGastoOnSave(input).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.matDialogRef.close(res);
      }
    });
  }

  onCancel(): void {
    this.matDialogRef.close();
  }

  onDelete(): void {
    this.gastoService.tipoGastoOnDelete(this.selectedTipoGasto.id).pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.matDialogRef.close('delete');
      }
    });
  }

}
