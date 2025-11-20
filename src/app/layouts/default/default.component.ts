import { Component, Inject, OnInit, ViewEncapsulation } from "@angular/core";
import { Subject, of } from "rxjs";
import { switchMap, catchError, tap } from "rxjs/operators";
import { PageEvent } from "@angular/material/paginator";
import { TabService } from "../tab/tab.service";
import { Tab } from "../tab/tab.model";
import { MatDialog } from "@angular/material/dialog";
import { CloseTabPopupComponent } from "./close-tab-popup.component";
import { WindowInfoService } from "../../shared/services/window-info.service";
import { MainService } from "../../main.service";
import { NotificacionesPorTokenGQL, NotificacionData } from "../../modules/configuracion/inicio-sesion/graphql/notificacionesPorToken.gql";
import { GetNotificacionesUsuarioGQL } from "../../modules/configuracion/inicio-sesion/graphql/getNotificacionesUsuario.gql";
import {
  MarcarNotificacionLeidaGQL,
  RegistrarInteraccionNotificacionGQL,
} from "../../modules/configuracion/inicio-sesion/graphql/notificacionMutations.gql";
import { NotificationDetailDialogComponent } from "../../modules/configuracion/inicio-sesion/components/notification-detail-dialog/notification-detail-dialog.component";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

@UntilDestroy()
@Component({
  selector: "app-default",
  templateUrl: "./default.component.html",
  styleUrls: ["./default.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class DefaultComponent implements OnInit {
  sideBarOpen = false;
  notificationsOpen = false;

  tabs = new Array<Tab>();
  notifications: NotificacionData[] = [];
  page = 0;
  size = 10;
  totalPages = 0;
  loadingMore = false;
  totalElements = 0;
  pageSizes = [10, 15, 25, 50];



  selectedTab: number;

  onTabClose: false;

  closeTab?: false;

  res = true;

  private fetchNotifications$ = new Subject<{ page: number, size: number }>();

  constructor(
    private tabService: TabService,
    public dialog: MatDialog,
    public windowInfo: WindowInfoService,
    private mainService: MainService,
    private notificacionesPorTokenGQL: NotificacionesPorTokenGQL,
    private getNotificacionesUsuarioGQL: GetNotificacionesUsuarioGQL,
    private marcarNotificacionLeidaGQL: MarcarNotificacionLeidaGQL,
    private registrarInteraccionNotificacionGQL: RegistrarInteraccionNotificacionGQL
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
        }
      });

    this.fetchNotifications$
      .pipe(
        untilDestroyed(this),
        tap(() => this.loadingMore = true),
        switchMap(({ page, size }) => {
          const usuarioId = localStorage.getItem("usuarioId");
          const tokenFcm = localStorage.getItem("pushToken");
          if (!usuarioId) return of(null);
          return this.getNotificacionesUsuarioGQL
            .fetch({ usuarioId: +usuarioId, tokenFcm, page, size }, { fetchPolicy: 'network-only' })
            .pipe(catchError(() => of(null)));
        })
      )
      .subscribe((res) => {
        this.loadingMore = false;
        const pageData = res?.data?.data;
        if (pageData) {
          this.notifications = (pageData?.content || []).map(item => ({ ...item }));
          this.totalPages = pageData?.totalPages || 0;
          this.totalElements = pageData?.totalElements || 0;
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
      this.page = 0;
      this.fetchNotifications$.next({ page: this.page, size: this.size });
    }
  }

  loadMore(): void {
    this.nextPage();
  }

  private loadPage(pageIndex: number): void {
    this.page = pageIndex;
    this.fetchNotifications$.next({ page: this.page, size: this.size });
  }

  changePageSize(newSize: any): void {
    this.size = +newSize;
    this.loadPage(0);
  }

  onMatPageChange(event: PageEvent): void {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.loadPage(this.page);
  }

  prevPage(): void {
    if (this.page <= 0) return;
    this.loadPage(this.page - 1);
  }

  nextPage(): void {
    if (this.page + 1 >= this.totalPages) return;
    this.loadPage(this.page + 1);
  }

  goToPage(index: number): void {
    if (index < 0 || index >= this.totalPages) return;
    this.loadPage(index);
  }

  onNotificationClick(n: NotificacionData): void {
    this.openDetail(n);
  }

  openDetail(n: NotificacionData): void {
    if (!n.leida) {
      this.markAsRead(n);
    }
    this.registrarInteraccionNotificacionGQL
      .mutate({ notificacionUsuarioId: n.id, accion: "OPEN" })
      .pipe(untilDestroyed(this))
      .subscribe();

    this.dialog.open(NotificationDetailDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: n,
      autoFocus: false
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
          n.leida = true;
          n.fechaLeida = new Date().toISOString();
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
}
