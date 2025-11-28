import { Component, Inject, OnInit, ViewEncapsulation, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { Subject, of, Observable } from "rxjs";
import { PageEvent } from "@angular/material/paginator";
import { TabService } from "../tab/tab.service";
import { Tab } from "../tab/tab.model";
import { MatDialog } from "@angular/material/dialog";
import { CloseTabPopupComponent } from "./close-tab-popup.component";
import { WindowInfoService } from "../../shared/services/window-info.service";
import { MainService } from "../../main.service";
import { NotificacionesPorTokenGQL, NotificacionData } from "../../modules/configuracion/inicio-sesion/graphql/notificacionesPorToken.gql";
import {
  MarcarNotificacionLeidaGQL,
  RegistrarInteraccionNotificacionGQL,
} from "../../modules/configuracion/inicio-sesion/graphql/notificacionMutations.gql";
import { NotificationDetailDialogComponent } from "../../modules/configuracion/inicio-sesion/components/notification-detail-dialog/notification-detail-dialog.component";
import { NotificacionesTableroService, PaginationState } from "../../services/notificaciones-tablero.service";
import { EstadoNotificacionTablero, ESTADOS_TABLERO_LABELS } from "../../shared/enums/estado-notificacion-tablero.enum";
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

  readonly ESTADOS_TABLERO = [
    EstadoNotificacionTablero.POR_VERIFICAR,
    EstadoNotificacionTablero.EN_PROCESO,
    EstadoNotificacionTablero.VERIFICADO
  ];
  readonly ESTADOS_LABELS = ESTADOS_TABLERO_LABELS;
  readonly pageSizeOptions = [5, 10, 20, 50];

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
    private registrarInteraccionNotificacionGQL: RegistrarInteraccionNotificacionGQL,
    private notificacionesTableroService: NotificacionesTableroService,
    private router: Router
  ) {
  }

  getNotificacionesPorEstado(estado: string): Observable<NotificacionData[]> {
    return this.notificacionesTableroService.getNotificacionesPorEstado(estado);
  }

  getPaginationState(estado: string): Observable<PaginationState> {
    return this.notificacionesTableroService.getPaginationState(estado);
  }

  changeEstadoTablero(n: NotificacionData, nuevoEstado: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (!n || n.estadoTablero === nuevoEstado) {
      return;
    }

    this.notificacionesTableroService
      .actualizarEstadoTablero(n.id, nuevoEstado)
      .pipe(untilDestroyed(this))
      .subscribe();
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

  onPageChange(event: PageEvent, estado: string): void {
    this.notificacionesTableroService.cargarNotificaciones(
      estado,
      event.pageIndex,
      event.pageSize
    );
  }
  onNotificationClick(n: NotificacionData): void {
    this.navigateByNotificationType(n);
    this.openDetail(n);
  }

  private navigateByNotificationType(n: NotificacionData): void {
    const tipo = n.notificacion?.tipo;

    if (!tipo) {
      return;
    }

    switch (tipo) {
      case 'AJUSTE_STOCK':
        this.router.navigate(['/operaciones/movimientos-stock']);
        break;
      case 'PRODUCTO_CREADO':
        this.router.navigate(['/productos']);
        break;
      case 'TRANSFERENCIA_INICIADA':
        this.router.navigate(['/operaciones/transferencias']);
        break;
      case 'PRECIO_ACTUALIZADO':
        this.router.navigate(['/productos']);
        break;
      default:
        break;
    }
  }

  openDetail(n: NotificacionData): void {
    this.registrarInteraccionNotificacionGQL
      .mutate({ notificacionUsuarioId: n.id, accion: "OPEN" })
      .pipe(untilDestroyed(this))
      .subscribe();

    const dialogRef = this.dialog.open(NotificationDetailDialogComponent, {
      width: '55vw',
      maxWidth: '95vw',
      data: n,
      autoFocus: false
    });

    dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(() => {
      if (!n.leida) {
        this.markAsRead(n);
      }
    });
  }

  markAsRead(n: NotificacionData, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (n.leida) return;

    this.marcarNotificacionLeidaGQL
      .mutate({ notificacionUsuarioId: n.id })
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res?.data?.data) {
          this.notificacionesTableroService.actualizarEstadoLeido(n.id);
        }
      });
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