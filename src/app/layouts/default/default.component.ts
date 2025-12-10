import { Component, OnInit, ViewEncapsulation, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { TabService } from "../tab/tab.service";
import { Tab } from "../tab/tab.model";
import { MatDialog } from "@angular/material/dialog";
import { CloseTabPopupComponent } from "./close-tab-popup.component";
import { WindowInfoService } from "../../shared/services/window-info.service";
import { MainService } from "../../main.service";
import { NotificacionesPorTokenGQL } from "../../modules/notificaciones/graphql/notificacionesPorToken.gql";
import {
  MarcarNotificacionLeidaGQL
} from "../../modules/notificaciones/graphql/notificacionMutations.gql";
import { NotificacionesTableroService } from "../../modules/notificaciones/services/notificaciones-tablero.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { NotificacionPersonalizadaComponent } from "../../modules/notificaciones/components/notificacion-personalizada/notificacion-personalizada.component";
import { FormControl, FormGroup } from "@angular/forms";

@UntilDestroy()
@Component({
  selector: "app-default",
  templateUrl: "./default.component.html",
  styleUrls: ["./default.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class DefaultComponent implements OnInit, OnDestroy {

  sideBarOpen = false;
  notificationsOpen = false;

  tabs = new Array<Tab>();

  fechaFormGroup: FormGroup;
  fechaInicioControl: FormControl<Date | null>;
  fechaFinControl: FormControl<Date | null>;
  today = new Date();

  selectedTab: number;
  onTabClose: false;
  closeTab?: false;
  res = true;

  constructor(
    private tabService: TabService,
    public dialog: MatDialog,
    public windowInfo: WindowInfoService,
    private mainService: MainService,
    private notificacionesPorTokenGQL: NotificacionesPorTokenGQL,
    private marcarNotificacionLeidaGQL: MarcarNotificacionLeidaGQL,
    private notificacionesTableroService: NotificacionesTableroService,
    private router: Router
  ) {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    ayer.setHours(0, 0, 0, 0);

    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);

    this.fechaInicioControl = new FormControl<Date | null>(ayer);
    this.fechaFinControl = new FormControl<Date | null>(hoy);

    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinControl
    });
  }
  crearNotificacion(): void {
    const dialogRef = this.dialog.open(NotificacionPersonalizadaComponent, {
      width: '800px',
      maxWidth: '95vw',
      autoFocus: false,
      restoreFocus: true,
      panelClass: 'notificacion-dialog-panel'
    });

    dialogRef
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((result) => {
        if (result) {
          console.log('Notificación a enviar:', result);
        }
      });
  }


  ngOnInit(): void {
    this.mainService.authenticationSub
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.tabService.tabSub
            .pipe(untilDestroyed(this))
            .subscribe((tabs) => {
              this.tabs = tabs;
              this.selectedTab = tabs.findIndex((tab) => tab.active);
            });
        } else {
          this.sideBarOpen = false;
          this.notificationsOpen = false;
        }
      });
  }
  tabChanged(event): void {
    this.tabService.tabChanged(event.index);
  }

  removeTab(index: number): void {
    this.openDialog(index);
  }

  toggleSideNav(): void {
    this.sideBarOpen = !this.sideBarOpen;
  }
  setSideNav(isExpanded: boolean): void {
    this.sideBarOpen = isExpanded;
  }



  openNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;

    if (this.notificationsOpen) {
      const tokenFcm = localStorage.getItem("pushToken");
      if (tokenFcm) {
        this.notificacionesTableroService.setTokenFcm(tokenFcm);
        this.aplicarFiltroFechas();
      }
    }
  }

  aplicarFiltroFechas(): void {
    const fechaInicio = this.fechaInicioControl.value;
    const fechaFin = this.fechaFinControl.value;

    let fechaInicioStr: string | null = null;
    let fechaFinStr: string | null = null;

    if (fechaInicio) {
      const inicio = new Date(fechaInicio);
      inicio.setHours(0, 0, 0, 0);
      fechaInicioStr = inicio.toISOString();
    }

    if (fechaFin) {
      const fin = new Date(fechaFin);
      const ahora = new Date();
      if (fin.toDateString() === ahora.toDateString()) {
        fin.setHours(23, 59, 59, 999);
      } else {
        fin.setHours(23, 59, 59, 999);
      }
      fechaFinStr = fin.toISOString();
    }

    this.notificacionesTableroService.actualizarFiltroFechas(fechaInicioStr, fechaFinStr);
  }

  limpiarFiltroFechas(): void {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    ayer.setHours(0, 0, 0, 0);

    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);

    this.fechaInicioControl.setValue(ayer);
    this.fechaFinControl.setValue(hoy);

    this.aplicarFiltroFechas();
  }

  openDialog(index): void {
    const dialogRef = this.dialog.open(CloseTabPopupComponent, {
      width: "250px",
      autoFocus: false,
      restoreFocus: true,
      data: { res: this.res },
    });

    dialogRef
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((result) => {
        if (result) {
          this.tabService.removeTab(index);
        }
      });
  }

  ngOnDestroy(): void {
  }
}