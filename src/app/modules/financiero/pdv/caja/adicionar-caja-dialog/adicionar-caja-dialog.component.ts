import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialog,
} from "@angular/material/dialog";
import { MatStepper } from "@angular/material/stepper";
import { BehaviorSubject, Observable, Subject, Subscription } from "rxjs";
import {
  stringToDecimal,
  stringToInteger,
} from "../../../../../commons/core/utils/numbersUtils";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../../../notificacion-snackbar.service";
import { CargandoDialogService } from "../../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { DialogosService } from "../../../../../shared/components/dialogos/dialogos.service";
import { AdicionarConteoResponse } from "../../../conteo/adicionar-conteo-dialog/adicionar-conteo-dialog.component";
import { ConteoMoneda } from "../../../conteo/conteo-moneda/conteo-moneda.model";
import { Conteo } from "../../../conteo/conteo.model";
import { ConteoService } from "../../../conteo/conteo.service";
import {
  AdicionarMaletinData,
  AdicionarMaletinDialogComponent,
} from "../../../maletin/adicionar-maletin-dialog/adicionar-maletin-dialog.component";
import { Maletin } from "../../../maletin/maletin.model";
import { MaletinService } from "../../../maletin/maletin.service";
import { MonedaBillete } from "../../../moneda/moneda-billetes/moneda-billetes.model";
import { Moneda } from "../../../moneda/moneda.model";
import { MonedaService } from "../../../moneda/moneda.service";
import { SinMaletinDialogComponent } from "../../sin-maletin-dialog/sin-maletin-dialog.component";
import { PdvCaja, PdvCajaEstado, PdvCajaInput } from "../caja.model";
import { CajaService } from "../caja.service";
import { cajasPorFecha } from "../graphql/graphql-query";

export class AdicionarCajaData {
  caja?: PdvCaja;
}

@Component({
  selector: "app-adicionar-caja-dialog",
  templateUrl: "./adicionar-caja-dialog.component.html",
  styleUrls: ["./adicionar-caja-dialog.component.scss"],
})
export class AdicionarCajaDialogComponent implements OnInit, AfterViewChecked {
  @ViewChild("stepper", { static: false }) stepper: MatStepper;
  @ViewChild("codigoMaletinInput", { static: false })
  codigoMaletinInput: ElementRef;

  @ViewChild("siguienteBtn", { static: false })
  siguienteBtn: MatButton;

  conetoMonedaList: ConteoMoneda[];

  siguienteSubject: Subject<number> = new Subject<number>();
  siguienteCierreSubject: Subject<number> = new Subject<number>();
  conteoAperturaSubject: Subject<Conteo> = new Subject<Conteo>();
  conteoCierreSubject: Subject<Conteo> = new Subject<Conteo>();
  focusToAPerturaSub: Subject<any> = new Subject<any>();
  focusToCierreSub: Subject<any> = new Subject<any>();

  formGroup: FormGroup;
  isVerificado = false;

  descripcionMaletinControl = new FormControl(null, Validators.required);

  idControl = new FormControl();
  observacionControl = new FormControl(null);
  activoControl = new FormControl(true);
  estadoControl = new FormControl(true);
  fechaAperturaControl = new FormControl(true);
  fechaCierreControl = new FormControl(true);
  creadoEnControl = new FormControl();
  conteoAperturaControl = new FormControl();
  conteoCierreControl = new FormControl();
  usuarioControl = new FormControl();
  maletinControl = new FormControl(null, Validators.required);
  selectedCaja: PdvCaja;
  selectedMaletin: Maletin;
  selectedConteoApertura: Conteo;
  selectedConteoCierre: Conteo;

