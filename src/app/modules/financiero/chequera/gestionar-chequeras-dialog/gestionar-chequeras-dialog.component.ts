import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Chequera } from '../chequera.model';
import { ChequeraService } from '../chequera.service';
import { EditChequeraDialogComponent, EditChequeraData } from '../edit-chequera-dialog/edit-chequera-dialog.component';

interface ChequeraRow extends Chequera {
  _cuentaLabel?: string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-gestionar-chequeras-dialog',
  templateUrl: './gestionar-chequeras-dialog.component.html',
  styleUrls: ['./gestionar-chequeras-dialog.component.scss'],
})
export class GestionarChequerasDialogComponent implements OnInit {

  dataSource = new MatTableDataSource<ChequeraRow>([]);
  displayedColumns = ['nombre', 'cuenta', 'rango', 'siguiente', 'hojas', 'estado', 'acciones'];
  isLoading = false;
  cambios = false;   // se devuelve al cerrar para que el dashboard recargue si hubo altas/ediciones

  constructor(
    private dialogRef: MatDialogRef<GestionarChequerasDialogComponent>,
    private chequeraService: ChequeraService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar() {
    this.isLoading = true;
    this.chequeraService.onGetChequeras(0, 200).pipe(untilDestroyed(this)).subscribe(res => {
      this.isLoading = false;
      this.dataSource.data = (res || []).map(ch => this.toRow(ch));
    });
  }

  private toRow(ch: Chequera): ChequeraRow {
    // Clonar: Apollo congela los resultados (dev) y asignar props de display sobre
    // el objeto congelado lanza TypeError en modo estricto.
    const row = { ...ch } as ChequeraRow;
    const banco = ch.cuentaBancaria?.banco?.nombre || '';
    row._cuentaLabel = banco ? (banco + ' · ' + (ch.cuentaBancaria?.numero || '')) : '-';
    return row;
  }

  nueva() {
    this.abrirEdit({});
  }

  editar(ch: Chequera) {
    this.abrirEdit({ chequera: ch });
  }

  private abrirEdit(data: EditChequeraData) {
    this.dialog.open(EditChequeraDialogComponent, { width: '520px', maxWidth: '95vw', data })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
        if (res) { this.cambios = true; this.cargar(); }
      });
  }

  cerrar() {
    this.dialogRef.close(this.cambios);
  }
}
