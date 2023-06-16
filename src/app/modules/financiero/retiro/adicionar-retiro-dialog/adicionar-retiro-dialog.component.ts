import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
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

import { MatStepper } from '@angular/material/stepper';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { CajaService } from '../../pdv/caja/caja.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-adicionar-retiro-dialog',
  templateUrl: './adicionar-retiro-dialog.component.html',
  styleUrls: ['./adicionar-retiro-dialog.component.scss']
})
export class AdicionarRetiroDialogComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild("responsableInput", { static: false }) responsableInput: ElementRef;
  @ViewChild("stepper", { static: false }) stepper: MatStepper;


  selectedRetiro: Retiro;
  selectedCajaSalida: PdvCaja;
  selectedResponsable: Funcionario;
  observacionControl = new FormControl()
  responsableControl = new FormControl()
  guaraniControl = new FormControl(0, Validators.min(100))
  realControl = new FormControl(0, Validators.min(0.05))
  dolarControl = new FormControl(0, Validators.min(1))
  currencyMask = new CurrencyMask
  funcionarioList: Funcionario[];


  retiroDetalleList: RetiroDetalle[]
  funcionarioSub: Subscription;
  timer: any;

  dataSource = new MatTableDataSource<Retiro>([]);
  displayedColumns = [
    'id',
    'responsable',
    'usuario',
    'retiroGs',
    'retiroRs',
    'retiroDs',
    'creadoEn',
    'acciones'
  ]

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarRetiroData,
    public dialogRef: MatDialogRef<AdicionarRetiroDialogComponent>,
    public funcionarioService: FuncionarioService,
    private cargandoDialog: CargandoDialogService,
    private dialogService: DialogosService,
    private retiroService: RetiroService,
    private monedaService: MonedaService,
    private cargandoService: CargandoDialogService,
    private notificacionService: NotificacionSnackbarService,
    private cajaService: CajaService
  ) {
    if (data?.caja != null) {
      this.selectedCajaSalida = data.caja;
      retiroService.onGePorCajaSalidaId(this.selectedCajaSalida.id).pipe(untilDestroyed(this)).subscribe((res) => {
        if (res != null) {
          this.dataSource.data = res;
        }
      });
      this.cajaService.onCajaBalancePorId(this.selectedCajaSalida.id).subscribe(res => {
        if (res != null) {
          this.selectedCajaSalida.balance = res;
        }
      })
    }
  }
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.responsableInput.nativeElement.select()
    }, 1000);
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
    if (e?.id != null) {
      this.selectedResponsable = e;
      this.responsableControl.setValue(
        this.selectedResponsable?.id +
        " - " +
        this.selectedResponsable?.persona?.nombre
      );
    }
  }


  onGuardar() {
    if (this.selectedResponsable != null && this.verficarValores() && (this.guaraniControl.valid || this.realControl.valid || this.dolarControl.valid)) {
      this.dialogService.confirm('Confirmar valores de retiro', null, null, [
        `Guaranies: ${stringToInteger(this.guaraniControl.value.toString())}`,
        `Reales: ${stringToDecimal(this.realControl.value.toString())}`,
        `Dolares: ${stringToDecimal(this.dolarControl.value.toString())}`,
      ]).pipe(untilDestroyed(this)).subscribe(res => {
        if (res) {
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
          this.retiroService.onSave(retiro).pipe(untilDestroyed(this)).subscribe(retiroResponse => {
            this.cargandoDialog.closeDialog()
            if (retiroResponse != null) {
              this.dialogRef.close(true)
            } else {

            }
          })
        }
      })
    }
  }

  verficarValores(): boolean {
    if (this.guaraniControl.value > (this.selectedCajaSalida.balance.diferenciaGs * -1)) {
      this.notificacionService.openWarn("El monto en guaraníes es mayor a lo que tiene en caja")
      return false;
    }
    if (this.realControl.value > (this.selectedCajaSalida.balance.diferenciaRs * -1)) {
      this.notificacionService.openWarn("El monto en reales es mayor a lo que tiene en caja")
      return false;
    }
    if (this.dolarControl.value > (this.selectedCajaSalida.balance.diferenciaDs * -1)) {
      this.notificacionService.openWarn("El monto en dolares es mayor a lo que tiene en caja")
      return false;
    }
    return true;
  }

  onCancelar() {
    this.dialogRef.close(null);
  }

  onResponsableAutocompleteClose() {
    setTimeout(() => {
      this.responsableInput.nativeElement.select()
    }, 100);
  }

  goTo(text) {
    switch (text) {
      case "informacion":
        this.stepper.selectedIndex = 0;
        break;
      case "lista-retiros":
        this.stepper.selectedIndex = 1;
        break;
      case "salir":
        this.dialogRef.close();
        break;
      default:
        break;
    }
  }

  onVer(retiro: Retiro) {
    this.selectedRetiro = retiro;
    this.onResponsableSelect(retiro.responsable)
    this.observacionControl.setValue(retiro.observacion)
    this.guaraniControl.setValue(retiro.retiroGs)
    this.dolarControl.setValue(retiro.retiroRs)
    this.realControl.setValue(retiro.retiroDs)
    this.responsableControl.disable()
    this.observacionControl.disable()
    this.guaraniControl.disable()
    this.realControl.disable()
    this.dolarControl.disable()
  }

  onReimprimir(retiro: Retiro) {
    this.retiroService.onReimprimirRetiro(retiro.id).subscribe(res => {
      if (res == true) {
        this.notificacionService.openSucess('Reimpresión con éxito')
      } else {
        this.notificacionService.openAlgoSalioMal('Ups! intente de nuevo')
      }
    })
  }

  ngOnDestroy(): void {
  }

}
