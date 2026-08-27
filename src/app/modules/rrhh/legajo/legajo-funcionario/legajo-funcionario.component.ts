import { Component, OnInit, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MainService } from '../../../../main.service';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';
import { FuncionarioService } from '../../../personas/funcionarios/funcionario.service';
import { stringToLocalDate } from '../../../../commons/core/utils/dateUtils';
import { LegajoService } from '../legajo.service';
import { FuncionarioCargoHistorico, FuncionarioSalarioHistorico, FuncionarioDocumento } from '../legajo.model';
import { CambioCargoDialogComponent } from '../cambio-cargo-dialog/cambio-cargo-dialog.component';
import { CambioSalarioDialogComponent } from '../cambio-salario-dialog/cambio-salario-dialog.component';
import { EgresarFuncionarioDialogComponent } from '../egresar-funcionario-dialog/egresar-funcionario-dialog.component';
import { RevertirEgresoDialogComponent } from '../revertir-egreso-dialog/revertir-egreso-dialog.component';
import { SubirDocumentoDialogComponent } from '../subir-documento-dialog/subir-documento-dialog.component';
import { LiquidacionFinalDialogComponent } from '../../liquidacion-final/liquidacion-final-dialog/liquidacion-final-dialog.component';
import { LiquidacionFinalGenerarDialogComponent } from '../../liquidacion-final/liquidacion-final-generar-dialog/liquidacion-final-generar-dialog.component';
import { PenalizacionService } from '../../penalizacion/penalizacion.service';
import { LiquidacionFinalService } from '../../liquidacion-final/liquidacion-final.service';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabService, TabData } from '../../../../layouts/tab/tab.service';
import { LegajoMetricaDialogComponent } from '../legajo-metrica-dialog/legajo-metrica-dialog.component';
import { DocumentoViewerDialogComponent } from '../documento-viewer-dialog/documento-viewer-dialog.component';


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
  funcionario: Funcionario = null;
  // Avatar de la cabecera: lo emite el tab "Información general" (documento FOTO_PERFIL).
  fotoPerfilSrc: string = null;

  // Métricas del dashboard. PLACEHOLDER hasta que existan los módulos que las alimentan
  // (TODO-5 valoración, TODO-6 asistencia, TODO-7 metas/comisiones — ver plan de testeo RRHH).
  puntuacionFuncionario = 7.6;   // 1..10
  puntuacionAsistencia = 8.4;    // 1..10
  metasLogradas = 4;
  metasTotal = 11;

  /**
   * Amonestaciones no anuladas del funcionario. A diferencia de los otros tres chips,
   * este NO es placeholder: sale del backend.
   */
  advertencias = 0;

  antiguedadTexto = '—';   // calculado al cargar el funcionario (no en template, regla del proyecto)

  cargoColumns = ['cargo', 'fechaDesde', 'fechaHasta', 'motivo'];
  salarioColumns = ['salarioAnterior', 'salarioNuevo', 'moneda', 'fechaVigencia', 'motivo'];
  documentoColumns = ['tipo', 'nombreArchivo', 'vencimiento', 'observacion', 'acciones'];

  cargoHistoricos = new MatTableDataSource<FuncionarioCargoHistorico>([]);
  salarioHistoricos = new MatTableDataSource<FuncionarioSalarioHistorico>([]);
  documentos = new MatTableDataSource<FuncionarioDocumento>([]);

  // Gating por rol (UX; el backend valida). ADMIN por rol o nickname.
  puedeGestionar = false;
  puedeCambiarSalario = false;
  puedeEgresar = false;
  puedeLiquidar = false;

  constructor(
    private legajoService: LegajoService,
    private funcionarioService: FuncionarioService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService,
    private tabService: TabService,
    private liquidacionFinalService: LiquidacionFinalService,
    private penalizacionService: PenalizacionService,
    public mainService: MainService
  ) { }

  ngOnInit(): void {
    this.puedeGestionar = this.mainService.tieneAlgunRol(['RRHH GESTIONAR']);
    this.puedeCambiarSalario = this.mainService.tieneAlgunRol(['RRHH GESTIONAR', 'RRHH CONFIG']);
    this.puedeEgresar = this.mainService.tieneAlgunRol(['RRHH GESTIONAR', 'RRHH APROBAR']);
    this.puedeLiquidar = this.mainService.tieneAlgunRol(['RRHH LIQUIDAR']);
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
    this.penalizacionService.onContarAdvertencias(this.funcionarioControl.value)
      .pipe(untilDestroyed(this)).subscribe(n => { this.advertencias = n ?? 0; });
    this.recargar();
  }

  /**
   * Se dispara cuando la pestaña "Información general" guarda el funcionario
   * (alta o edición). En alta, es la primera vez que hay un id: carga todo el
   * legajo. En edición, refresca la cabecera.
   */
  onGuardado(funcionarioId: number) {
    if (funcionarioId == null) { return; }
    this.funcionarioControl.setValue(funcionarioId);
    this.onSeleccionar();
  }

  private calcularAntiguedad(fechaIngreso: any): string {
    if (!fechaIngreso) { return '—'; }
    const ini = stringToLocalDate(fechaIngreso);
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

  /**
   * Deshace un egreso hecho por error. Mismo gating que egresar: quien puede sacar a
   * alguien es quien puede volver a meterlo.
   */
  onRevertirEgreso() {
    // El snapshot se pide ANTES de abrir: si existe, el diálogo precarga el crédito en
    // vez de pedirlo. Un egreso anterior al histórico devuelve null y se carga a mano.
    this.legajoService.onGetEgresoVigente(this.funcionario.id)
      .pipe(untilDestroyed(this)).subscribe(snap => this.abrirReversa(snap));
  }

  private abrirReversa(snap: any) {
    this.dialog.open(RevertirEgresoDialogComponent, {
      data: {
        funcionarioId: this.funcionario.id,
        nombre: this.funcionario.persona?.nombre,
        fechaEgreso: this.funcionario.fechaEgreso,
        motivoEgreso: this.funcionario.motivoEgreso,
        creditoActual: this.funcionario.credito,
        snapshot: snap || null
      }, width: '480px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.funcionario = res;
        this.notificacion.notification$.next({
          texto: 'Egreso revertido: el funcionario, su usuario y su cliente vuelven a estar activos',
          color: NotificacionColor.success, duracion: 4
        });
        this.recargar();
      }
    });
  }

  onLiquidacionFinal() {
    const nombre = this.funcionario.persona?.nombre || ('#' + this.funcionario.id);
    // Si ya hay un finiquito vigente, abre el tab directo; si no, primero el diálogo
    // de parámetros (motivo/fecha) y recién al generar se abre el tab con el detalle.
    this.liquidacionFinalService.onGetPorFuncionario(this.funcionario.id).pipe(untilDestroyed(this))
      .subscribe((res: any[]) => {
        const vigente = (res || []).find(l => l.estado !== 'ANULADA');
        if (vigente) { this.abrirTabFiniquito(nombre); return; }
        this.dialog.open(LiquidacionFinalGenerarDialogComponent, {
          data: { funcionarioId: this.funcionario.id, nombre, monedaId: null }, width: '640px', maxWidth: '95vw'
        }).afterClosed().pipe(untilDestroyed(this)).subscribe(generado => {
          if (generado != null) { this.abrirTabFiniquito(nombre); }
        });
      });
  }

  private abrirTabFiniquito(nombre: string) {
    this.tabService.addTab(new Tab(
      LiquidacionFinalDialogComponent,
      'Finiquito — ' + nombre,
      new TabData(this.funcionario.id, { funcionarioId: this.funcionario.id, nombre, monedaId: null }),
      null
    ));
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
