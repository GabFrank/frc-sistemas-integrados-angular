import { LoginService } from './../../../modules/login/login.service';
import { SearchBarDialogComponent } from './../../widgets/search-bar-dialog/search-bar-dialog.component';
import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { Observable, of, Subscription } from "rxjs";
import { connectionStatusSub } from "../../../app.module";
import { ElectronService } from "../../../commons/core/electron/electron.service";
import { TabService } from "../../../layouts/tab/tab.service";
import { MainService } from "../../../main.service";
import { CargandoDialogService } from "../cargando-dialog/cargando-dialog.service";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { LoginComponent } from '../../../modules/login/login.component';
// import { ApolloConfigService } from '../../../apollo-config.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit, OnDestroy {
  status = false;
  statusObs: Observable<any>;
  serverIpAddress = "";
  editServerIp = false;
  serverIpControl = new FormControl();
  statusSub: Subscription;

  @Output() toogleSideBarEvent: EventEmitter<any> = new EventEmitter();

  constructor(
    public mainService: MainService,
    private matDialog: MatDialog,
    private cargandoDialogService: CargandoDialogService,
    private router: Router,
    private tabService: TabService,
    private electronService: ElectronService,
    private loginService: LoginService
  ) {
    // mainService.statusSub.subscribe(res => {
    //   console.log(res)
    //   this.status = res;
    // })
  }

  ngOnInit(): void {
    this.statusSub = connectionStatusSub
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        console.log(res);
        this.status = res;
      });
  }

  toogleSideBar() {
    this.mainService
      .isAuthenticated()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.toogleSideBarEvent.emit();
          setTimeout(() => {
            window.dispatchEvent(new Event("resize"));
          }, 300);
        }
      });
  }

  onLogout() {
    this.cargandoDialogService.openDialog();
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioId");
    this.mainService.usuarioActual = null;
    this.mainService.logged = false;
    this.tabService.removeAllTabs()
    window.location.href = '';
    // this.matDialog.open(LoginComponent, {
    //   width: "500px",
    //   height: "500px",
    //   disableClose: true,
    // }).afterClosed().subscribe(res => {
    //   if(!res){
    //     console.log(res)
    //   }
    // });
  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.statusSub.unsubscribe();
  }

  onSearch(){
    this.matDialog.open(SearchBarDialogComponent, {
      data: null,
      width: '70%'
    })
  }

  removeServer(){
    // this.apolloService.removeClient()
    // this.apolloService.connectClient()
  }
}
