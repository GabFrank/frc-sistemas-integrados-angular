import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Chequera, ChequeraInput, EstadoChequera } from '../chequera.model';
import { ChequeraService } from '../chequera.service';
import { EditChequeraDialogComponent, EditChequeraData } from '../edit-chequera-dialog/edit-chequera-dialog.component';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';

interface ChequeraRow extends Chequera {
  _cuentaLabel?: string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-gestionar-chequeras-dialog',
  templateUrl: './gestionar-chequeras-dialog.component.html',
  styleUrls: ['./gestionar-chequeras-dialog.component.scss'],
})
export class GestionarChequerasDialogComponent implements OnInit, AfterViewInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;

  dataSource = new MatTableDataSource<ChequeraRow>([]);
  displayedColumns = ['nombre', 'cuenta', 'rango', 'siguiente', 'hojas', 'estado', 'acciones'];
  isLoading = false;
  cambios = false;   // se devuelve al cerrar para que el dashboard recargue si hubo cambios

  // Filtros (client-side sobre la lista cargada)
  buscarControl = new FormControl('');
  estadoFiltro: string | null = null;
  estados = [
    { label: 'Todas', value: null },
    { label: 'Activas', value: EstadoChequera.ACTIVA },
    { label: 'Agotadas', value: EstadoChequera.AGOTADA },
    { label: 'Anuladas', value: EstadoChequera.ANULADA },
  ];

  constructor(
    private dialogRef: MatDialogRef<GestionarChequerasDialogComponent>,
    private chequeraService: ChequeraService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService,
  ) {}

  ngOnInit(): void {
    this.dataSource.filterPredicate = (row, filter) => {
      const c = JSON.parse(filter);
      const texto = (c.texto || '').toLowerCase();
      const matchTexto = !texto
        || (row.nombre || '').toLowerCase().includes(texto)
        || (row._cuentaLabel || '').toLowerCase().includes(texto);
      const matchEstado = !c.estado || row.estado === c.estado;
      return matchTexto && matchEstado;
    };
    this.cargar();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  cargar() {
    this.isLoading = true;
    this.chequeraService.onGetChequeras(0, 500).pipe(untilDestroyed(this)).subscribe(res => {
      this.isLoading = false;
      this.dataSource.data = (res || []).map(ch => this.toRow(ch));
      this.aplicarFiltro();
    });
  }

  aplicarFiltro() {
    this.dataSource.filter = JSON.stringify({ texto: this.buscarControl.value || '', estado: this.estadoFiltro });
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  onEstadoFiltro(v: string | null) {
    this.estadoFiltro = v;
    this.aplicarFiltro();
  }

  limpiarFiltros() {
    this.buscarControl.setValue('');
    this.estadoFiltro = null;
    this.aplicarFiltro();
  }

  private toRow(ch: Chequera): ChequeraRow {
    // Clonar: Apollo congela los resultados (dev) y asignar props de display sobre
    // el objeto congelado lanza TypeError en modo estricto.
    const row = { ...ch } as ChequeraRow;
    const banco = ch.cuentaBancaria?.banco?.nombre || '';
    row._cuentaLabel = banco ? (banco + ' · ' + (ch.cuentaBancaria?.numero || '')) : '-';
    return row;
  }

  // ── Acciones ──

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

  vincularFormato(_ch: Chequera) {
    this.notificacion.notification$.next({
      texto: 'Vincular formato de impresión: próximamente.',
      color: NotificacionColor.warn, duracion: 3,
    });
  }

  desactivar(ch: ChequeraRow) {
    if (!ch?.id) return;
    this.dialogosService.confirm(
      'Desactivar chequera',
      '¿Desactivar esta chequera? No se podrán emitir más cheques con ella.',
      ch.nombre || ('Chequera #' + ch.id), null, true, 'Sí, desactivar', 'No',
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res !== true) return;
      const input: ChequeraInput = {
        id: ch.id,
        cuentaBancariaId: ch.cuentaBancaria?.id,
        nombre: ch.nombre,
        firmantes: ch.firmantes,
        rangoDesde: ch.rangoDesde,
        rangoHasta: ch.rangoHasta,
        siguienteNumero: ch.siguienteNumero,
        estado: EstadoChequera.ANULADA,
      };
      this.chequeraService.onSaveChequera(input).pipe(untilDestroyed(this)).subscribe({
        next: r => {
          if (r != null) {
            this.cambios = true;
            this.notificacion.notification$.next({ texto: 'Chequera desactivada', color: NotificacionColor.success, duracion: 3 });
            this.cargar();
          }
        },
        error: err => {
          const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'No se pudo desactivar';
          this.notificacion.notification$.next({ texto: msg, color: NotificacionColor.warn, duracion: 5 });
        },
      });
    });
  }

  cerrar() {
    this.dialogRef.close(this.cambios);
  }
}
