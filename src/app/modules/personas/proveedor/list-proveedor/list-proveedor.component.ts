import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { Proveedor } from '../proveedor.model';
import { ProveedorService } from '../proveedor.service';
import { EditProveedorComponent } from '../edit-proveedor/edit-proveedor.component';
import { GestionProductosProveedorDialogComponent } from '../../../productos/producto-proveedor/gestion-productos-proveedor-dialog/gestion-productos-proveedor-dialog.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-proveedor',
  templateUrl: './list-proveedor.component.html',
  styleUrls: ['./list-proveedor.component.scss']
})
export class ListProveedorComponent implements OnInit {

  titulo = 'Lista de proveedores';

  textoControl = new FormControl();
  /** null = todos, true = activos, false = inactivos. */
  estadoControl = new FormControl<boolean | null>(null);

  displayedColumns = [
    'id',
    'nombre',
    'documento',
    'apodo',
    'credito',
    'chequeDias',
    'activo',
    'acciones'
  ];

  /** Paginada en el central (#772): gana la última página pedida; si falla, vuelve a la anterior. */
  pag = new PaginacionLista<Proveedor>({
    cargar: (page, size) => this.proveedorService.onGetProveedoresPaginated(page, size, this.textoControl.value?.trim() || undefined, this.estadoControl.value),
    pageSize: 25,
    alFallar: () => this.notificacionService.openAlgoSalioMal('Error al cargar proveedores'),
  });

  constructor(
    private proveedorService: ProveedorService,
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
    this.estadoControl.setValue(null);
    this.pag.filtrar();
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

}
