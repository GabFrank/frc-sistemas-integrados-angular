import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
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

  displayedColumns = ['nombre', 'descripcion', 'activo', 'acciones'];
  dataSource = new MatTableDataSource<MotivoVale>([]);

  constructor(
    private motivoValeService: MotivoValeService,
    public mainService: MainService,
    private dialog: MatDialog,
    private dialogosService: DialogosService
  ) { }

  ngOnInit(): void {
    this.onBuscar();
  }

  onBuscar() {
    this.motivoValeService.onGetAll()
      .pipe(untilDestroyed(this))
      .subscribe(res => { this.dataSource.data = res || []; });
  }

  onNuevo() {
    this.dialog.open(EditMotivoValeDialogComponent, { width: '440px', disableClose: true })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onBuscar(); });
  }

  onEditar(motivo: MotivoVale) {
    this.dialog.open(EditMotivoValeDialogComponent, { data: { motivo }, width: '440px', disableClose: true })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onBuscar(); });
  }

  onEliminar(motivo: MotivoVale) {
    this.dialogosService.confirm(
      'Eliminar motivo', '¿Desea eliminar el motivo ' + motivo.nombre + '?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.motivoValeService.onDelete(motivo.id)
          .pipe(untilDestroyed(this)).subscribe(ok => { if (ok) this.onBuscar(); });
      }
    });
  }
}
