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
import { ConfiguracionService } from "../configuracion.service";

class Data {}

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

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: Data,
    private dialogRef: MatDialogRef<ConfigurarServidorDialogComponent>,
    private matDialog: MatDialog,
    private configService: ConfiguracionService
  ) {}

  ngOnInit(): void {
    this.conexionGroup.addControl("verificado", this.verificadoControl);
    this.sucursalGroup.addControl("sucursal", this.sucursalControl);
    this.sincronizarGroup.addControl("sincronizado", this.sincronizadoControl);
    this.sucursalControl.disable();
    this.configService.getSucursalesAdmin().subscribe((res) => {
      if (res != null) {
        this.sucursales = res;
      }
    });
  }

  onVerificar() {
    this.verificando = true;
    this.configService.onVerificarConexion().subscribe((res) => {
      console.log(res);
      if (res != null) {
        this.verificado = res;
        this.verificando = false;
        this.verificadoControl.setValue(true);
      }
    });
  }

  onSalir() {
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
    this.configService.onSolicitarSincronizacion().subscribe((res) => {
      if (res == true) {
        console.log("sincronizacionn iniciada...");
        this.sincronizando = true;
        timer = setInterval(() => {
          console.log("solicitando is configured");
          this.configService
            .isConfigured()
            .pipe(untilDestroyed(this))
            .subscribe((res) => {
              console.log(res);
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
