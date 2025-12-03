import { Component, OnInit, ViewEncapsulation, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { TabService } from "../tab/tab.service";
import { Tab } from "../tab/tab.model";
import { MatDialog } from "@angular/material/dialog";
import { CloseTabPopupComponent } from "./close-tab-popup.component";
import { WindowInfoService } from "../../shared/services/window-info.service";
import { MainService } from "../../main.service";
import { NotificacionesPorTokenGQL} from "../../modules/configuracion/inicio-sesion/graphql/notificacionesPorToken.gql";
import {
  MarcarNotificacionLeidaGQL
} from "../../modules/configuracion/inicio-sesion/graphql/notificacionMutations.gql";
import { NotificacionesTableroService} from "../../services/notificaciones-tablero.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

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
        this.notificacionesTableroService.refrescarTodas();
      }
    }
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