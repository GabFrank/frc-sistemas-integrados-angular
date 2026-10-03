import { PROPAGAR_ERROR_DE_RED } from "../../../../../generics/generic-crud.service";
import { TIMEOUT_POR_DEFECTO_MS } from "../../../../../shared/services/timeout-link";
import { NotificacionSnackbarService } from "../../../../../notificacion-snackbar.service";
import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Sucursal } from "../../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../../empresarial/sucursal/sucursal.service";

export interface ColectarDialogData {
  cantidad?: number; // cuántas devoluciones se van a colectar (opcional, para el texto)
  sucursalOrigenId?: number; // no se ofrece: el backend rechaza colectar hacia el origen
}

export interface ColectarDialogResult {
  sucursalDestinoId: number;
  sucursalDestinoNombre: string;
}

/** Elige el depósito destino de una colecta interna. */
@Component({
  selector: "app-colectar-dialog",
  templateUrl: "./colectar-dialog.component.html",
  styleUrls: ["./colectar-dialog.component.scss"],
})
export class ColectarDialogComponent implements OnInit {
  sucursales: Sucursal[] = [];
  seleccionada: Sucursal | null = null;
  cargando = true;

  constructor(
    private dialogRef: MatDialogRef<ColectarDialogComponent>,
    private sucursalService: SucursalService,
    @Inject(MAT_DIALOG_DATA) public data: ColectarDialogData,
    private notificacion: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    // Sin sucursales no hay destino que elegir: se cierra con aviso (antes quedaba cargando) (#390).
    // avisar = false con null: el servicio ya avisó el error.
    const noCargo = (avisar = true) => {
      this.cargando = false;
      if (avisar) this.notificacion.openWarn("No se pudieron cargar las sucursales: intentá de nuevo.", 5);
      this.dialogRef.close();
    };
    this.sucursalService.onGetAllSucursales(true, PROPAGAR_ERROR_DE_RED, { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true }).subscribe({
      next: (res) => {
        if (res == null) { noCargo(false); return; }
        this.cargando = false;
        const origenId =
          this.data?.sucursalOrigenId != null ? Number(this.data.sucursalOrigenId) : null;
        this.sucursales = res.filter(
          (s) => s.id != 0 && Number(s.id) !== origenId
        );
      },
      error: () => noCargo(),
    });
  }

  onConfirmar(): void {
    if (!this.seleccionada?.id) return;
    this.dialogRef.close({
      sucursalDestinoId: this.seleccionada.id,
      sucursalDestinoNombre: this.seleccionada.nombre,
    } as ColectarDialogResult);
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}
