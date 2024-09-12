import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatStepper } from "@angular/material/stepper";
import { MatTableDataSource } from "@angular/material/table";
import { Subscription } from "rxjs";
import {
  orderByIdDesc,
  replaceObject,
} from "../../../../commons/core/utils/arraysUtil";
import {
  CurrencyMask,
  stringToDecimal,
  stringToInteger,
} from "../../../../commons/core/utils/numbersUtils";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { Funcionario } from "../../../personas/funcionarios/funcionario.model";
import { FuncionarioService } from "../../../personas/funcionarios/funcionario.service";
import { MonedaService } from "../../moneda/moneda.service";
import { PdvCaja } from "../../pdv/caja/caja.model";
import { TipoGasto } from "../../tipo-gastos/list-tipo-gastos/tipo-gasto.model";
import { TipoGastoService } from "../../tipo-gastos/tipo-gasto.service";
import { GastoService } from "../gasto.service";
import { Gasto } from "../gastos.model";

export class AdicionarGastoData {
  caja: PdvCaja;
}

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MainService } from "../../../../main.service";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { FamiliasSearchGQL } from "../../../productos/familia/graphql/familiasSearch";
import { CajaService } from "../../pdv/caja/caja.service";

@UntilDestroy({ checkProperties: true })
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
  @ViewChild("guaraniVueltoGs", { static: false })
  guaraniVueltoGsInput: ElementRef;
  @ViewChild("stepper", { static: false }) stepper: MatStepper;

  isVuelto = false;

  displayedColumns = [
    "id",
    "responsable",
    "tipo",
    "valorGs",
    "valorRs",
    "valorDs",
    "vuelto",
    "creadoEn",
    "acciones",
  ];

  dataSource = new MatTableDataSource<Gasto>(null);

  selectedCaja: PdvCaja;
  selectedResponsable: Funcionario;
  selectedTipoGasto: TipoGasto;
  selectedAutorizadoPor: Funcionario;
  selectedGasto: Gasto;

  responsableControl = new FormControl();
  tipoGastoControl = new FormControl();
  autorizadoPorControl = new FormControl();
  observacionControl = new FormControl();
  guaraniControl = new FormControl(0);
  realControl = new FormControl(0);
  dolarControl = new FormControl(0);
  guaraniVueltoControl = new FormControl(0);
  realVueltoControl = new FormControl(0);
  dolarVueltoControl = new FormControl(0);

  responsableList: Funcionario[];
  autorizadoPorList: Funcionario[];
  tipoGastoList: TipoGasto[];

  responsableSub: Subscription;
  responsableTimer;
  tipoGastoSub: Subscription;
  tipoGastoTimer;
  autorizadoPorTimer;
  autorizadoPorSub: Subscription;

  currencyMask = new CurrencyMask();

  autorizado = true;

  gastoList: Gasto[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarGastoData,
    private matDialogRef: MatDialogRef<AdicionarGastoDialogComponent>,
    public funcionarioService: FuncionarioService,
    private cargandoDialog: CargandoDialogService,
    private dialogService: DialogosService,
    private gastoService: GastoService,
    private monedaService: MonedaService,
    private tipoGastoService: TipoGastoService,
    private mainService: MainService,
    private notificacionService: NotificacionSnackbarService,
    private cajaService: CajaService
  ) {
    if (data?.caja != null) {
      this.selectedCaja = data.caja;
      gastoService
        .onGetByCajaId(this.selectedCaja.id)
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res != null) {
            this.gastoList = orderByIdDesc<Gasto>(res);
            this.dataSource.data = this.gastoList;
          }
        });
      this.cajaService
        .onCajaBalancePorId(this.selectedCaja.id)
        .subscribe((res) => {
          if (res != null) {
            this.selectedCaja.balance = res;
          }
        });
    }
  }

  ngOnInit(): void {
    this.responsableList = [];
    this.autorizadoPorList = [];
    this.tipoGastoList = [];

    this.responsableSub = this.responsableControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res == "") this.selectedResponsable = null;
        if (this.responsableTimer != null) {
          clearTimeout(this.responsableTimer);
        }
        if (res != null && res.length != 0) {
          this.responsableTimer = setTimeout(() => {
            this.onFuncionarioSearch();
          }, 1000);
        } else {
          this.responsableList = [];
        }
      });

    this.autorizadoPorSub = this.autorizadoPorControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res == "") this.selectedAutorizadoPor = null;
        if (this.autorizadoPorTimer != null) {
          clearTimeout(this.autorizadoPorTimer);
        }
        if (res != null && res.length != 0) {
          this.autorizadoPorTimer = setTimeout(() => {}, 500);
        } else {
          this.autorizadoPorList = [];
        }
      });

    this.tipoGastoSub = this.tipoGastoControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res == "") this.selectedTipoGasto = null;
        if (this.tipoGastoTimer != null) {
          clearTimeout(this.tipoGastoTimer);
        }
        if (res != null && res.length != 0) {
          this.tipoGastoTimer = setTimeout(() => {
            this.tipoGastoService
              .onSearch(res)
              .pipe(untilDestroyed(this))
              .subscribe((response) => {
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

    this.guaraniVueltoControl.disable();
    this.realVueltoControl.disable();
    this.dolarVueltoControl.disable();
    setTimeout(() => {
      this.responsableInput.nativeElement.focus();
    }, 500);
  }

  onResponsableSelect(e) {
    if (e?.id != null) {
      this.selectedResponsable = e;
      this.responsableControl.setValue(
        this.selectedResponsable?.id +
          " - " +
          this.selectedResponsable?.persona?.nombre
      );
      this.responsableInput?.nativeElement?.select();
    }
  }

  onFuncionarioSearch() {
    if (this.responsableControl.valid) {
      if (isNaN(this.responsableControl.value) == false) {
        this.funcionarioService
          .onGetFuncionarioPorPersona(this.responsableControl.value)
          .subscribe((res) => {
            if (res != null) {
              this.onResponsableSelect(res);
            } else {
              this.onSearchFuncionarioPorNombre();
            }
          });
      } else {
        this.onSearchFuncionarioPorNombre();
      }
    }
  }

  onSearchFuncionarioPorNombre() {
    this.funcionarioService
      .onFuncionarioSearch(this.responsableControl.value)
      .pipe(untilDestroyed(this))
      .subscribe((response) => {
        this.responsableList = response;
        if (this.responsableList.length == 1) {
          this.onResponsableSelect(this.responsableList[0]);
          this.onResponsableAutocompleteClose();
        } else {
          this.onResponsableAutocompleteClose();
          this.onResponsableSelect(null);
        }
      });
  }

  onTipoGastoAutocompleteClose() {
    setTimeout(() => {
      this.tipoGastoInput.nativeElement.select();
    }, 100);
  }

  onTipoGastoSelect(e) {
    if (e?.id != null) {
      this.selectedTipoGasto = e;
      if (this.selectedTipoGasto?.autorizacion == true) {
        this.autorizado = false;
      } else {
        this.autorizado = true;
      }
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
      this.autorizadoPorInput?.nativeElement?.select();
    }, 100);
  }

  onGuardar() {
    if (this.isVuelto == false) {
      if (this.selectedResponsable != null && this.verficarValores()) {
        this.dialogService
          .confirm("Confirmar valores de gasto", null, null, [
            `Guaranies: ${stringToInteger(
              this.guaraniControl.value.toString()
            )}`,
            `Reales: ${stringToDecimal(this.realControl.value.toString())}`,
            `Dolares: ${stringToDecimal(this.dolarControl.value.toString())}`,
          ])
          .pipe(untilDestroyed(this))
          .subscribe((res) => {
            if (res) {
              let gasto = new Gasto();
              if (this.selectedGasto != null) {
                Object.assign(gasto, this.selectedGasto);
              }
              gasto.caja = this.selectedCaja;
              gasto.responsable = this.selectedResponsable;
              gasto.tipoGasto = this.selectedTipoGasto;
              gasto.autorizadoPor = this.selectedAutorizadoPor;
              gasto.observacion = this.observacionControl.value;
              gasto.retiroGs = this.guaraniControl.value;
              gasto.retiroRs = this.realControl.value;
              gasto.retiroDs = this.dolarControl.value;
              gasto.vueltoGs = this.guaraniVueltoControl.value;
              gasto.vueltoRs = this.realVueltoControl.value;
              gasto.vueltoDs = this.dolarVueltoControl.value;
              gasto.activo = true;
              if (this.isVuelto) {
                gasto.finalizado = true;
              } else {
                gasto.finalizado = false;
              }
              this.gastoService
                .onSave(gasto)
                .pipe(untilDestroyed(this))
                .subscribe((gastoResponse) => {
                  this.cargandoDialog.closeDialog();
                  if (gastoResponse != null) {
                    this.gastoList.push(gastoResponse as Gasto);
                    this.dataSource.data = orderByIdDesc<Gasto>(this.gastoList);
                    this.goTo("lista-gastos");
                  }
                  this.onCancelar();
                });
            }
          });
      }
    } else {
      this.onSaveVuelto();
    }
  }

  onSaveVuelto() {
    if (
      this.guaraniVueltoControl.value > this.guaraniControl.value ||
      this.realVueltoControl.value > this.realControl.value ||
      this.dolarVueltoControl.value > this.dolarControl.value
    ) {
      this.notificacionService.openWarn("Vuelto mayor a retiro");
      return;
    }
    if (
      this.selectedGasto?.sucursalVuelto == null ||
      (this.selectedGasto?.sucursalVuelto != null &&
        this.selectedGasto?.sucursalVuelto?.id ==
          this.mainService?.sucursalActual?.id)
    ) {
      this.dialogService
        .confirm("Confirmar valores de gasto", null, null, [
          `Guaranies: ${stringToInteger(
            this.guaraniControl.value.toString()
          )} ${
            this.guaraniVueltoControl.value != null
              ? " - Vuelto: " +
                stringToInteger(this.guaraniVueltoControl.value.toString())
              : ""
          }`,
          `Reales: ${stringToDecimal(this.realControl.value.toString())}  ${
            this.realVueltoControl.value != null
              ? " - Vuelto: " +
                stringToDecimal(this.realVueltoControl.value.toString())
              : ""
          }`,
          `Dolares: ${stringToDecimal(this.dolarControl.value.toString())}  ${
            this.dolarVueltoControl.value != null
              ? " - Vuelto: " +
                stringToDecimal(this.dolarVueltoControl.value.toString())
              : ""
          }`,
        ])
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res) {
            this.gastoService
              .onSaveVuelto({
                id: this.selectedGasto.id,
                valorGs: this.guaraniVueltoControl.value,
                valorRs: this.realVueltoControl.value,
                valorDs: this.dolarVueltoControl.value,
              })
              .pipe(untilDestroyed(this))
              .subscribe((res) => {
                if (res != null) {
                  this.ngOnInit();
                }
              });
          }
        });
    } else {
      this.notificacionService.openWarn("No se puede guardar este gasto");
    }
  }

  onCancelar() {
    this.selectedGasto = null;
    this.selectedTipoGasto = null;
    this.selectedAutorizadoPor = null;
    this.responsableControl.setValue(null);
    this.tipoGastoControl.setValue(null);
    this.autorizadoPorControl.setValue(null);
    this.observacionControl.setValue(null);
    this.guaraniControl.setValue(0);
    this.realControl.setValue(0);
    this.dolarControl.setValue(0);
    this.guaraniVueltoControl.setValue(0);
    this.realVueltoControl.setValue(0);
    this.dolarVueltoControl.setValue(0);
    this.guaraniVueltoControl.disable();
    this.realVueltoControl.disable();
    this.dolarVueltoControl.disable();
    this.responsableControl.enable();
    this.autorizadoPorControl.enable();
    this.tipoGastoControl.enable();
    this.observacionControl.enable();
    this.guaraniControl.enable();
    this.realControl.enable();
    this.dolarControl.enable();
    setTimeout(() => {
      this.responsableInput.nativeElement.focus();
    }, 0);
  }

  onFinalizar(gasto: Gasto) {
    this.cargandoDialog.openDialog();
    let newGasto = new Gasto();
    Object.assign(newGasto, gasto);
    if (newGasto != null && newGasto.finalizado != true) {
      newGasto.finalizado = true;
      this.gastoService
        .onSave(newGasto)
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoDialog.closeDialog();
          if (res != null) {
            this.gastoList = replaceObject<Gasto>(this.gastoList, res);
            this.dataSource.data = this.gastoList;
            this.onCancelar();
            this.goTo("lista-gastos");
          }
        });
    }
  }

  onVer(gasto: Gasto) {
    this.cargarDatos(gasto);
    this.goTo("informacion");
  }

  onVuelto(gasto: Gasto) {
    this.cargarDatos(gasto);
    this.goTo("informacion");
    this.guaraniVueltoControl.enable();
    this.realVueltoControl.enable();
    this.dolarVueltoControl.enable();
    this.isVuelto = true;
  }

  onGastoClick(gasto: Gasto) {}

  verficarValores(): boolean {
    if (
      this.guaraniControl.value >
      this.selectedCaja.balance.diferenciaGs * -1
    ) {
      this.notificacionService.openWarn(
        "El monto en guaraníes es mayor a lo que tiene en caja"
      );
      return false;
    }
    if (this.realControl.value > this.selectedCaja.balance.diferenciaRs * -1) {
      this.notificacionService.openWarn(
        "El monto en reales es mayor a lo que tiene en caja"
      );
      return false;
    }
    if (this.dolarControl.value > this.selectedCaja.balance.diferenciaDs * -1) {
      this.notificacionService.openWarn(
        "El monto en dolares es mayor a lo que tiene en caja"
      );
      return false;
    }
    return true;
  }

  goTo(text) {
    switch (text) {
      case "informacion":
        this.stepper.selectedIndex = 0;
        break;
      case "lista-gastos":
        this.stepper.selectedIndex = 1;
        break;
      case "salir":
        this.matDialogRef.close();
        break;
      default:
        break;
    }
  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.responsableSub.unsubscribe();
    this.autorizadoPorSub.unsubscribe();
    this.tipoGastoSub.unsubscribe();
  }

  cargarDatos(gasto: Gasto) {
    this.selectedGasto = gasto;
    this.onResponsableSelect(gasto?.responsable);
    this.onTipoGastoSelect(gasto?.tipoGasto);
    if (this.selectedTipoGasto.autorizacion == true) {
      this.onAutorizadoPorSelect(gasto?.responsable);
    }
    this.observacionControl.setValue(gasto?.observacion);
    this.guaraniControl.setValue(gasto?.retiroGs);
    this.realControl.setValue(gasto?.retiroRs);
    this.dolarControl.setValue(gasto?.retiroDs);
    this.guaraniVueltoControl.setValue(gasto?.vueltoGs);
    this.realVueltoControl.setValue(gasto?.vueltoRs);
    this.dolarVueltoControl.setValue(gasto?.vueltoDs);
    this.responsableControl.disable();
    this.tipoGastoControl.disable();
    this.autorizadoPorControl.disable();
    this.observacionControl.disable();
    this.guaraniControl.disable();
    this.realControl.disable();
    this.dolarControl.disable();
    if (this.isVuelto) {
      setTimeout(() => {
        this.guaraniVueltoGsInput.nativeElement.focus();
      }, 500);
    } else {
      this.guaraniVueltoControl.disable();
      this.realVueltoControl.disable();
      this.dolarVueltoControl.disable();
      this.responsableControl.disable();
      this.autorizadoPorControl.disable();
      this.tipoGastoControl.disable();
    }
  }

  onReimprimir(gasto: Gasto) {
    this.gastoService.onReimprimir(gasto.id).subscribe().unsubscribe();
  }
}
