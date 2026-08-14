import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from '../../../../app.component';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { Vacacion } from '../vacacion.model';
import { VacacionService } from '../vacacion.service';
import { GestionVacacionDialogComponent } from '../gestion-vacacion-dialog/gestion-vacacion-dialog.component';

interface VacacionRow extends Vacacion { disponibles: number; }

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-vacacion',
  templateUrl: './list-vacacion.component.html',
  styleUrls: ['./list-vacacion.component.scss']
})
export class ListVacacionComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns = ['anioServicio', 'funcionario', 'diasGenerados', 'diasGozados', 'disponibles', 'prescrita', 'acciones'];
  dataSource = new MatTableDataSource<VacacionRow>([]);

  funcionarioControl = new FormControl(null);
  anioControl = new FormControl(null);

  pageIndex = 0;
  pageSize = 25;
  selectedPageInfo: PageInfo<Vacacion>;

  constructor(
    private vacacionService: VacacionService,
    public mainService: MainService,
    private dialog: MatDialog,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    this.onFiltrar();
  }

  onFiltrar() {
    this.vacacionService.onGetPage(
      this.pageIndex,
      this.pageSize,
      this.funcionarioControl.value,
      this.anioControl.value
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.selectedPageInfo = res;
        this.dataSource.data = (res.getContent || []).map(v => ({
          ...v,
          disponibles: (v.diasGenerados || 0) - (v.diasGozados || 0)
        }));
      }
    });
  }

  onResetFiltro() {
    this.funcionarioControl.setValue(null);
    this.anioControl.setValue(null);
    this.pageIndex = 0;
    this.onFiltrar();
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }

  onDevengar() {
    if (this.funcionarioControl.value == null) {
      this.notificacion.notification$.next({ texto: 'Seleccione un funcionario', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    this.vacacionService.onDevengar(this.funcionarioControl.value)
      .pipe(untilDestroyed(this))
      .subscribe(res => { if (res != null) this.onFiltrar(); });
  }

  onGestionar(vacacion: Vacacion) {
    this.dialog.open(GestionVacacionDialogComponent, { data: { vacacion }, width: '760px', disableClose: false })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(() => { this.onFiltrar(); });
  }
}
