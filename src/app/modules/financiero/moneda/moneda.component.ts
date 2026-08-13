import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Moneda } from './moneda.model';
import { MonedaService } from './moneda.service';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { DialogosService } from '../../../shared/components/dialogos/dialogos.service';
import { AddMonedaDialogComponent } from './add-moneda-dialog/add-moneda-dialog.component';
import { MainService } from '../../../main.service';
import { ROLES } from '../../personas/roles/roles.enum';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-moneda',
  templateUrl: './moneda.component.html',
  styleUrls: ['./moneda.component.scss']
})
export class MonedaComponent implements OnInit {

  dataSource = new MatTableDataSource<Moneda>([]);
  isSearching = false;
  displayedColumns = ['id', 'denominacion', 'simbolo', 'decimales', 'principal', 'activo', 'acciones'];
  puedeGestionar = false;

  constructor(
    private monedaService: MonedaService,
    private dialog: MatDialog,
    private notificacion: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    public mainService: MainService
  ) {}

  ngOnInit(): void {
    this.puedeGestionar = this.mainService.tieneAlgunRol([ROLES.TESORERIA_GESTIONAR, ROLES.ADMIN]);
    this.cargar();
  }

  cargar() {
    this.isSearching = true;
    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      this.isSearching = false;
      if (res != null) this.dataSource.data = res;
    });
  }

  onAdd() {
    this.dialog.open(AddMonedaDialogComponent, { width: '480px', data: null })
      .afterClosed().subscribe(res => { if (res) this.cargar(); });
  }

  onEdit(item: Moneda) {
    this.dialog.open(AddMonedaDialogComponent, { width: '480px', data: item })
      .afterClosed().subscribe(res => { if (res) this.cargar(); });
  }

  onDelete(item: Moneda) {
    this.dialogosService.confirm(
      'Eliminar Moneda',
      `¿Eliminar la moneda "${item.denominacion}"?`,
      null, null, true, 'Sí, eliminar', 'No'
    ).subscribe(res => {
      if (res === true) {
        this.monedaService.onDelete(item.id).pipe(untilDestroyed(this)).subscribe(ok => {
          if (ok) { this.notificacion.openSucess('Moneda eliminada'); this.cargar(); }
          else this.notificacion.openAlgoSalioMal('No se pudo eliminar la moneda');
        });
      }
    });
  }
}
