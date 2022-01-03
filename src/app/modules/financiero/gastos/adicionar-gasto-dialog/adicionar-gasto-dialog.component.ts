import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Subscription } from "rxjs";
import { CurrencyMask, stringToDecimal, stringToInteger } from "../../../../commons/core/utils/numbersUtils";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { Funcionario } from "../../../personas/funcionarios/funcionario.model";
import { FuncionarioService } from "../../../personas/funcionarios/funcionario.service";
import { MonedaService } from "../../moneda/moneda.service";
import { PdvCaja } from "../../pdv/caja/caja.model";
import { TipoGasto } from "../../tipo-gastos/list-tipo-gastos/tipo-gasto.model";
import { TipoGastoService } from "../../tipo-gastos/tipo-gasto.service";
import { GastoDetalle } from "../gasto-detalle/gasto-detalle.model";
import { GastoService } from "../gasto.service";
import { Gasto } from "../gastos.model";

export class AdicionarGastoData {
  caja: PdvCaja;
}
@Component({
  selector: "app-adicionar-gasto-dialog",
  templateUrl: "./adicionar-gasto-dialog.component.html",
  styleUrls: ["./adicionar-gasto-dialog.component.scss"],
})
export class AdicionarGastoDialogComponent implements OnInit, OnDestroy {
  @ViewChild("responsableInput", { static: false })
  responsableInput: ElementRef;
  @ViewChild("tipoGastoInput", { static: false }) tipoGastoInput: ElementRef;
  @ViewChild("autorizadoPorInput", { static: false })
  autorizadoPorInput: ElementRef;

  selectedCaja: PdvCaja;
  selectedResponsable: Funcionario;
  selectedTipoGasto: TipoGasto;
  selectedAutorizadoPor: Funcionario;

  responsableControl = new FormControl();
  tipoGastoControl = new FormControl();
  autorizadoPorControl = new FormControl();
  observacionControl = new FormControl();
  guaraniControl = new FormControl(0);
  realControl = new FormControl(0);
  dolarControl = new FormControl(0);

  responsableList: Funcionario[];
  autorizadoPorList: Funcionario[];
  tipoGastoList: TipoGasto[];

  responsableSub: Subscription;
  responsableTimer;
  tipoGastoSub: Subscription;
  tipoGastoTimer;
  autorizadoPorTimer;
  autorizadoPorSub: Subscription;

  currencyMask = new CurrencyMask;

