import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from '../../../../app.component';
import { MainService } from '../../../../main.service';
import { BonoRecurrente } from '../bono-recurrente.model';
import { BonoRecurrenteService } from '../bono-recurrente.service';
import { EditBonoRecurrenteDialogComponent } from '../edit-bono-recurrente-dialog/edit-bono-recurrente-dialog.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-bono-recurrente',
  templateUrl: './list-bono-recurrente.component.html',
  styleUrls: ['./list-bono-recurrente.component.scss']
})
export class ListBonoRecurrenteComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns = ['funcionario', 'tipo', 'monto', 'motivo', 'frecuencia', 'activo', 'acciones'];
  dataSource = new MatTableDataSource<BonoRecurrente>([]);

  funcionarioControl = new FormControl(null);
  activoControl = new FormControl(null);

  pageIndex = 0;
  pageSize = 25;
  selectedPageInfo: PageInfo<BonoRecurrente>;

  constructor(
    private bonoRecurrenteService: BonoRecurrenteService,
    public mainService: MainService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.onFiltrar();
  }

  onFiltrar() {
    this.bonoRecurrenteService.onGetPage(
      this.pageIndex,
      this.pageSize,
      this.funcionarioControl.value,
      this.activoControl.value
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.selectedPageInfo = res;
        this.dataSource.data = res.getContent || [];
      }
    });
  }

  onResetFiltro() {
    this.funcionarioControl.setValue(null);
    this.activoControl.setValue(null);
    this.pageIndex = 0;
    this.onFiltrar();
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }

  onNuevo() {
    this.dialog.open(EditBonoRecurrenteDialogComponent, {
      data: { funcionarioId: this.funcionarioControl.value, bonoRecurrente: null },
      width: '520px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onFiltrar(); });
  }

  onEditar(row: BonoRecurrente) {
    this.dialog.open(EditBonoRecurrenteDialogComponent, {
      data: { funcionarioId: null, bonoRecurrente: row },
      width: '520px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onFiltrar(); });
  }

  onCambiarEstado(row: BonoRecurrente) {
    this.bonoRecurrenteService.onCambiarEstado(row.id, !row.activo)
      .pipe(untilDestroyed(this))
      .subscribe(res => { if (res != null) this.onFiltrar(); });
  }
}
