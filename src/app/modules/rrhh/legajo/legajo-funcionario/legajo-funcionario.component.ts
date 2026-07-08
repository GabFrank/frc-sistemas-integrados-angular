import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';
import { FuncionarioService } from '../../../personas/funcionarios/funcionario.service';
import { LegajoService } from '../legajo.service';
import { FuncionarioCargoHistorico, FuncionarioSalarioHistorico, FuncionarioDocumento } from '../legajo.model';
import { CambioCargoDialogComponent } from '../cambio-cargo-dialog/cambio-cargo-dialog.component';
import { CambioSalarioDialogComponent } from '../cambio-salario-dialog/cambio-salario-dialog.component';
import { EgresarFuncionarioDialogComponent } from '../egresar-funcionario-dialog/egresar-funcionario-dialog.component';
import { SubirDocumentoDialogComponent } from '../subir-documento-dialog/subir-documento-dialog.component';

interface FuncionarioOpcion { id: number; label: string; }

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-legajo-funcionario',
  templateUrl: './legajo-funcionario.component.html',
  styleUrls: ['./legajo-funcionario.component.scss']
})
export class LegajoFuncionarioComponent implements OnInit {

  funcionarioControl = new FormControl(null);
  funcionarioOpciones: FuncionarioOpcion[] = [];
  funcionario: Funcionario = null;

  cargoColumns = ['cargo', 'fechaDesde', 'fechaHasta', 'motivo'];
  salarioColumns = ['salarioAnterior', 'salarioNuevo', 'moneda', 'fechaVigencia', 'motivo'];
  documentoColumns = ['tipo', 'nombreArchivo', 'vencimiento', 'observacion', 'acciones'];

  cargoHistoricos = new MatTableDataSource<FuncionarioCargoHistorico>([]);
  salarioHistoricos = new MatTableDataSource<FuncionarioSalarioHistorico>([]);
  documentos = new MatTableDataSource<FuncionarioDocumento>([]);

  constructor(
    private legajoService: LegajoService,
    private funcionarioService: FuncionarioService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    this.funcionarioService.onGetAllFuncionarios(0, 500).pipe(untilDestroyed(this))
      .subscribe((res: Funcionario[]) => {
        this.funcionarioOpciones = (res || []).map(f => ({
          id: f.id,
          label: f.persona?.nombre ? f.persona.nombre : (f.nickname ? f.nickname : '#' + f.id)
        }));
      });
  }

  onSeleccionar() {
    if (this.funcionarioControl.value == null) { return; }
    this.funcionarioService.onGetFuncionarioById(this.funcionarioControl.value)
      .pipe(untilDestroyed(this)).subscribe((f: Funcionario) => { this.funcionario = f; });
    this.recargar();
  }

  recargar() {
    const id = this.funcionarioControl.value;
    if (id == null) { return; }
    this.legajoService.onGetCargoHistoricos(id).pipe(untilDestroyed(this))
      .subscribe(res => { this.cargoHistoricos.data = res || []; });
    this.legajoService.onGetSalarioHistoricos(id).pipe(untilDestroyed(this))
      .subscribe(res => { this.salarioHistoricos.data = res || []; });
    this.legajoService.onGetDocumentos(id).pipe(untilDestroyed(this))
      .subscribe(res => { this.documentos.data = res || []; });
  }

  onCambiarCargo() {
    this.dialog.open(CambioCargoDialogComponent, {
      data: { funcionarioId: this.funcionario.id, cargoActualId: this.funcionario.cargo?.id }, width: '440px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) { this.funcionario = res; this.recargar(); } });
  }

  onCambiarSalario() {
    this.dialog.open(CambioSalarioDialogComponent, {
      data: { funcionarioId: this.funcionario.id, salarioActual: this.funcionario.sueldo }, width: '460px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) { this.funcionario = res; this.recargar(); } });
  }

  onEgresar() {
    this.dialog.open(EgresarFuncionarioDialogComponent, {
      data: { funcionarioId: this.funcionario.id, nombre: this.funcionario.persona?.nombre }, width: '440px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.funcionario = res;
        this.notificacion.notification$.next({ texto: 'Funcionario egresado', color: NotificacionColor.success, duracion: 3 });
      }
    });
  }

  onSubirDocumento() {
    this.dialog.open(SubirDocumentoDialogComponent, {
      data: { funcionarioId: this.funcionario.id }, width: '480px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.recargar(); });
  }

  onVerDocumento(doc: FuncionarioDocumento) {
    this.legajoService.onGetDocumentoContenido(doc.id).pipe(untilDestroyed(this)).subscribe((base64: string) => {
      if (!base64) {
        this.notificacion.notification$.next({ texto: 'No se pudo obtener el documento', color: NotificacionColor.warn, duracion: 3 });
        return;
      }
      const src = base64.startsWith('data:') ? base64 : 'data:' + (doc.mimeType || 'application/octet-stream') + ';base64,' + base64;
      const win = window.open();
      if (win) { win.document.write('<iframe src="' + src + '" frameborder="0" style="width:100%;height:100%"></iframe>'); }
    });
  }

  onAnularDocumento(doc: FuncionarioDocumento) {
    this.dialogosService.confirm(
      'Anular documento', '¿Anular el documento ' + (doc.tipo || '') + '?', null, null, true, 'Sí', null, 'No'
    ).pipe(untilDestroyed(this)).subscribe(r => {
      if (r === true) {
        this.legajoService.onAnularDocumento(doc.id).pipe(untilDestroyed(this))
          .subscribe(res => { if (res != null) this.recargar(); });
      }
    });
  }
}
