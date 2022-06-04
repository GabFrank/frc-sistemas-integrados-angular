import { Component, Inject, OnInit, ViewEncapsulation } from "@angular/core";
import { TabService } from "../tab/tab.service";
import { Tab } from "../tab/tab.model";
import { MatDialog } from "@angular/material/dialog";
import { CloseTabPopupComponent } from "./close-tab-popup.component";
import { WindowInfoService } from "../../shared/services/window-info.service";
import { Observable } from "rxjs/internal/Observable";
import { fromEvent } from "rxjs";
import { MainService } from "../../main.service";

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

  tabs = new Array<Tab>();

  selectedTab: number;

  onTabClose: false;

  closeTab?: false;

  res = true;

  constructor(
    private tabService: TabService,
    public dialog: MatDialog,
    public windowInfo: WindowInfoService,
    private mainService: MainService
  ) {
    fromEvent(document.body, "mousemove")
      .pipe(untilDestroyed(this))
      .subscribe((e) => {
        let event = e as MouseEvent;
        if (event.pageX < 10) {
          this.sideBarOpen = true;
        }
      });
  }

  ngOnInit(): void {
    this.mainService.authenticationSub.subscribe((res) => {
      if (res) {
        this.tabService.tabSub
        .pipe(untilDestroyed(this))
        .subscribe((tabs) => {
          this.tabs = tabs;
          this.selectedTab = tabs.findIndex((tab) => tab.active);
        });
      }
    });
  }

  tabChanged(event): void {
    this.tabService.tabChanged(event.index);
  }

  removeTab(index: number): void {
    this.openDialog(index);
  }

  tootleSideBar(e): void {
    this.sideBarOpen = !this.sideBarOpen;
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

  onSideBarFocus() {
    if (this.sideBarOpen) {
      setTimeout(() => {
        this.sideBarOpen = false;
      }, 1000);
    }
  }
}
