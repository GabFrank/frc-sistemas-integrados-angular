import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { DialogRole, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { ConnectionService } from "ngx-connection-service";
import { BehaviorSubject } from "rxjs";
import { Observable } from "zen-observable-ts";
import { environment } from "../environments/environment";
import { SucursalByIdGQL } from "./modules/empresarial/sucursal/graphql/sucursalById";
import { Sucursal } from "./modules/empresarial/sucursal/sucursal.model";
import { monedasSearch } from "./modules/financiero/moneda/graphql/graphql-query";
import { MonedasGetAllGQL } from "./modules/financiero/moneda/graphql/monedasGetAll";
import { Moneda } from "./modules/financiero/moneda/moneda.model";
import { LoginComponent } from "./modules/login/login.component";
import { Usuario } from "./modules/personas/usuarios/usuario.model";
import { UsuarioService } from "./modules/personas/usuarios/usuario.service";

@Injectable({
  providedIn: "root",
})
export class MainService {
  sucursalActual: Sucursal;
  usuarioActual: Usuario;
  fechaHoraInicioSesion: Date;
  primaryColor: "#C62828";
  green: "#27AE60";
  monedas: Moneda[] = [];
  ciudadId: 1;
  status;
  statusSub: BehaviorSubject<string> = new BehaviorSubject<string>("online");
  hasNetworkConnection: boolean;
  hasInternetAccess: boolean;
  ipLocal = "";
  logged = false;

  constructor(
    private getSucursalById: SucursalByIdGQL,
    private getMonedas: MonedasGetAllGQL,
    private usuarioService: UsuarioService,
    private matDialog: MatDialog,
    private http: HttpClient
  ) {
    this.http.get("http://api.ipify.org/?format=json").subscribe((res: any) => {
      this.ipLocal = res.ip;
    });
  }

  isAuthenticated(): Observable<boolean> {
    console.log('Verificando autenticacion...')
    return new Observable((obs) => {
      let isToken = localStorage.getItem("token");
      if (isToken != null) {
        this.getUsuario().subscribe(res => {
          if(res){
            obs.next(true);
          } else {
            obs.next(false)
          }
        })
      } else {
        obs.next(false);
      }
    });
  }

  getUsuario(): Observable<boolean> {
    return new Observable((obs) => {
      let id = localStorage.getItem("usuarioId");
      if (id != null) {
        this.usuarioService.onGetUsuario(+id).subscribe(res=>{
          if(res!=null){
            this.usuarioActual = res;
            obs.next(true)
          } else {
            obs.next(false)
          }
        })
      } else {
        obs.next(false)
      }
    });
  }

  load() : Promise<boolean>{
    let res;
    this.getSucursalById
      .fetch({
        id: environment.sucursalId,
      })
      .subscribe((data) => {
        if (data.errors == null) {
          this.sucursalActual = data.data.data;
          res = true;
          return res;
        } else {
          res = false;
          return res;
        }
      });
    this.getMonedas.fetch().subscribe((res) => {
      if (res.errors == null) {
        this.monedas = res.data.data;
      }
    });
    return res;
  }
}
