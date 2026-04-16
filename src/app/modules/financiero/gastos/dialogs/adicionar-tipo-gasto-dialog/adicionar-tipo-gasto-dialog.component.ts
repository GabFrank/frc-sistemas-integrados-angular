import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CargandoDialogService } from '../../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { Cargo } from '../../../../empresarial/cargo/cargo.model';
import { TipoGasto, TipoGastoInput } from '../../models/tipo-gasto.model';
import { GastoService } from '../../service/gasto.service';
import { CargoService } from '../../../../empresarial/cargo/cargo.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

export class AdicionarTipoGastoData {
  tipoGasto?: TipoGasto;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-adicionar-tipo-gasto-dialog',
  templateUrl: './adicionar-tipo-gasto-dialog.component.html',
  styleUrls: ['./adicionar-tipo-gasto-dialog.component.scss']
})
export class AdicionarTipoGastoDialogComponent implements OnInit {

  idControl = new FormControl();
  descripcionControl = new FormControl(null, Validators.required);
  autorizacionControl = new FormControl(null, Validators.required);
  cargoControl = new FormControl();
  moduloPadreControl = new FormControl<string | null>(null, Validators.required);
  activoControl = new FormControl(true);
  naturezaControl = new FormControl('VARIABLE');
  creadoEnControl = new FormControl();
  usuarioControl = new FormControl();
  selectedTipoGasto: TipoGasto;
  listCargo: Cargo[];
  moduloPadreList = ['MUEBLE', 'INMUEBLE', 'PERSONAS', 'VEHICULO', 'OPERACIONES', 'FINANCIERO', 'OTRO'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarTipoGastoData,
    private matDialogRef: MatDialogRef<AdicionarTipoGastoDialogComponent>,
    private gastoService: GastoService,
    private cargoService: CargoService,
    private cargandoService: CargandoDialogService
  ) {
    if (data.tipoGasto != null) {
      this.selectedTipoGasto = data.tipoGasto;
    }
  }

  ngOnInit(): void {
    this.listCargo = [];
    this.idControl.disable()
    this.creadoEnControl.disable()
    this.usuarioControl.disable()

    this.cargoService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.listCargo = res;
        if (this.selectedTipoGasto != null) {
          this.cargarDatos();
        }
      }
    });

  }

  cargarDatos() {
    this.idControl.setValue(this.selectedTipoGasto.id)
    this.descripcionControl.setValue(this.selectedTipoGasto?.descripcion)
    this.activoControl.setValue(this.selectedTipoGasto?.activo)
    this.autorizacionControl.setValue(this.selectedTipoGasto?.autorizacion)
    this.cargoControl.setValue(this.selectedTipoGasto?.cargo?.id)
    this.moduloPadreControl.setValue(this.selectedTipoGasto?.moduloPadre ?? null);
    this.naturezaControl.setValue(this.selectedTipoGasto?.tipoNaturaleza || 'VARIABLE');
    this.creadoEnControl.setValue(this.selectedTipoGasto?.creadoEn)
    this.usuarioControl.setValue(this.selectedTipoGasto?.usuario?.persona?.nombre)
  }

  onSave() {
    let input = new TipoGastoInput();
    if (this.selectedTipoGasto != null) {
      input.id = this.selectedTipoGasto.id;
      input.creadoEn = this.selectedTipoGasto.creadoEn;
      input.usuarioId = this.selectedTipoGasto?.usuario?.id;
      input.isClasificacion = this.selectedTipoGasto?.isClasificacion;
      input.clasificacionGastoId = this.selectedTipoGasto?.clasificacionGasto?.id;
    } else {
      input.isClasificacion = false;
      input.clasificacionGastoId = null;
    }
    input.moduloPadre = this.moduloPadreControl.value;
    input.descripcion = this.descripcionControl.value;
    input.autorizacion = this.autorizacionControl.value;
    input.cargoId = this.cargoControl.value;
    input.activo = this.activoControl.value;
    input.tipoNaturaleza = this.naturezaControl.value;
    this.gastoService.tipoGastoOnSave(input).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.matDialogRef.close(res)
      }
    })
  }

  onCancel() {
    this.matDialogRef.close()
  }

  onDelete() {
    this.gastoService.tipoGastoOnDelete(this.selectedTipoGasto.id).pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.matDialogRef.close('delete')
      }
    })
  }

}
