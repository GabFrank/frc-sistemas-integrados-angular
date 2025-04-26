import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ThemePalette } from "@angular/material/core";
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { ProgressSpinnerMode } from "@angular/material/progress-spinner";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { timer } from "rxjs";
import {
  SearchListDialogComponent,
  SearchListtDialogData,
} from "../../../shared/components/search-list-dialog/search-list-dialog.component";
import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../empresarial/sucursal/sucursal.service";
import { ConfiguracionService as ModuleConfigService } from "../configuracion.service";
import { ConfiguracionService } from "../../../shared/services/configuracion.service";
import { GraphqlConnectionService } from "../../../shared/services/graphql-connection.service";

class Data { }

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-configurar-servidor-dialog",
  templateUrl: "./configurar-servidor-dialog.component.html",
  styleUrls: ["./configurar-servidor-dialog.component.scss"],
})
export class ConfigurarServidorDialogComponent implements OnInit {
  conexionGroup = new FormGroup({});
  sucursalGroup = new FormGroup({});
  sincronizarGroup = new FormGroup({});
  verificadoControl = new FormControl(null, Validators.required);
  sucursalControl = new FormControl(null, Validators.required);
  sincronizadoControl = new FormControl(null, Validators.required);
  sucursales: Sucursal;
  color: ThemePalette = "primary";
  mode: ProgressSpinnerMode = "indeterminate";
  value = 0;
  verificando = false;
  verificado = null;
  sincronizando = false;
  sincronizado = null;
  selectedSucursal: Sucursal;
  
  // Store current server settings
  currentIp: string;
  currentPort: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: Data,
    private dialogRef: MatDialogRef<ConfigurarServidorDialogComponent>,
    private matDialog: MatDialog,
    private moduleConfigService: ModuleConfigService,
    private configService: ConfiguracionService,
    private graphqlService: GraphqlConnectionService
  ) { }

  ngOnInit(): void {
    this.conexionGroup.addControl("verificado", this.verificadoControl);
    this.sucursalGroup.addControl("sucursal", this.sucursalControl);
    this.sincronizarGroup.addControl("sincronizado", this.sincronizadoControl);
    this.sucursalControl.disable();
    
    // Store current settings to detect changes
    const config = this.configService.getConfig();
    this.currentIp = config.serverIp;
    this.currentPort = config.serverPort;
    
    this.moduleConfigService.getSucursalesAdmin().subscribe((res) => {
      if (res != null) {
        this.sucursales = res;
      }
    });
  }

  onVerificar() {
    this.verificando = true;
    this.sincronizando = true;
    
    // Get current config to check for changes
    const config = this.configService.getConfig();
    const ipChanged = this.currentIp !== config.serverIp;
    const portChanged = this.currentPort !== config.serverPort;
    
    // If configuration changed, trigger reconnection
    if (ipChanged || portChanged) {
      this.currentIp = config.serverIp;
      this.currentPort = config.serverPort;
      this.graphqlService.reconnectWebSockets();
    }
    
    this.moduleConfigService.onVerificarConexion().subscribe((res) => {
      if (res) {
        this.verificado = res;
        this.verificando = false;
        this.sincronizando = false;
        this.verificadoControl.setValue(true);
      }
    });
  }

  onSalir() {
    // Check for unsaved changes before closing
    const config = this.configService.getConfig();
    const ipChanged = this.currentIp !== config.serverIp;
    const portChanged = this.currentPort !== config.serverPort;
    
    // If configuration changed, trigger reconnection before closing
    if (ipChanged || portChanged) {
      this.graphqlService.reconnectWebSockets();
    }
    
    this.dialogRef.close(true);
  }

  onSearchSucursal() {
    let data: SearchListtDialogData = {
      titulo: "Seleccionar sucursal",
      query: null,
      tableData: [
        { id: "id", nombre: "Id", width: "20%" },
        { id: "nombre", nombre: "Nombre", width: "80%" },
      ],
      inicialData: this.sucursales,
    };
    // data.
    this.matDialog
      .open(SearchListDialogComponent, {
        data,
        height: "80%",
        width: "80%",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.selectedSucursal = res;
          this.sucursalControl.setValue(
            this.selectedSucursal.id + " - " + this.selectedSucursal.nombre
          );
        }
      });
  }

  onSincronizar() {
    let timer: NodeJS.Timeout;
    this.moduleConfigService.onSolicitarSincronizacion().subscribe((res) => {
      if (res == true) {
        this.sincronizando = true;
        timer = setInterval(() => {
          this.configService
            .isConfigured()
            .pipe(untilDestroyed(this))
            .subscribe((res) => {
              if (res) {
                this.sincronizado = true;
                this.sincronizando = false;
                clearInterval(timer);
                this.sincronizadoControl.setValue(true);
                localStorage.setItem("token", null);
                localStorage.setItem("usuarioId", null);
              }
            });
        }, 10000);
      }
    });
  }
}

//verificar conexcion con servidor principal
//buscar sucursal a configurar
//solicitar base de datos
//test
//fin
//isconfigured
