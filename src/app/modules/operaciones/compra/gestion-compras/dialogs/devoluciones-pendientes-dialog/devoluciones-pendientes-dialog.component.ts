import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Devolucion } from "../../../../devolucion/devolucion.model";

export type DevolucionesPendientesAccion = "ir" | "continuar";

export interface DevolucionesPendientesDialogData {
  proveedorNombre: string;
  devoluciones: Devolucion[];
}

export interface DevolucionesPendientesDialogResult {
  accion: DevolucionesPendientesAccion;
}

interface FilaVista {
  id: number;
  estado: string;
  sucursal: string;
  identificador: string;
  fecha: any;
}

/**
 * Diálogo bloqueante (disableClose) que avisa, al comprar/recibir de un
 * proveedor, que tiene devoluciones en espera de entrega. Obliga a elegir:
 * ir a gestionarlas o continuar con la operación.
 */
@Component({
  selector: "app-devoluciones-pendientes-dialog",
  templateUrl: "./devoluciones-pendientes-dialog.component.html",
  styleUrls: ["./devoluciones-pendientes-dialog.component.scss"],
})
export class DevolucionesPendientesDialogComponent {
  columnas = ["id", "estado", "sucursal", "fecha"];
  filas: FilaVista[] = [];

  constructor(
    private dialogRef: MatDialogRef<DevolucionesPendientesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DevolucionesPendientesDialogData
  ) {
    // Se precalcula en el .ts (no se llaman funciones desde el HTML).
    this.filas = (data?.devoluciones || []).map((d) => ({
      id: d.id,
      estado: this.titulo(d.estado),
      sucursal: d.sucursalOrigen?.nombre || "—",
      identificador: d.identificador || "—",
      fecha: d.fecha,
    }));
  }

  get cantidad(): number {
    return this.filas.length;
  }

  onIr(): void {
    this.dialogRef.close({ accion: "ir" } as DevolucionesPendientesDialogResult);
  }

  onContinuar(): void {
    this.dialogRef.close({
      accion: "continuar",
    } as DevolucionesPendientesDialogResult);
  }

  private titulo(estado?: string): string {
    if (!estado) return "—";
    return estado.charAt(0) + estado.slice(1).toLowerCase();
  }
}
