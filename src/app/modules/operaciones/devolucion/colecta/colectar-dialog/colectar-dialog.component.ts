import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Sucursal } from "../../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../../empresarial/sucursal/sucursal.service";

export interface ColectarDialogData {
  cantidad?: number; // cuántas devoluciones se van a colectar (opcional, para el texto)
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
    @Inject(MAT_DIALOG_DATA) public data: ColectarDialogData
  ) {}

  ngOnInit(): void {
    this.sucursalService.onGetAllSucursales(true).subscribe((res) => {
      this.cargando = false;
      this.sucursales = (res || []).filter((s) => s.id != 0);
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
