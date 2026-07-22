import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from '../../../../app.component';
import { MainService } from '../../../../main.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { MotivoVale } from '../motivo-vale.model';
import { MotivoValeService } from '../motivo-vale.service';
import { EditMotivoValeDialogComponent } from '../edit-motivo-vale-dialog/edit-motivo-vale-dialog.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-motivo-vale',
  templateUrl: './list-motivo-vale.component.html',
  styleUrls: ['./list-motivo-vale.component.scss']
})
export class ListMotivoValeComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns = ['nombre', 'descripcion', 'activo', 'acciones'];
  dataSource = new MatTableDataSource<MotivoVale>([]);

  descripcionControl = new FormControl(null);
  activoControl = new FormControl(null);

  pageIndex = 0;
  pageSize = 25;
  selectedPageInfo: PageInfo<MotivoVale>;

  constructor(
    private motivoValeService: MotivoValeService,
    public mainService: MainService,
    private dialog: MatDialog,
    private dialogosService: DialogosService
  ) { }

  ngOnInit(): void {
    this.onFiltrar();
  }

  onFiltrar() {
    this.motivoValeService.onGetPage(
      this.pageIndex,
      this.pageSize,
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
    this.dialog.open(EditMotivoValeDialogComponent, { width: '440px', disableClose: true })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onFiltrar(); });
  }

  onEditar(motivo: MotivoVale) {
    this.dialog.open(EditMotivoValeDialogComponent, { data: { motivo }, width: '440px', disableClose: true })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onFiltrar(); });
  }

  onEliminar(motivo: MotivoVale) {
    this.dialogosService.confirm(
      'Eliminar motivo', '¿Desea eliminar el motivo ' + motivo.nombre + '?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.motivoValeService.onDelete(motivo.id)
          .pipe(untilDestroyed(this)).subscribe(ok => { if (ok) this.onFiltrar(); });
      }
    });
  }
}
