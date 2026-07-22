import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from '../../../../app.component';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MainService } from '../../../../main.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Feriado } from '../feriado.model';
import { FeriadoService } from '../feriado.service';
import { EditFeriadoDialogComponent } from '../edit-feriado-dialog/edit-feriado-dialog.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-feriado',
  templateUrl: './list-feriado.component.html',
  styleUrls: ['./list-feriado.component.scss']
})
export class ListFeriadoComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns = ['fecha', 'descripcion', 'esNacional', 'recargoPorcentaje', 'activo', 'acciones'];
  dataSource = new MatTableDataSource<Feriado>([]);

  descripcionControl = new FormControl(null);
  desdeControl = new FormControl(null);
  hastaControl = new FormControl(null);
  activoControl = new FormControl(null);

  pageIndex = 0;
  pageSize = 25;
  selectedPageInfo: PageInfo<Feriado>;

  constructor(
    private feriadoService: FeriadoService,
    public mainService: MainService,
    private dialog: MatDialog,
    private dialogosService: DialogosService
  ) { }

  ngOnInit(): void {
    this.onFiltrar();
  }

  onFiltrar() {
    this.feriadoService.onGetPage(
      this.pageIndex,
      this.pageSize,
      dateToString(this.desdeControl.value, 'yyyy-MM-dd'),
      dateToString(this.hastaControl.value, 'yyyy-MM-dd'),
      this.descripcionControl.value,
      this.activoControl.value
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.selectedPageInfo = res;
        this.dataSource.data = res.getContent || [];
      }
    });
  }

  onResetFiltro() {
    this.descripcionControl.setValue(null);
    this.desdeControl.setValue(null);
    this.hastaControl.setValue(null);
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
    this.dialog.open(EditFeriadoDialogComponent, { width: '460px', disableClose: true })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) this.onFiltrar();
      });
  }

  onEditar(feriado: Feriado) {
    this.dialog.open(EditFeriadoDialogComponent, { data: { feriado }, width: '460px', disableClose: true })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) this.onFiltrar();
      });
  }

  onEliminar(feriado: Feriado) {
    this.dialogosService.confirm(
      'Eliminar feriado',
      '¿Desea eliminar el feriado ' + feriado.descripcion + '?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.feriadoService.onDelete(feriado.id)
          .pipe(untilDestroyed(this))
          .subscribe(ok => { if (ok) this.onFiltrar(); });
      }
    });
  }
}
