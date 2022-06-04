import {
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
import { Subject } from "rxjs";
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
import { AdicionarMaletinDialogComponent } from "../../../maletin/adicionar-maletin-dialog/adicionar-maletin-dialog.component";
import { Maletin } from "../../../maletin/maletin.model";
import { MaletinService } from "../../../maletin/maletin.service";
import { MonedaService } from "../../../moneda/moneda.service";
import { PdvCaja, PdvCajaInput } from "../caja.model";
import { CajaService } from "../caja.service";

export class AdicionarCajaData {
  caja?: PdvCaja;
}

export interface AdicionarCajaResponse {
  caja?: PdvCaja;
  conteoApertura?: Conteo;
  conteoCierre?: Conteo;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: "app-adicionar-caja-dialog",
  templateUrl: "./adicionar-caja-dialog.component.html",
  styleUrls: ["./adicionar-caja-dialog.component.scss"],
})
export class AdicionarCajaDialogComponent implements OnInit {
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
  totalGsCierre = 0;
  totalRsCierre = 0;
  totalDsCierre = 0;

  conteoInicial = true;

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

  ngOnInit(): void {
    this.cargandoDialog.openDialog()
    this.idControl.disable();
    this.creadoEnControl.disable();
    this.usuarioControl.disable();
    if (this.data?.caja != null) {
      this.cajaService.onGetById(this.data.caja.id).pipe(untilDestroyed(this)).subscribe((res) => {
        if (res != null) {
          this.selectedCaja = res;
          this.cargarDatos();
        }
      });
    } else {
    }
    setTimeout(() => {
      this.codigoMaletinInput.nativeElement.focus();

    }, 1000);
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
        .onGetPorId(this.selectedCaja?.maletin?.id).pipe(untilDestroyed(this))
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
    this.siguienteSubject.next(1);
    this.siguienteCierreSubject.next(1);
    this.cargandoDialog.closeDialog()
  }

  onCancel() {
    let res: AdicionarCajaResponse = {
      caja: this.selectedCaja,
      conteoApertura: this.selectedConteoApertura,
      conteoCierre: this.selectedConteoCierre,
    };
    this.matDialogRef.close(res);
  }

  verificarMaletin() {
    this.cargandoDialog.openDialog();
    this.maletinService
      .onGetPorDescripcion(this.descripcionMaletinControl.value).pipe(untilDestroyed(this))
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
      .afterClosed().pipe(untilDestroyed(this))
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
    this.crearNuevaCaja();
  }

  onSiguiente() {
    switch (this.stepper.selectedIndex) {
      case 0:
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
    this.totalGsAper = +response.totalGs;
    this.totalRsaper = +response.totalRs;
    this.totalDsAper = +response.totalDs;
    if (response.apertura) {
      this.selectedConteoApertura = response.conteo;
    } else {
      this.selectedConteoCierre = response.conteo;
    }
  }

  getConteoMonedaCierre(response: AdicionarConteoResponse) {
    this.totalGsCierre = +response.totalGs;
    this.totalRsCierre = +response.totalRs;
    this.totalDsCierre = +response.totalDs;
    if (response.apertura) {
      this.selectedConteoApertura = response.conteo;
    } else {
      this.selectedConteoCierre = response.conteo;
    }
  }

  onAnterior() {
    this.stepper.previous();
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
        this.focusToAPerturaSub.next(null);
        break;
      case "cierre":
        this.stepper.selectedIndex = 1;
        this.stepper.selectedIndex = 2;
        this.focusToCierreSub.next(null);
        break;
      case "imprimir":
        if (this.selectedCaja != null) this.cajaService.onImprimirBalance(this.selectedCaja?.id)
        break;
      case "salir":
        this.selectedCaja.conteoApertura = this.selectedConteoApertura
        this.selectedCaja.conteoCierre = this.selectedConteoCierre
        this.matDialogRef.close({ caja: this.selectedCaja });
        break;
      default:
        break;
    }
  }

  crearNuevaCaja() {
    this.cargandoDialog.openDialog(true, 'Creando caja...')
    setTimeout(() => {
      let input = new PdvCajaInput;
      input.maletinId = this.selectedMaletin.id;
      input.activo = true;
      this.cajaService.onSave(input)
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          this.cargandoDialog.closeDialog()
          if (res != null) {
            this.selectedCaja = res;
          }
        })
    }, 1000);
  }
}