  autorizado = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarGastoData,
    private matDialogRef: MatDialogRef<AdicionarGastoDialogComponent>,
    public funcionarioService: FuncionarioService,
    private cargandoDialog: CargandoDialogService,
    private dialogService: DialogosService,
    private gastoService: GastoService,
    private monedaService: MonedaService,
    private tipoGastoService: TipoGastoService
  ) {
    if (data?.caja != null) this.selectedCaja = data.caja;
  }

  ngOnInit(): void {
    this.responsableList = [];
    this.autorizadoPorList = [];
    this.tipoGastoList = [];

    this.responsableSub = this.responsableControl.valueChanges.subscribe(
      (res) => {
        if(res=='') this.selectedResponsable = null;
        if (this.responsableTimer != null) {
          clearTimeout(this.responsableTimer);
        }
        if (res != null && res.length != 0) {
          this.responsableTimer = setTimeout(() => {
            this.funcionarioService
              .onFuncionarioSearch(res)
              .subscribe((response) => {
                console.log(response);
                this.responsableList = response;
                if (this.responsableList.length == 1) {
                  this.onResponsableSelect(this.responsableList[0]);
                  this.onResponsableAutocompleteClose();
                } else {
                  this.onResponsableAutocompleteClose();
                  this.onResponsableSelect(null);
                }
              });
          }, 500);
        } else {
          this.responsableList = [];
        }
      }
    );

    this.autorizadoPorSub = this.autorizadoPorControl.valueChanges.subscribe(
      (res) => {
        if(res=='') this.selectedAutorizadoPor = null;
        if (this.autorizadoPorTimer != null) {
          clearTimeout(this.autorizadoPorTimer);
        }
        if (res != null && res.length != 0) {
          this.autorizadoPorTimer = setTimeout(() => {
            this.funcionarioService
              .onFuncionarioSearch(res)
              .subscribe((response) => {
                console.log(response);
                this.autorizadoPorList = response;
                if (this.autorizadoPorList.length == 1) {
                  this.onAutorizadoPorSelect(this.autorizadoPorList[0]);
                  this.onAutorizadoPorAutocompleteClose();
                } else {
                  this.onAutorizadoPorAutocompleteClose();
                  this.onAutorizadoPorSelect(null);
                }
              });
          }, 500);
        } else {
          this.autorizadoPorList = [];
        }
      }
    );

    this.tipoGastoSub = this.tipoGastoControl.valueChanges.subscribe((res) => {
      if(res=='') this.selectedTipoGasto = null;
      if (this.tipoGastoTimer != null) {
        clearTimeout(this.tipoGastoTimer);
      }
      if (res != null && res.length != 0) {
        this.tipoGastoTimer = setTimeout(() => {
          this.tipoGastoService.onSearch(res).subscribe((response) => {
            console.log(response);
            this.tipoGastoList = response;
            if (this.tipoGastoList.length == 1) {
              this.onTipoGastoSelect(this.tipoGastoList[0]);
              this.onTipoGastoAutocompleteClose();
            } else {
              this.onTipoGastoAutocompleteClose();
              this.onTipoGastoSelect(null);
            }
          });
        }, 500);
      } else {
        this.tipoGastoList = [];
      }
    });
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

  onTipoGastoAutocompleteClose() {
    setTimeout(() => {
      this.tipoGastoInput.nativeElement.select();
    }, 100);
  }

  onTipoGastoSelect(e) {
    console.log(e);
    if (e?.id != null) {
      this.selectedTipoGasto = e;
      if(this.selectedTipoGasto?.autorizacion==true){
        this.autorizado = false;
      } else {
        this.autorizado = true;
      };
      this.tipoGastoControl.setValue(
        this.selectedTipoGasto?.id + " - " + this.selectedTipoGasto?.descripcion
      );
    }
  }

  onResponsableAutocompleteClose() {
    setTimeout(() => {
      this.responsableInput.nativeElement.select();
    }, 100);
  }

  onAutorizadoPorSelect(e) {
    console.log(e);
    this.autorizado = true;
    if (e?.id != null) {
      this.selectedAutorizadoPor = e;
      this.autorizadoPorControl.setValue(
        this.selectedAutorizadoPor?.id +
          " - " +
          this.selectedAutorizadoPor?.persona?.nombre
      );
    }
  }

  onAutorizadoPorAutocompleteClose() {
    setTimeout(() => {
      this.autorizadoPorInput.nativeElement.select();
    }, 100);
  }

  onGuardar() {
    this.cargandoDialog.openDialog()
    if(this.selectedResponsable!=null && this.verficarValores()){
      this.dialogService.confirm('Confirmar valores de retiro', null, null, [
        `Guaranies: ${stringToInteger(this.guaraniControl.value.toString())}`,
        `Reales: ${stringToDecimal(this.realControl.value.toString())}`,
        `Dolares: ${stringToDecimal(this.dolarControl.value.toString())}`,
      ]).subscribe(res => {
        if(res){
          let gasto = new Gasto()
          gasto.caja = this.selectedCaja;
          gasto.responsable = this.selectedResponsable;
          gasto.tipoGasto = this.selectedTipoGasto;
          gasto.autorizadoPor = this.selectedAutorizadoPor;
          gasto.observacion = this.observacionControl.value;
          let guaraniDetalle = new GastoDetalle()
          guaraniDetalle.moneda = this.monedaService.monedaList.find(m => m.denominacion == 'GUARANI');
          guaraniDetalle.cambio = guaraniDetalle?.moneda?.cambio
          guaraniDetalle.cantidad = +this.guaraniControl.value;
          let realDetalle = new GastoDetalle()
          realDetalle.moneda = this.monedaService.monedaList.find(m => m.denominacion == 'REAL');
          realDetalle.cambio = realDetalle?.moneda?.cambio
          realDetalle.cantidad = +this.realControl.value;
          let dolarDetalle = new GastoDetalle()
          dolarDetalle.moneda = this.monedaService.monedaList.find(m => m.denominacion == 'DOLAR');
          dolarDetalle.cambio = dolarDetalle?.moneda?.cambio
          dolarDetalle.cantidad = +this.dolarControl.value;
          let detalleList: GastoDetalle[] = [
            guaraniDetalle, realDetalle, dolarDetalle
          ]
          gasto.gastoDetalleList = detalleList;
          gasto.valorGs = guaraniDetalle.cantidad;
          gasto.valorRs = realDetalle.cantidad;
          gasto.valorDs = dolarDetalle.cantidad;
          console.log(gasto)
          this.gastoService.onSave(gasto).subscribe(retiroResponse => {
            this.cargandoDialog.closeDialog()
            if(retiroResponse!=null){
              this.matDialogRef.close(true)
            } else {

            }
          })
        }
      })
    }
  }

  onCancelar() {
    this.matDialogRef.close(null)
  }

  verficarValores(): boolean {
    let verificado = false;
    if (this.guaraniControl.value > 0) verificado = true;
    if (this.realControl.value > 0) verificado = true;
    if (this.dolarControl.value > 0) verificado = true;
    return verificado;
  }

  goTo(text){

  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.responsableSub.unsubscribe();
    this.autorizadoPorSub.unsubscribe();
    this.tipoGastoSub.unsubscribe();
  }
}
