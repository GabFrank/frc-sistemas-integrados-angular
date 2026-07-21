import { Component, OnInit, Input } from '@angular/core';
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
import { LiquidacionFinalDialogComponent } from '../../liquidacion-final/liquidacion-final-dialog/liquidacion-final-dialog.component';
import { LegajoMetricaDialogComponent } from '../legajo-metrica-dialog/legajo-metrica-dialog.component';
import { DocumentoViewerDialogComponent } from '../documento-viewer-dialog/documento-viewer-dialog.component';

interface FuncionarioOpcion { id: number; label: string; }

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-legajo-funcionario',
  templateUrl: './legajo-funcionario.component.html',
  styleUrls: ['./legajo-funcionario.component.scss']
})
export class LegajoFuncionarioComponent implements OnInit {

  // Tab inyectado por TabContentComponent. Si se abre desde la lista de funcionarios
  // (acción de fila), viene con tabData.data.id = funcionario a mostrar.
  @Input() data: any;

  funcionarioControl = new FormControl(null);
  funcionarioOpciones: FuncionarioOpcion[] = [];
  funcionario: Funcionario = null;

  // Métricas del dashboard. PLACEHOLDER hasta que existan los módulos que las alimentan
  // (TODO-5 valoración, TODO-6 asistencia, TODO-7 metas/comisiones — ver plan de testeo RRHH).
  puntuacionFuncionario = 7.6;   // 1..10
  puntuacionAsistencia = 8.4;    // 1..10
  metasLogradas = 4;
  metasTotal = 11;

  antiguedadTexto = '—';   // calculado al cargar el funcionario (no en template, regla del proyecto)

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
    // El legajo se abre siempre apuntando a un funcionario (desde la lista de
    // funcionarios → acción de fila). Ya no hay selector interno.
    const preId = this.data?.tabData?.data?.id;
    if (preId != null) {
      this.funcionarioControl.setValue(preId);
      this.onSeleccionar();
    }
  }

  onSeleccionar() {
    if (this.funcionarioControl.value == null) { return; }
    this.funcionarioService.onGetFuncionarioById(this.funcionarioControl.value)
      .pipe(untilDestroyed(this)).subscribe((f: Funcionario) => {
        this.funcionario = f;
        this.antiguedadTexto = this.calcularAntiguedad(f?.fechaIngreso);
      });
    this.recargar();
  }

  private calcularAntiguedad(fechaIngreso: any): string {
    if (!fechaIngreso) { return '—'; }
    const ini = new Date(fechaIngreso);
    if (isNaN(ini.getTime())) { return '—'; }
    const hoy = new Date();
    let meses = (hoy.getFullYear() - ini.getFullYear()) * 12 + (hoy.getMonth() - ini.getMonth());
    if (hoy.getDate() < ini.getDate()) { meses--; }
    if (meses < 0) { return '—'; }
    const anios = Math.floor(meses / 12);
    const m = meses % 12;
    const partes = [];
    if (anios > 0) { partes.push(anios + (anios === 1 ? ' año' : ' años')); }
    partes.push(m + (m === 1 ? ' mes' : ' meses'));
    return partes.join(' ');
  }

  onVerPuntuacion() {
    this.dialog.open(LegajoMetricaDialogComponent, {
      data: { tipo: 'puntuacion', nombre: this.funcionario?.persona?.nombre }, width: '460px'
    });
  }

  onVerAsistencia() {
    this.dialog.open(LegajoMetricaDialogComponent, {
      data: { tipo: 'asistencia', nombre: this.funcionario?.persona?.nombre }, width: '460px'
    });
  }

  onVerMetas() {
    this.dialog.open(LegajoMetricaDialogComponent, {
      data: { tipo: 'metas', nombre: this.funcionario?.persona?.nombre }, width: '460px'
    });
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
      data: {
        funcionarioId: this.funcionario.id,
        cargoActualId: this.funcionario.cargo?.id,
        cargoActualNombre: this.funcionario.cargo?.nombre,
        salarioActual: this.funcionario.sueldo
      }, width: '460px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) { this.funcionario = res; this.antiguedadTexto = this.calcularAntiguedad(res?.fechaIngreso); this.recargar(); } });
  }

  onCambiarSalario() {
    this.dialog.open(CambioSalarioDialogComponent, {
      data: {
        funcionarioId: this.funcionario.id,
        salarioActual: this.funcionario.sueldo,
        cargoActual: this.funcionario.cargo?.nombre
      }, width: '520px', disableClose: true
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

  onLiquidacionFinal() {
    this.dialog.open(LiquidacionFinalDialogComponent, {
      data: { funcionarioId: this.funcionario.id, nombre: this.funcionario.persona?.nombre, monedaId: null },
      width: '720px', disableClose: false
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onSeleccionar(); });
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
      // window.open() está bloqueado en Electron; se muestra en un diálogo con iframe.
      this.dialog.open(DocumentoViewerDialogComponent, {
        data: { src, titulo: doc.tipo + (doc.nombreArchivo ? ' — ' + doc.nombreArchivo : '') },
        width: '80vw', maxWidth: '1000px'
      });
    });
  }

  onAnularDocumento(doc: FuncionarioDocumento) {
    this.dialogosService.confirm(
      'Anular documento', '¿Anular el documento ' + (doc.tipo || '') + '?', null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(r => {
      if (r === true) {
        this.legajoService.onAnularDocumento(doc.id).pipe(untilDestroyed(this))
          .subscribe(res => { if (res != null) this.recargar(); });
      }
    });
  }
}
