import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
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

  displayedColumns = ['anioServicio', 'diasGenerados', 'diasGozados', 'disponibles', 'prescrita', 'acciones'];
  dataSource = new MatTableDataSource<VacacionRow>([]);

  funcionarioControl = new FormControl(null);

  constructor(
    private vacacionService: VacacionService,
    public mainService: MainService,
    private dialog: MatDialog,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
  }


  onBuscar() {
    if (this.funcionarioControl.value == null) {
      this.notificacion.notification$.next({ texto: 'Seleccione un funcionario', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    this.vacacionService.onGetPorFuncionario(this.funcionarioControl.value)
      .pipe(untilDestroyed(this))
      .subscribe((res: Vacacion[]) => {
        this.dataSource.data = (res || []).map(v => ({
          ...v,
          disponibles: (v.diasGenerados || 0) - (v.diasGozados || 0)
        }));
      });
  }

  onDevengar() {
    if (this.funcionarioControl.value == null) {
      this.notificacion.notification$.next({ texto: 'Seleccione un funcionario', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    this.vacacionService.onDevengar(this.funcionarioControl.value)
      .pipe(untilDestroyed(this))
      .subscribe(res => { if (res != null) this.onBuscar(); });
  }

  onGestionar(vacacion: Vacacion) {
    this.dialog.open(GestionVacacionDialogComponent, { data: { vacacion }, width: '760px', disableClose: false })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(() => { this.onBuscar(); });
  }
}