  totalGsAper = 0;
  totalRsaper = 0;
  totalDsAper = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarCajaData,
    private matDialogRef: MatDialogRef<AdicionarCajaDialogComponent>,
    private cajaService: CajaService,
    private maletinService: MaletinService,
    private notificacionBar: NotificacionSnackbarService,
    private cargandoDialog: CargandoDialogService,
    private matDialog: MatDialog,
    private monedaService: MonedaService,
    private dialogBox: DialogosService,
    private conteoService: ConteoService
  ) {
    // this.cargarMonedas();
  }

  ngAfterViewChecked(): void {}

  ngOnInit(): void {
    this.idControl.disable();
    this.creadoEnControl.disable();
    this.usuarioControl.disable();
    if (this.data.caja != null) {
      this.cajaService.onGetById(this.data.caja.id).subscribe((res) => {
        console.log(res);
        if (res != null) {
          this.selectedCaja = res;
          this.cargarDatos();
        }
      });
    }

    setTimeout(() => {
      this.codigoMaletinInput.nativeElement.focus();
    }, 500);
  }

  // cargarMonedas() {
  //   this.monedaService.onGetAll().subscribe((res) => {
  //     if (res != null) {
  //       let monedaList: Moneda[] = res;
  //       monedaList.forEach((m) => {
  //         switch (m.denominacion) {
  //           case "GUARANI":
  //             this.guaraniList = m.monedaBilleteList;
  //             break;
  //           case "REAL":
  //             this.realList = m.monedaBilleteList;
  //             break;
  //           case "DOLAR":
  //             this.dolarList = m.monedaBilleteList;
  //             break;
  //           default:
  //             break;
  //         }
  //       });
  //       console.log(res)
  //     }
  //   });
  // }

  cargarDatos() {
    if (this.selectedCaja?.maletin != null)
      this.maletinService
        .onGetPorId(this.selectedCaja?.maletin?.id)
        .subscribe((res) => {
          if (res != null) {
            this.selectedMaletin = res;
            this.descripcionMaletinControl.setValue(
              this.selectedMaletin.descripcion
            );
            this.descripcionMaletinControl.disable();
          }
        });
    if (this.selectedCaja?.conteoApertura != null) {
      this.selectedConteoApertura = this.selectedCaja.conteoApertura;
      this.conteoAperturaSubject.next(this.selectedConteoApertura);
    }
    if (this.selectedCaja?.conteoCierre != null) {
      this.selectedConteoCierre = this.selectedCaja.conteoCierre;
      this.conteoCierreSubject.next(this.selectedConteoCierre);
    }
    this.idControl.setValue(this.selectedCaja.id);
    this.observacionControl.setValue(this.selectedCaja.descripcion);
    this.fechaAperturaControl.setValue(this.selectedCaja.fechaApertura);
    this.fechaCierreControl.setValue(this.selectedCaja.fechaCierre);
    this.conteoAperturaControl.setValue(this.selectedCaja.conteoApertura);
    this.conteoCierreControl.setValue(this.selectedCaja.conteoCierre);
    this.activoControl.setValue(this.selectedCaja.activo);
    this.creadoEnControl.setValue(this.selectedCaja.creadoEn);
    this.usuarioControl.setValue(this.selectedCaja.usuario.persona.nombre);
  }

  onSave() {
    let input = new PdvCajaInput();
    if (this.selectedCaja != null) {
      input.id = this.selectedCaja.id;
      input.creadoEn = this.selectedCaja.creadoEn;
      input.usuarioId = this.selectedCaja.usuario.id;
      input.fechaApertura = this.selectedCaja.fechaApertura;
      input.fechaCierre = this.selectedCaja.fechaCierre;
      input.conteoAperturaId = this.selectedCaja?.conteoApertura?.id;
      input.conteoCierreId = this.selectedCaja?.conteoCierre?.id;
    }
    input.observacion = this.observacionControl.value;
    input.activo = this.activoControl.value;
    input.estado = this.estadoControl.value;
    this.cajaService.onSave(input).subscribe((res) => {
      if (res != null) {
        this.matDialogRef.close(res);
      }
    });
  }

  onCancel() {
    this.matDialogRef.close();
  }

  verificarMaletin() {
    this.cargandoDialog.openDialog();
    this.maletinService
      .onGetPorDescripcion(this.descripcionMaletinControl.value)
      .subscribe((res) => {
        this.cargandoDialog.closeDialog();
        if (res != null) {
          let maletinEncontrado: Maletin = res;
          if (maletinEncontrado.abierto == true) {
            this.notificacionBar.notification$.next({
              texto: "Este maletin ya esta siendo utilizado",
              color: NotificacionColor.warn,
              duracion: 3,
            });
            this.seleccionarMaletin(null);
          } else {
            this.notificacionBar.notification$.next({
              texto: "Maletin verificado correctamente",
              color: NotificacionColor.success,
              duracion: 2,
            });
            this.seleccionarMaletin(maletinEncontrado);
          }
        } else {
          this.notificacionBar.notification$.next({
            texto: "No existe un maletin registrado con ese código",
            color: NotificacionColor.danger,
            duracion: 3,
          });
          this.seleccionarMaletin(null);
        }
      });
  }

  sinMaletin() {
    this.matDialog
      .open(AdicionarMaletinDialogComponent, {
        width: "50%",
        autoFocus: true,
        restoreFocus: true,
      })
      .afterClosed()
      .subscribe((res) => {
        if (res != null) {
          this.notificacionBar.notification$.next({
            texto: "Maletin verificado correctamente",
            color: NotificacionColor.success,
            duracion: 2,
          });
          this.seleccionarMaletin(res);
        }
      });
  }

  seleccionarMaletin(maletin: Maletin) {
    if (maletin != null) {
      this.descripcionMaletinControl.setValue(maletin.descripcion);
      this.stepper.next();
      setTimeout(() => {
        this.siguienteSubject.next(0);
      }, 0);
    } else {
      this.descripcionMaletinControl.setValue(null);
    }
    this.selectedMaletin = maletin;
  }

  onSiguiente() {
    console.log(this.stepper.selectedIndex);
    switch (this.stepper.selectedIndex) {
      case 0:
        console.log("next step conteo");
        this.stepper.next();
        this.cargandoDialog.openDialog();
        setTimeout(() => {
          // this.gs500Input.nativeElement.focus()
          this.cargandoDialog.closeDialog();
        }, 500);
        this.siguienteSubject.next(0);
        break;
      case 1:
        this.cargandoDialog.openDialog();
        this.siguienteSubject.next(1);
        break;

      case 2:
        break;

      default:
        break;
    }
  }

  getConteoMoneda(response: AdicionarConteoResponse) {
    this.cargandoDialog.closeDialog();
    if (response.conteoMonedaList.length < 1) {
      this.dialogBox
        .confirm(
          "Atención!!",
          "Realmente desea abrir caja sin adicionar monedas?"
        )
        .subscribe((res) => {
          if (res) {
          }
        });
    } else {
      this.dialogBox
        .confirm("Atención!!", "Confirmar datos de apertura de caja", null, [
          `Guaranies:     ${stringToInteger(response.totalGs)}`,
          `Reales:        ${stringToDecimal(response.totalRs)}`,
          `Dolares:       ${stringToDecimal(response.totalDs)}`,
        ])
        .subscribe((res) => {
          if (res) {
            this.abrirCaja(response.conteoMonedaList);
          }
        });
    }
  }

  getConteoMonedaCierre(response: AdicionarConteoResponse) {
    this.cargandoDialog.closeDialog();
    if (response.conteoMonedaList.length < 1) {
      this.dialogBox
        .confirm(
          "Atención!!",
          "Realmente desea abrir caja sin adicionar monedas?"
        )
        .subscribe((res) => {
          if (res) {
          }
        });
    } else {
      this.dialogBox
        .confirm("Atención!!", "Confirmar datos de apertura de caja", null, [
          `Guaranies:     ${stringToInteger(response.totalGs)}`,
          `Reales:        ${stringToDecimal(response.totalRs)}`,
          `Dolares:       ${stringToDecimal(response.totalDs)}`,
        ])
        .subscribe((res) => {
          if (res) {
            this.cerrarCaja(response.conteoMonedaList);
          }
        });
    }
  }

  onAnterior() {
    this.stepper.previous();
  }

  abrirCaja(conteoMonedaList: ConteoMoneda[]) {
    this.cargandoDialog.openDialog();
    let conteo = new Conteo();
    conteo.conteoMonedaList = conteoMonedaList;
    this.conteoService.onSave(conteo).subscribe((res) => {
      if (res != null) {
        let caja = new PdvCajaInput();
        caja.activo = true;
        caja.conteoAperturaId = res.id;
        caja.estado = PdvCajaEstado["En proceso"];
        caja.fechaApertura = res.creadoEn;
        caja.maletinId = this.selectedMaletin.id;
        caja.observacion = this.observacionControl.value;
        this.cajaService.onSave(caja).subscribe((res1) => {
          console.log(res1);
          if (res1 != null) {
            this.cargandoDialog.closeDialog();
            this.selectedCaja = res1;
          }
        });
      }
    });
  }

  cerrarCaja(conteoMonedaList: ConteoMoneda[]) {
    this.cargandoDialog.openDialog();
    let conteo = new Conteo();
    conteo.conteoMonedaList = conteoMonedaList;
    this.conteoService.onSave(conteo).subscribe((res) => {
      if (res != null) {
        let caja = new PdvCajaInput();
        caja.id = this.selectedCaja.id;
        caja.activo = false;
        caja.conteoAperturaId = this.selectedConteoApertura.id;
        caja.conteoCierreId = res.id;
        caja.estado = PdvCajaEstado.Concluido;
        caja.fechaApertura = this.selectedConteoApertura.creadoEn;
        caja.fechaCierre = res.creadoEn;
        caja.maletinId = this.selectedMaletin.id;
        caja.observacion = this.observacionControl.value;
        this.cajaService.onSave(caja).subscribe((res1) => {
          console.log(res1);
          if (res1 != null) {
            this.cargandoDialog.closeDialog();
            this.selectedCaja = res1;
          }
        });
      }
    });
  }

  @HostListener("document:keydown", ["$event"]) onKeydownHandler(
    event: KeyboardEvent
  ) {
    switch (event.key) {
      case "F10":
        switch (this.stepper.selectedIndex) {
          case 0:
            break;
          case 1:
            this.onSiguiente();

            break;

          default:
            break;
        }
        break;
      case "Enter":
        break;
      default:
        break;
    }
  }

  goTo(opcion) {
    switch (opcion) {
      case "maletin":
        this.stepper.selectedIndex = 0;
        break;
      case "apertura":
        this.stepper.selectedIndex = 1;
        this.focusToAPerturaSub.next()
        break;
      case "cierre":
        this.stepper.selectedIndex = 1;
        this.stepper.selectedIndex = 2;
        this.focusToCierreSub.next()
        break;
      case "imprimir":
        break;
      case "salir":
        this.matDialogRef.close(this.selectedCaja);
        break;
      default:
        break;
    }
  }
}
