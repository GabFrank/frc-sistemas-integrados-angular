import { Component, OnInit, ViewChild } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MainService } from "../../../../main.service";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { EditProveedorServicioComponent } from "../edit-proveedor-servicio/edit-proveedor-servicio.component";
import { ProveedorServicio } from "../proveedor-servicio.model";
import { ProveedorServicioService } from "../proveedor-servicio.service";

@UntilDestroy()
@Component({
  selector: "app-list-proveedor-servicio",
  templateUrl: "./list-proveedor-servicio.component.html",
  styleUrls: ["./list-proveedor-servicio.component.scss"],
})
export class ListProveedorServicioComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  titulo = "Lista de proveedores de servicios";

  dataSource = new MatTableDataSource<ProveedorServicio>([]);
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

  length = 0;
  pageSize = 25;
  pageIndex = 0;

  constructor(
    private proveedorServicioService: ProveedorServicioService,
    public mainService: MainService,
    private notificacionService: NotificacionSnackbarService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadPage();
  }

  loadPage(): void {
    const texto = this.textoControl.value?.trim() || undefined;
    this.proveedorServicioService
      .onGetPaginated(this.pageIndex, this.pageSize, texto)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (pageResult) => {
          this.dataSource.data = pageResult?.getContent ?? [];
          this.length = pageResult?.getTotalElements ?? 0;
        },
        error: () => {
          this.notificacionService.openAlgoSalioMal(
            "Error al cargar proveedores de servicios"
          );
        },
      });
  }

  onFilter(): void {
    this.pageIndex = 0;
    this.loadPage();
  }

  onResetFiltro(): void {
    this.textoControl.setValue(null);
    this.pageIndex = 0;
    this.loadPage();
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

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.loadPage();
  }
}
