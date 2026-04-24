import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { Proveedor } from '../proveedor.model';
import { ProveedorService } from '../proveedor.service';
import { EditProveedorComponent } from '../edit-proveedor/edit-proveedor.component';
import { GestionProductosProveedorDialogComponent } from '../../../productos/producto-proveedor/gestion-productos-proveedor-dialog/gestion-productos-proveedor-dialog.component';

@UntilDestroy()
@Component({
  selector: 'app-list-proveedor',
  templateUrl: './list-proveedor.component.html',
  styleUrls: ['./list-proveedor.component.scss']
})
export class ListProveedorComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  titulo = 'Lista de proveedores';

  dataSource = new MatTableDataSource<Proveedor>([]);
  textoControl = new FormControl();

  displayedColumns = [
    'id',
    'nombre',
    'documento',
    'apodo',
    'credito',
    'chequeDias',
    'acciones'
  ];

  length = 0;
  pageSize = 25;
  pageIndex = 0;

  constructor(
    private proveedorService: ProveedorService,
    public mainService: MainService,
    private notificacionService: NotificacionSnackbarService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadPage();
  }

  loadPage(): void {
    const texto = this.textoControl.value?.trim() || undefined;
    this.proveedorService
      .onGetProveedoresPaginated(this.pageIndex, this.pageSize, texto)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (pageResult) => {
          this.dataSource.data = pageResult?.getContent ?? [];
          this.length = pageResult?.getTotalElements ?? 0;
        },
        error: () => {
          this.notificacionService.openAlgoSalioMal('Error al cargar proveedores');
        }
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
    const dialogRef = this.dialog.open(EditProveedorComponent, {
      width: '600px',
      data: {}
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.loadPage();
      }
    });
  }

  onEditar(row: Proveedor): void {
    if (!row?.id) return;
    const dialogRef = this.dialog.open(EditProveedorComponent, {
      width: '600px',
      data: { proveedor: row, isEditing: true }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.loadPage();
      }
    });
  }

  onGestionarProductosProveedor(proveedor: Proveedor): void {
    if (!proveedor?.id) return;
    this.dialog.open(GestionProductosProveedorDialogComponent, {
      data: { proveedor },
      width: '50vw',
      height: '60vh',
      maxWidth: '50vw',
      maxHeight: '60vh',
      panelClass: 'gestion-productos-proveedor-dialog-panel',
    }).afterClosed().subscribe(() => {});
  }

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.loadPage();
  }
}
