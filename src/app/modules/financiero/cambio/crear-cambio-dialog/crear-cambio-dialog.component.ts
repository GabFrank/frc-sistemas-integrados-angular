import { UntilDestroy } from '@ngneat/until-destroy';
import { untilDestroyed } from '@ngneat/until-destroy';
import { CambioInput } from './../cambio-input.model';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { CargandoDialogService } from './../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { CambioService } from './../cambio.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { Moneda } from '../../moneda/moneda.model';


export class CrearCambioData {
  moneda: Moneda
}


@UntilDestroy()
@Component({
  selector: 'app-crear-cambio-dialog',
  templateUrl: './crear-cambio-dialog.component.html',
  styleUrls: ['./crear-cambio-dialog.component.scss']
})
export class CrearCambioDialogComponent implements OnInit {
  selectedMoneda: Moneda
  cotizacionControl = new FormControl(null, [Validators.required, Validators.min(1)])

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CrearCambioData, 
    private cambioService: CambioService, 
    private cargandoService: CargandoDialogService,
    private matDialogRef: MatDialogRef<CrearCambioDialogComponent>
    ) { }

  ngOnInit(): void {
    this.selectedMoneda = this.data?.moneda;
  }

  onCancelar(){
    this.matDialogRef.close()
  }

  onGuardar(){
    let input = new CambioInput()
    input.monedaId = this.selectedMoneda.id;
    input.valorEnGs = this.cotizacionControl.value;
    this.cambioService.onSaveCambio(input)
    .pipe(untilDestroyed(this))
    .subscribe(res => {
      if(res!=null){
        this.matDialogRef.close({cambio: res})
      } 
    })
  }

}
