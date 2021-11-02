import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { Observable } from "rxjs";
import { relaunchElectron } from "../../../../../app/main";
import { ElectronService } from "../../../commons/core/electron/electron.service";
import { TabService } from "../../../layouts/tab/tab.service";
import { MainService } from "../../../main.service";
import { LoginComponent } from "../../../modules/login/login.component";
import { CargandoDialogService } from "../cargando-dialog/cargando-dialog.service";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit {
  status = "online";
  statusObs: Observable<any>;
  serverIpAddress = ''
  editServerIp = false;
  serverIpControl = new FormControl()

  @Output() toogleSideBarEvent: EventEmitter<any> = new EventEmitter();

  constructor(
    public mainService: MainService,
    private matDialog: MatDialog,
    private cargandoDialogService: CargandoDialogService,
    private router: Router,
    private tabService: TabService,
    private electronService: ElectronService
  ) {
    // mainService.statusSub.subscribe(res => {
    //   console.log(res)
    //   this.status = res;
    // })
  }

  ngOnInit(): void {

  }

  toogleSideBar() {
    this.mainService.isAuthenticated().subscribe(res => {
      if(res){
        this.toogleSideBarEvent.emit();
        setTimeout(() => {
          window.dispatchEvent(new Event("resize"));
        }, 300);
      }
    })
  }

  onLogout() {
    this.cargandoDialogService.openDialog();
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioId");
    this.mainService.usuarioActual = null;
    this.mainService.logged = false;
    setTimeout(() => {
      window.location.reload();
      // this.router.navigate([this.router.url])
      // this.cargandoDialogService.closeDialog();
      // this.tabService.removeAllTabs();
      // this.matDialog.open(LoginComponent, {
      //   width: "500px",
      //   height: "500px",
      //   disableClose: false
      // });
      
    }, 1000);
  }

}
