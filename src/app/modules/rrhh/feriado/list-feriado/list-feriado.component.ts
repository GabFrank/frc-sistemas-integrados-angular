import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
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

  @ViewChild(MatTable) table: MatTable<any>;

  displayedColumns = ['fecha', 'descripcion', 'esNacional', 'recargoPorcentaje', 'activo', 'acciones'];
  dataSource = new MatTableDataSource<Feriado>([]);

  constructor(
    private feriadoService: FeriadoService,
    public mainService: MainService,
    private dialog: MatDialog,
    private dialogosService: DialogosService
  ) { }

  ngOnInit(): void {
    this.onBuscar();
  }

  onBuscar() {
    this.feriadoService.onGetAll()
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.dataSource.data = res || [];
      });
  }

  onNuevo() {
    this.dialog.open(EditFeriadoDialogComponent, { width: '460px', disableClose: true })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) this.onBuscar();
      });
  }

  onEditar(feriado: Feriado) {
    this.dialog.open(EditFeriadoDialogComponent, { data: { feriado }, width: '460px', disableClose: true })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) this.onBuscar();
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
          .subscribe(ok => { if (ok) this.onBuscar(); });
      }
    });
  }
}
