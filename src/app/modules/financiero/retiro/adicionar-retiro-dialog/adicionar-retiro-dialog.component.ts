import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Subscriber, Subscription } from 'rxjs';
import { CurrencyMask, stringToDecimal, stringToInteger } from '../../../../commons/core/utils/numbersUtils';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';
import { FuncionarioService } from '../../../personas/funcionarios/funcionario.service';
import { MonedaService } from '../../moneda/moneda.service';
import { PdvCaja } from '../../pdv/caja/caja.model';
import { RetiroDetalle } from '../retiro-detalle.model';
import { Retiro } from '../retiro.model';
import { RetiroService } from '../retiro.service';

export class AdicionarRetiroData {
  caja: PdvCaja;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-adicionar-retiro-dialog',
  templateUrl: './adicionar-retiro-dialog.component.html',
  styleUrls: ['./adicionar-retiro-dialog.component.scss']
})
export class AdicionarRetiroDialogComponent implements OnInit, OnDestroy {

  @ViewChild("responsableInput", { static: false }) responsableInput: ElementRef;


  selectedRetiro: Retiro;
  selectedCajaSalida: PdvCaja;
  selectedResponsable: Funcionario;
  observacionControl = new FormControl()
  responsableControl = new FormControl()
  guaraniControl = new FormControl(0)
  realControl = new FormControl(0)
  dolarControl = new FormControl(0)
  currencyMask = new CurrencyMask
  funcionarioList: Funcionario[];

  retiroDetalleList: RetiroDetalle[]
  funcionarioSub: Subscription;
  timer: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarRetiroData,
    public dialogRef: MatDialogRef<AdicionarRetiroDialogComponent>,
    public funcionarioService: FuncionarioService,
    private cargandoDialog: CargandoDialogService,
    private dialogService: DialogosService,
    private retiroService: RetiroService,
    private monedaService: MonedaService
  ) {
    if(data?.caja != null) this.selectedCajaSalida = data.caja;
  }

  ngOnInit(): void {
    this.retiroDetalleList = []
    this.funcionarioList = []

    this.responsableControl.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      if (this.timer != null) {
        clearTimeout(this.timer);
      }
      if (res != null && res.length != 0) {
        this.timer = setTimeout(() => {
          this.funcionarioService.onFuncionarioSearch(res).pipe(untilDestroyed(this)).subscribe((response) => {
            console.log(response)
            this.funcionarioList = response;
            if (this.funcionarioList.length == 1) {
              this.onResponsableSelect(this.funcionarioList[0]);
              this.onResponsableAutocompleteClose();
            } else {
              this.onResponsableAutocompleteClose();
              this.onResponsableSelect(null);
            }
          });
        }, 500);
      } else {
        this.funcionarioList = [];
      }
    })
  }

  onResponsableSelect(e) {
    console.log(e);
    if (e?.id != null) {
      this.selectedResponsable = e;
      this.responsableControl.setValue(
        this.selectedResponsable?.id +
          " - " +
          this.selectedResponsable?.persona?.nombre
      );
    }
  }


  onGuardar(){
    if(this.selectedResponsable!=null && this.verficarValores()){
      this.dialogService.confirm('Confirmar valores de retiro', null, null, [
        `Guaranies: ${stringToInteger(this.guaraniControl.value.toString())}`,
        `Reales: ${stringToDecimal(this.realControl.value.toString())}`,
        `Dolares: ${stringToDecimal(this.dolarControl.value.toString())}`,
      ]).pipe(untilDestroyed(this)).subscribe(res => {
        if(res){
          let retiro = new Retiro()
          retiro.cajaSalida = this.selectedCajaSalida;
          retiro.observacion = this.observacionControl.value;
          retiro.responsable = this.selectedResponsable;
          let guaraniDetalle = new RetiroDetalle()
          guaraniDetalle.moneda = this.monedaService.monedaList.find(m => m.denominacion == 'GUARANI');
          guaraniDetalle.cambio = guaraniDetalle?.moneda?.cambio
          guaraniDetalle.cantidad = +this.guaraniControl.value;
          let realDetalle = new RetiroDetalle()
          realDetalle.moneda = this.monedaService.monedaList.find(m => m.denominacion == 'REAL');
          realDetalle.cambio = realDetalle?.moneda?.cambio
          realDetalle.cantidad = +this.realControl.value;
          let dolarDetalle = new RetiroDetalle()
          dolarDetalle.moneda = this.monedaService.monedaList.find(m => m.denominacion == 'DOLAR');
          dolarDetalle.cambio = dolarDetalle?.moneda?.cambio
          dolarDetalle.cantidad = +this.dolarControl.value;
          let retiroDetalleList: RetiroDetalle[] = [
            guaraniDetalle, realDetalle, dolarDetalle
          ]
          retiro.retiroDetalleList = retiroDetalleList;
          console.log(retiro)
          this.retiroService.onSave(retiro).pipe(untilDestroyed(this)).subscribe(retiroResponse => {
            this.cargandoDialog.closeDialog()
            if(retiroResponse!=null){
              this.dialogRef.close(true)
            } else {

            }
          })
        }
      })
    }
  }

  verficarValores(): boolean{
    let verificado = false;
    if(this.guaraniControl.value > 0) verificado = true;
    if(this.realControl.value > 0) verificado = true;
    if(this.dolarControl.value > 0) verificado = true;
    return verificado;
  }

  onCancelar(){
    this.dialogRef.close(null);
  }

  onResponsableAutocompleteClose(){
    setTimeout(() => {
      this.responsableInput.nativeElement.select()
    }, 100);
  }

  ngOnDestroy(): void {
  }

}
