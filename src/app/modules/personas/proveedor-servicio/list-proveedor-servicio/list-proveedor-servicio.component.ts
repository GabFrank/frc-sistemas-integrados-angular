import { Component, OnInit, ViewChild } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { MainService } from "../../../../main.service";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { EditProveedorServicioComponent } from "../edit-proveedor-servicio/edit-proveedor-servicio.component";
import { ProveedorServicio } from "../proveedor-servicio.model";
import { ProveedorServicioService } from "../proveedor-servicio.service";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-list-proveedor-servicio",
  templateUrl: "./list-proveedor-servicio.component.html",
  styleUrls: ["./list-proveedor-servicio.component.scss"],
})
export class ListProveedorServicioComponent implements OnInit {

  titulo = "Lista de proveedores de servicios";

  textoControl = new FormControl();

  displayedColumns = [
    "id",
    "nombre",
    "documento",
    "nombreContacto",
    "numeroContacto",
    "creadoEn",
    "acciones",
  ];

  /** Paginada en el central (#772): gana la última página pedida; si falla, vuelve a la anterior. */
  pag = new PaginacionLista<ProveedorServicio>({
    cargar: (page, size) => this.proveedorServicioService.onGetPaginated(page, size, this.textoControl.value?.trim() || undefined),
    pageSize: 25,
    alFallar: () => this.notificacionService.openAlgoSalioMal('Error al cargar proveedores de servicios'),
  });

  constructor(
    private proveedorServicioService: ProveedorServicioService,
    public mainService: MainService,
    private notificacionService: NotificacionSnackbarService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.pag.filtrar();
  }

  /** Repite la página a la vista (después de guardar o borrar). */
  loadPage(): void {
    this.pag.recargar();
  }

  onFilter(): void {
    this.pag.filtrar();
  }

  onResetFiltro(): void {
    this.textoControl.setValue(null);
    this.pag.filtrar();
  }

  onAdd(): void {
    const dialogRef = this.dialog.open(EditProveedorServicioComponent, {
      width: "600px",
      data: {},
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.loadPage();
      }
    });
  }

  onEditar(row: ProveedorServicio): void {
    if (!row?.id) return;
    const dialogRef = this.dialog.open(EditProveedorServicioComponent, {
      width: "600px",
      data: { proveedorServicio: row, isEditing: true },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.loadPage();
      }
    });
  }

  onEliminar(row: ProveedorServicio): void {
    if (!row?.id) return;
    this.proveedorServicioService
      .onDelete(row.id)
      .pipe(untilDestroyed(this))
      .subscribe((ok) => {
        if (ok) {
          this.loadPage();
        }
      });
  }

}
