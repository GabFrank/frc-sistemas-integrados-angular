import { HttpClient } from "@angular/common/http";
import { Injectable, Injector, OnDestroy } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { BehaviorSubject, Observable, Subscription, takeUntil } from "rxjs";
import { ConfigFile, ipAddress } from "../environments/conectionConfig";
import { environment } from "../environments/environment";
import { SucursalByIdGQL } from "./modules/empresarial/sucursal/graphql/sucursalById";
import { Sucursal } from "./modules/empresarial/sucursal/sucursal.model";
import { MonedasGetAllGQL } from "./modules/financiero/moneda/graphql/monedasGetAll";
import { Moneda } from "./modules/financiero/moneda/moneda.model";
import { Usuario } from "./modules/personas/usuarios/usuario.model";
import { UsuarioService } from "./modules/personas/usuarios/usuario.service";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { SucursalService } from "./modules/empresarial/sucursal/sucursal.service";
import { Actualizacion } from "./modules/configuracion/actualizacion/actualizacion.model";
import { ActualizacionService } from "./modules/configuracion/actualizacion/actualizacion.service";
import { IpcRenderer } from "electron";
import { ElectronService } from "../app/commons/core/electron/electron.service";

@UntilDestroy()
@Injectable({
  providedIn: "root",
})
export class MainService implements OnDestroy {
  sucursalActual: Sucursal;
  usuarioActual: Usuario;
  fechaHoraInicioSesion: Date;
  primaryColor: "#C62828";
  green: "#27AE60";
  monedas: Moneda[] = [];
  ciudadId: 1;
  status;
  statusSub: Subscription;
  authenticationSub: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    null
  );
  hasNetworkConnection: boolean;
  hasInternetAccess: boolean;
  ipLocal = "";
  logged = false;
  serverIpAddres = environment['serverIp'];
  authSub;
  isServidor = false;
  private updateService: ActualizacionService;
  public renderer: IpcRenderer;
  configFile: ConfigFile

  // isUserLoggerSub = new BehaviorSubject<boolean>(false);

  constructor(
    private getSucursalById: SucursalByIdGQL,
    private getMonedas: MonedasGetAllGQL,
    private matDialog: MatDialog,
    private http: HttpClient,
    public sucursalService: SucursalService,
    private usuarioService: UsuarioService,
    private injector: Injector,
    private electronService: ElectronService
  ) {

    localStorage.setItem("ip", this.serverIpAddres);

    const data = [
      {
        type: 'image',
        url: './../assets/logo_bodega_negro.png',     // file path
        position: 'center',                                  // position of image: 'left' | 'center' | 'right'
        width: '60px',                                           // width of image in px; default: auto
        height: '50px',                                          // width of image in px; default: 50 or '50px'
      },
      {
        type: 'text',                                       // 'text' | 'barCode' | 'qrCode' | 'image' | 'table
        value: 'SAMPLE HEADING',
        style: { fontWeight: "700", textAlign: 'center', fontSize: "24px" }
      }, {
        type: 'text',                       // 'text' | 'barCode' | 'qrCode' | 'image' | 'table'
        value: 'Secondary text',
        style: { textDecoration: "underline", fontSize: "10px", textAlign: "center", color: "red" }
      }, {
        type: 'barCode',
        value: '023456789010',
        height: 40,                     // height of barcode, applicable only to bar and QR codes
        width: 2,                       // width of barcode, applicable only to bar and QR codes
        displayValue: true,             // Display value below barcode
        fontsize: 12,
      }, {
        type: 'qrCode',
        value: 'https://github.com/Hubertformin/electron-pos-printer',
        height: 55,
        width: 55,
        style: { margin: '10 20px 20 20px' }
      }, {
        type: 'table',
        // style the table
        style: { border: '1px solid #ddd' },
        // list of the columns to be rendered in the table header
        tableHeader: ['Animal', 'Age'],
        // multi dimensional array depicting the rows and columns of the table body
        tableBody: [
          ['Cat', 2],
          ['Dog', 4],
          ['Horse', 12],
          ['Pig', 4],
        ],
        // list of columns to be rendered in the table footer
        tableFooter: ['Animal', 'Age'],
        // custom style for the table header
        tableHeaderStyle: { backgroundColor: '#000', color: 'white' },
        // custom style for the table body
        tableBodyStyle: { 'border': '0.5px solid #ddd' },
        // custom style for the table footer
        tableFooterStyle: { backgroundColor: '#000', color: 'white' },
      },
      // {
      //     type: 'table',
      //     style: {border: '1px solid #ddd'},             // style the table
      //     // list of the columns to be rendered in the table header
      //     tableHeader: [{type: 'text', value: 'People'}, {type: 'image', path: path.join(__dirname, 'icons/animal.png')}],
      //     // multi-dimensional array depicting the rows and columns of the table body
      //     tableBody: [
      //         [{type: 'text', value: 'Marcus'}, {type: 'image', url: 'https://randomuser.me/api/portraits/men/43.jpg'}],
      //         [{type: 'text', value: 'Boris'}, {type: 'image', url: 'https://randomuser.me/api/portraits/men/41.jpg'}],
      //         [{type: 'text', value: 'Andrew'}, {type: 'image', url: 'https://randomuser.me/api/portraits/men/23.jpg'}],
      //         [{type: 'text', value: 'Tyresse'}, {type: 'image', url: 'https://randomuser.me/api/portraits/men/53.jpg'}],
      //     ],
      //     // list of columns to be rendered in the table footer
      //     tableFooter: [{type: 'text', value: 'People'}, 'Image'],
      //     // custom style for the table header
      //     tableHeaderStyle: { backgroundColor: 'red', color: 'white'},
      //     // custom style for the table body
      //     tableBodyStyle: {'border': '0.5px solid #ddd'},
      //     // custom style for the table footer
      //     tableFooterStyle: {backgroundColor: '#000', color: 'white'},
      // },
    ]

    setTimeout(() => {
      electronService.print(data)
    }, 3000);
  }

  isAuthenticated(): Observable<boolean> {
    return new Observable((obs) => {
      let isToken = localStorage.getItem("token");
      if (isToken != null) {
        this.getUsuario()
          .pipe(untilDestroyed(this))
          .subscribe((res) => {
            if (res) {
              obs.next(true);
              this.authenticationSub.next(res);
            } else {
              obs.next(false);
              this.authenticationSub.next(res);
            }
          });
      } else {
        obs.next(false);
      }
    });
  }

  getUsuario(): Observable<boolean> {
    return new Observable((obs) => {
      let id = localStorage.getItem("usuarioId");
      if (id != null) {
        this.usuarioService
          .onGetUsuario(+id)
          .pipe(untilDestroyed(this))
          .subscribe((res) => {
            if (res != null) {
              this.usuarioActual = res;
              obs.next(true);
            } else {
              obs.next(false);
            }
          })
      } else {
        obs.next(false);
      }
    });
  }

  load(): Promise<boolean> {
    let res;
    this.sucursalService.onGetSucursalActual()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.sucursalActual = res;
          if (this.sucursalActual?.id == 0) {
            this.isServidor = true;
          }
        }
      });
    this.getMonedas
      .fetch()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res.errors == null) {
          this.monedas = res.data.data;
        }
      });
    return res;
  }

  changeServerIpAddress(text) {
    localStorage.setItem("ip", text);
    this.serverIpAddres = localStorage.getItem("ip");
  }

  // async getConfigFile(){
  //   this.configFile = await this.electronService.getConfigFile();
  // }

  // async getUrl(){
  //   return `http://${await this.configFile.serverUrl}:${await this.configFile.serverPor}/graphql`
  // }

  // async getWs(){
  //   return `ws://${await this.configFile.serverUrl}:${await this.configFile.serverPor}/subscriptions`
  // }

  ngOnDestroy(): void { }
}
