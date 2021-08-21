import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Observable } from "rxjs";
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

  @Output() toogleSideBarEvent: EventEmitter<any> = new EventEmitter();

  constructor(private mainService: MainService, private matDialog: MatDialog, private cargandoDialogService: CargandoDialogService) {
    // mainService.statusSub.subscribe(res => {
    //   console.log(res)
    //   this.status = res;
    // })
  }

  ngOnInit(): void {}

  toogleSideBar() {
    this.toogleSideBarEvent.emit();
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 300);
  }

  onLogout() {
    this.cargandoDialogService.openDialog()
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioId");
    this.mainService.usuarioActual = null;
    this.mainService.logged = false;
    setTimeout(() => {
      window.location.reload()
      this.cargandoDialogService.closeDialog()
      // this.matDialog.open(LoginComponent, {
      //   width: "500px",
      //   height: "500px",
      //   disableClose: true,
      // });
    }, 1000);
    
  }
}
