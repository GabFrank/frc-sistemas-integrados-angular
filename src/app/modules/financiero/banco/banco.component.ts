import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Banco } from './banco.model';
import { BancoService } from './banco.service';
import { AddBancoDialogComponent } from './add-banco-dialog/add-banco-dialog.component';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { DialogosService } from '../../../shared/components/dialogos/dialogos.service';
import { MainService } from '../../../main.service';
import { ROLES } from '../../personas/roles/roles.enum';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-banco',
  templateUrl: './banco.component.html',
  styleUrls: ['./banco.component.scss']
})
export class BancoComponent implements OnInit {

  dataSource = new MatTableDataSource<Banco>([]);
  isSearching = false;

  displayedColumns = ['id', 'nombre', 'codigo', 'acciones'];

  puedeGestionar = false;

  constructor(
    private bancoService: BancoService,
    private dialog: MatDialog,
    private notificacion: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    public mainService: MainService
  ) { }

  ngOnInit(): void {
    this.puedeGestionar = this.mainService.tieneAlgunRol([ROLES.TESORERIA_GESTIONAR]);
    this.onFiltrar();
  }

  onFiltrar() {
    this.isSearching = true;
    this.bancoService.onGetAll()
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.isSearching = false;
        if (res != null) this.dataSource.data = res;
      });
  }

  onAdd() {
    this.dialog.open(AddBancoDialogComponent, {
      width: '450px',
      data: null
    }).afterClosed().subscribe(res => {
      if (res != null) this.onFiltrar();
    });
  }

  onEdit(item: Banco) {
    this.dialog.open(AddBancoDialogComponent, {
      width: '450px',
      data: item
    }).afterClosed().subscribe(res => {
      if (res != null) this.onFiltrar();
    });
  }

  onDelete(item: Banco) {
    this.dialogosService.confirm(
      'Eliminar Banco',
      `¿Está seguro que desea eliminar el banco "${item.nombre}"?`,
      null, null
    ).subscribe(confirmed => {
      if (confirmed) {
        this.bancoService.onDelete(item.id)
          .pipe(untilDestroyed(this))
          .subscribe(res => {
            if (res) {
              this.notificacion.openSucess('Banco eliminado correctamente');
              this.onFiltrar();
            } else {
              this.notificacion.openAlgoSalioMal('No se pudo eliminar el banco');
            }
          });
      }
    });
  }
}
