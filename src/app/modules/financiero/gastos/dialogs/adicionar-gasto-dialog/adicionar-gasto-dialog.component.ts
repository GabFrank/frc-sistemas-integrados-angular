import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatStepper } from "@angular/material/stepper";
import { MatTableDataSource } from "@angular/material/table";
import { MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { Subscription } from "rxjs";
import {
  orderByIdDesc,
  replaceObject,
} from "../../../../../commons/core/utils/arraysUtil";
import {
  CurrencyMask,
  stringToDecimal,
  stringToInteger,
} from "../../../../../commons/core/utils/numbersUtils";
import { CargandoDialogService } from "../../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { DialogosService } from "../../../../../shared/components/dialogos/dialogos.service";
import { Funcionario } from "../../../../personas/funcionarios/funcionario.model";
import { FuncionarioService } from "../../../../personas/funcionarios/funcionario.service";
import { MonedaService } from "../../../moneda/moneda.service";
import { PdvCaja } from "../../../pdv/caja/caja.model";
import { GastoService } from "../../service/gasto.service";
import { Gasto } from "../../models/gastos.model";

export class AdicionarGastoData {
  caja: PdvCaja;
}

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MainService } from "../../../../../main.service";
import { NotificacionSnackbarService } from "../../../../../notificacion-snackbar.service";
import { CajaService } from "../../../pdv/caja/caja.service";
import { NotificationHttpService } from "../../../../../shared/services/notification-http.service";
import { TipoGasto } from "../../models/tipo-gasto.model";
import { SearchListDialogComponent, SearchListtDialogData } from "../../../../../shared/components/search-list-dialog/search-list-dialog.component";
import { FilterTipoGastosGQL } from "../../graphql/filterTipoGastos";
import { SolicitudGastoSimpleDialogComponent, SolicitudGastoSimpleData, SolicitudGastoSimpleResult } from "../solicitud-gasto-simple-dialog/solicitud-gasto-simple-dialog.component";
import { TabService } from "../../../../../layouts/tab/tab.service";
import { Tab } from "../../../../../layouts/tab/tab.model";
import { ListPreGastosComponent } from "../../pages/list-pre-gastos/list-pre-gastos.component";
import { PreGastoInput } from "../../models/pre-gasto.model";
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
  @ViewChild("responsableInput", { read: MatAutocompleteTrigger, static: false })
  responsableAutocomplete: MatAutocompleteTrigger;

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
    private mainService: MainService,
    private notificacionService: NotificacionSnackbarService,
    private cajaService: CajaService,
    private notificationHttpService: NotificationHttpService,
    private matDialog: MatDialog,
    private filterTipoGastosGQL: FilterTipoGastosGQL,
    private tabService: TabService
  ) {
    if (data?.caja != null) {
      this.selectedCaja = data.caja;
      gastoService
        .onGetByCajaId(this.selectedCaja.id, false)
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res != null) {
            this.gastoList = orderByIdDesc<Gasto>(res);
            this.dataSource.data = this.gastoList;
          }
        });
      this.cajaService
        .onCajaBalancePorId(this.selectedCaja.id, false)
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

    this.guaraniControl.disable();
    this.realControl.disable();
    this.dolarControl.disable();

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
          this.autorizadoPorTimer = setTimeout(() => {
            this.funcionarioService
              .onFuncionarioSearch(res, false)
              .pipe(untilDestroyed(this))
              .subscribe((response) => {
                this.autorizadoPorList = response;
                if (this.autorizadoPorList.length == 1) {
                  this.onAutorizadoPorSelect(this.autorizadoPorList[0]);
                } else if (this.autorizadoPorList.length == 0) {
                  this.onAutorizadoPorSelect(null);
                  this.onAutorizadoPorAutocompleteClose();
                }
              });
          }, 500);
        } else {
          this.autorizadoPorList = [];
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
        this.selectedResponsable?.persona?.nombre,
        { emitEvent: false }
      );

      if (this.responsableTimer != null) {
        clearTimeout(this.responsableTimer);
      }
      this.responsableList = [];
      this.responsableAutocomplete?.closePanel();

      setTimeout(() => {
        this.responsableInput?.nativeElement?.blur();
        setTimeout(() => {
          this.responsableInput?.nativeElement?.select();
        }, 50);
      }, 0);
    }
  }

  onFuncionarioSearch() {
    if (this.responsableControl.valid) {
      if (isNaN(this.responsableControl.value) == false) {
        this.funcionarioService
          .onGetFuncionarioPorPersona(this.responsableControl.value, false)
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
      .onFuncionarioSearch(this.responsableControl.value, false)
      .pipe(untilDestroyed(this))
      .subscribe((response) => {
        this.responsableList = response;
        if (this.responsableList.length == 1) {
          this.onResponsableSelect(response[0]);
        } else if (this.responsableList.length == 0) {
          this.onResponsableSelect(null);
          this.onResponsableAutocompleteClose();
        }
      });
  }

  onSearchTipoGasto() {
    const data = new SearchListtDialogData();
    data.titulo = 'Seleccionar tipo de gasto';
    data.query = this.filterTipoGastosGQL;
    data.searchFieldName = 'texto';
    data.inicialSearch = true;
    data.paginator = true;
    data.tableData = [
      { id: 'id', nombre: 'ID', width: '70px' },
      { id: 'descripcion', nombre: 'Descripción', width: 'auto' },
      { id: 'autorizacion', nombre: 'Requiere autorización', width: '220px', pipe: 'booleanLock' },
    ];

    this.matDialog.open(SearchListDialogComponent, {
      data,
      width: '80%',
      height: '80%'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.onTipoGastoSelect(res);
      }
    });
  }

  onTipoGastoSelect(e) {
    if (e?.id != null) {
      this.selectedTipoGasto = e;
      this.tipoGastoControl.setValue(
        this.selectedTipoGasto?.id + " - " + this.selectedTipoGasto?.descripcion,
        { emitEvent: false }
      );

      if (this.selectedTipoGasto?.autorizacion == true) {
        this.autorizado = false;
        this.guaraniControl.disable();
        this.realControl.disable();
        this.dolarControl.disable();
        this.guaraniVueltoControl.disable();
        this.realVueltoControl.disable();
        this.dolarVueltoControl.disable();
        
        // Abrir pre-gasto
        this.matDialog.open(SolicitudGastoSimpleDialogComponent, {
          data: {
            tipoGastoId: this.selectedTipoGasto.id,
            tipoGastoDescripcion: this.selectedTipoGasto.descripcion,
            solicitanteId: this.selectedResponsable?.id,
            solicitanteNombre: this.selectedResponsable?.persona?.nombre
          } as SolicitudGastoSimpleData,
          width: '600px',
          height: 'auto',
          disableClose: true,
          panelClass: 'darkMode',
        }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
          if (res) {
            this.guardarSolicitudPreGastoSimple(res as SolicitudGastoSimpleResult);
          } else {
            this.selectedTipoGasto = null;
            this.tipoGastoControl.setValue(null);
          }
        });
      } else {
        this.autorizado = true;
        this.guaraniControl.enable();
        this.realControl.enable();
        this.dolarControl.enable();
        this.guaraniVueltoControl.enable();
        this.realVueltoControl.enable();
        this.dolarVueltoControl.enable();
      }
    }
  }

  /**
   * Persiste la solicitud como pre-gasto (pendiente de autorización) y abre la lista de solicitudes.
   */
  private guardarSolicitudPreGastoSimple(res: SolicitudGastoSimpleResult): void {
    const personaId = this.selectedResponsable?.persona?.id;
    if (!personaId) {
      this.notificacionService.openWarn("No se pudo determinar el solicitante.");
      this.selectedTipoGasto = null;
      this.tipoGastoControl.setValue(null);
      return;
    }
    const sucursalCajaId = res.sucursalRetiroId ?? this.mainService.sucursalActual?.id;
    if (!sucursalCajaId) {
      this.notificacionService.openWarn("No se pudo determinar la sucursal de retiro.");
      this.selectedTipoGasto = null;
      this.tipoGastoControl.setValue(null);
      return;
    }
    if (!res.proveedorId) {
      this.notificacionService.openWarn("Debe indicar un beneficiario (proveedor).");
      return;
    }

    const montos = res.montos?.filter(m => m.monedaId != null && m.monto != null) ?? [];
    if (montos.length === 0) {
      this.notificacionService.openWarn("Debe indicar al menos un monto.");
      return;
    }

    const input = new PreGastoInput();
    input.tipoGastoId = res.tipoGastoId;
    input.descripcion = res.descripcion;
    input.funcionarioId = personaId;
    input.sucursalCajaId = sucursalCajaId;
    input.beneficiarioProveedorId = res.proveedorId;
    input.beneficiarioPersonaId = null;
    input.nivelUrgencia = "NORMAL";
    input.observaciones = "";

    const v = new Date(res.vencimiento);
    const pad = (n: number) => n.toString().padStart(2, "0");
    input.fechaVencimiento = `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}T${pad(v.getHours())}:${pad(v.getMinutes())}:${pad(v.getSeconds())}`;

    input.finanzas = montos.map(m => ({
      formaPago: "EFECTIVO",
      monto: m.monto,
      monedaId: m.monedaId
    }));
    input.monedaId = montos[0].monedaId;
    input.montoSolicitado = montos[0].monto;

    this.cargandoDialog.openDialog();
    this.gastoService
      .preGastoGuardar(input)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (guardado) => {
          this.cargandoDialog.closeDialog();
          if (guardado != null) {
            this.notificacionService.openSucess("Solicitud de gasto registrada");
            this.tabService.addTab(new Tab(ListPreGastosComponent, "Solicitudes de Gasto", null, null));
            this.autorizado = true;
            this.guaraniControl.enable();
            this.realControl.enable();
            this.dolarControl.enable();
            this.guaraniVueltoControl.enable();
            this.realVueltoControl.enable();
            this.dolarVueltoControl.enable();
            this.selectedTipoGasto = null;
            this.tipoGastoControl.setValue(null);
          }
        },
        error: () => {
          this.cargandoDialog.closeDialog();
          this.notificacionService.openWarn("No se pudo registrar la solicitud de gasto.");
        }
      });
  }

  onResponsableAutocompleteClose() {
    setTimeout(() => {
      this.responsableInput.nativeElement.blur();
      if (!this.selectedResponsable) {
        setTimeout(() => {
          this.responsableInput.nativeElement.select();
        }, 50);
      }
    }, 100);
  }

  onAutorizadoPorSelect(e) {
    this.autorizado = true;
    if (e?.id != null) {
      this.selectedAutorizadoPor = e;
      this.autorizadoPorControl.setValue(
        this.selectedAutorizadoPor?.id +
        " - " +
        this.selectedAutorizadoPor?.persona?.nombre,
        { emitEvent: false }
      );

      setTimeout(() => {
        this.autorizadoPorInput?.nativeElement?.blur();
        setTimeout(() => {
          this.autorizadoPorInput?.nativeElement?.select();
        }, 50);
      }, 0);
    }
  }

  onAutorizadoPorAutocompleteClose() {
    setTimeout(() => {
      this.autorizadoPorInput?.nativeElement?.blur();
      setTimeout(() => {
        this.autorizadoPorInput?.nativeElement?.select();
      }, 50);
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
              gasto.sucursalId = this.mainService.sucursalActual?.id;
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
                .onSave(gasto, false)
                .pipe(untilDestroyed(this))
                .subscribe((gastoResponse) => {
                  this.cargandoDialog.closeDialog();
                  if (gastoResponse != null) {
                    gasto.id = gastoResponse.id;
                    if (gasto.responsable?.persona?.id) {
                      this.notificationHttpService.sendGastoNotification(
                        gasto.id,
                        this.mainService.sucursalActual.id,
                        gasto.responsable.persona.id,
                        gasto.retiroGs
                      ).subscribe();
                    }

                    this.gastoService.onSave(gasto, true).subscribe(res => {
                      this.cargandoDialog.closeDialog();
                    });
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
          )} ${this.guaraniVueltoControl.value != null
            ? " - Vuelto: " +
            stringToInteger(this.guaraniVueltoControl.value.toString())
            : ""
          }`,
          `Reales: ${stringToDecimal(this.realControl.value.toString())}  ${this.realVueltoControl.value != null
            ? " - Vuelto: " +
            stringToDecimal(this.realVueltoControl.value.toString())
            : ""
          }`,
          `Dolares: ${stringToDecimal(this.dolarControl.value.toString())}  ${this.dolarVueltoControl.value != null
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
              }, false)
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
        .onSave(newGasto, false)
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

  onGastoClick(gasto: Gasto) { }

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
    this.gastoService.onReimprimir(gasto.id, false).subscribe().unsubscribe();
  }
}
