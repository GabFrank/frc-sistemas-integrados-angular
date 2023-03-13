import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { Cargo } from '../../../empresarial/cargo/cargo.model';
import { TipoGasto, TipoGastoInput } from '../list-tipo-gastos/tipo-gasto.model';
import { TipoGastoService } from '../tipo-gasto.service';

export class AdicionarTipoGastoData {
  tipoGasto?: TipoGasto;
  parent: TipoGasto;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

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
  cargoControl = new FormControl(true);
  activoControl = new FormControl(true);
  creadoEnControl = new FormControl();
  usuarioControl = new FormControl();
  selectedTipoGasto: TipoGasto;
  selectedCargo: Cargo;
  listCargo: Cargo[];
  selectedParent: TipoGasto;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarTipoGastoData,
    private matDialogRef: MatDialogRef<AdicionarTipoGastoDialogComponent>,
    private tipoGastoService: TipoGastoService,
    private cargandoService: CargandoDialogService
  ) {
    if (data.tipoGasto != null) {
      this.selectedTipoGasto = data.tipoGasto;
      this.cargarDatos()
    }
    if(data.parent != null){
      console.log(data.parent)
      this.selectedParent = data.parent;
    }
  }

  ngOnInit(): void {
    //ini arr
    this.listCargo = [];
    this.idControl.disable()
    this.creadoEnControl.disable()
    this.usuarioControl.disable()
  }

  cargarDatos(){
    this.idControl.setValue(this.selectedTipoGasto.id)
    this.descripcionControl.setValue(this.selectedTipoGasto?.descripcion)
    this.activoControl.setValue(this.selectedTipoGasto?.activo)
    this.autorizacionControl.setValue(this.selectedTipoGasto?.autorizacion)
    this.cargoControl.setValue(this.selectedCargo?.nombre)
    this.creadoEnControl.setValue(this.selectedTipoGasto?.creadoEn)
    this.usuarioControl.setValue(this.selectedTipoGasto?.usuario?.persona?.nombre)
  }

  onSave() {
    this.cargandoService.openDialog()
    let input = new TipoGastoInput();
    if (this.selectedTipoGasto != null) {
      input.id = this.selectedTipoGasto.id;
      input.creadoEn = this.selectedTipoGasto.creadoEn;
      input.clasificacionGastoId = this.selectedTipoGasto?.clasificacionGasto?.id
      input.usuarioId = this.selectedTipoGasto.usuario.id;
    } else {
      input.clasificacionGastoId = this.data?.parent?.id; 
    }
    input.descripcion = this.descripcionControl.value;
    input.autorizacion = this.autorizacionControl.value;
    input.cargoId = this.selectedCargo?.id;
    input.activo = this.activoControl.value;
    this.tipoGastoService.onSave(input).pipe(untilDestroyed(this)).subscribe(res => {
      if(res!=null){
        this.cargandoService.closeDialog()
        this.matDialogRef.close(res)
      }
    })
  }

  onCancel(){
    this.matDialogRef.close()
  }

  onDelete(){
    this.tipoGastoService.onDelete(this.selectedTipoGasto.id).pipe(untilDestroyed(this)).subscribe(res => {
      if(res){
        this.matDialogRef.close('delete')
      }
    })
  }

}
