import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormControl, ValidationErrors, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabService } from '../../../../layouts/tab/tab.service';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { ReporteService } from '../../../reportes/reporte.service';
import { ReportesComponent } from '../../../reportes/reportes/reportes.component';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { CajaVirtual } from '../../caja-virtual/caja-virtual.model';
import { CajaVirtualService } from '../../caja-virtual/caja-virtual.service';
import { LiquidacionSueldo, LiquidacionItem } from '../liquidacion.model';
import { LiquidacionService } from '../liquidacion.service';
import { ImpresionService } from '../../../../shared/components/imprimir/impresion.service';

/** "2026-11", "11/2026" o "11-2026" → "2026-11"; cualquier otra cosa (o vacío) → null. */
export function normalizarPeriodo(texto: string): string {
  const t = (texto || '').trim();
  let m = /^(\d{4})[-/](\d{1,2})$/.exec(t);
  let anio: number, mes: number;
  if (m) { anio = +m[1]; mes = +m[2]; } else {
    m = /^(\d{1,2})[-/](\d{4})$/.exec(t);
    if (!m) { return null; }
    mes = +m[1]; anio = +m[2];
  }
  if (mes < 1 || mes > 12) { return null; }
  return anio + '-' + String(mes).padStart(2, '0');
}

/** Vacío vale (se usa el periodo de la liquidación); si hay texto, tiene que ser un periodo. */
function periodoValido(c: AbstractControl): ValidationErrors | null {
  const v = (c.value || '').trim();
  return v === '' || normalizarPeriodo(v) != null ? null : { periodo: true };
}

/**
 * Detalle de liquidación. Se abre en una TAB (no en diálogo) para poder comparar
 * varias liquidaciones abiertas a la vez. Recibe el id vía TabData y carga el resto.
 */
@UntilDestroy()
@Component({
  selector: 'app-liquidacion-detalle-dialog',
  templateUrl: './liquidacion-detalle-dialog.component.html',
  styleUrls: ['./liquidacion-detalle-dialog.component.scss']
})
export class LiquidacionDetalleDialogComponent implements OnInit {

  /** Tab completo inyectado por TabContentComponent. */
  @Input() data: Tab;

  liq: LiquidacionSueldo;
  itemsColumns = ['descripcion', 'tipo', 'monto', 'origen', 'acciones'];
  items = new MatTableDataSource<LiquidacionItem>([]);

  cajas: CajaVirtual[] = [];
  cajaControl = new FormControl(null);

  mostrarAgregar = false;
  editandoItemId: number = null;   // null = alta; id = edición
  descripcionControl = new FormControl(null);
  montoControl = new FormControl(0);
  tipoControl = new FormControl('DESCUENTO');
  tipoOptions = ['HABER', 'DESCUENTO'];
  /**
   * Periodo en que se aplica el item que se carga, tipeado (quien liquida lo prefiere a elegirlo
   * de una lista): el de esta liquidacion (item manual, como siempre) o uno posterior, hasta 12
   * meses (queda programado y entra solo en esa liquidacion). Acepta 2026-11, 11/2026 y 11-2026.
   */
  periodoControl = new FormControl(null, [periodoValido]);

  /** Items programados PENDIENTES del funcionario (para cualquier periodo). */
  programados = new MatTableDataSource<any>([]);
  programadosColumns = ['periodo', 'descripcion', 'tipo', 'monto', 'estado', 'acciones'];

  /**
   * Operaciones elegibles al cargar un item a mano. El backend deriva el signo de
   * esHaber del catalogo, asi que la UI no pide el tipo por separado: elegir
   * "Bonificacion" ya implica HABER y "Faltante de caja" ya implica DESCUENTO.
   */
  conceptos: any[] = [];
  /**
   * Si el catalogo no cargo (query fallida o instancia sin seedear), se vuelve a pedir el
   * tipo a mano. Sin esto no habria forma de crear un item HABER: el selector de tipo esta
   * oculto en alta y quedaria clavado en DESCUENTO.
   */
  sinCatalogo = false;
  conceptoControl = new FormControl(null, [Validators.required]);
  /**
   * Operación, escrita o elegida de la lista: tipear el número fijo del catálogo (1 = AJUSTE (HABER))
   * o parte del nombre filtra la lista; Enter toma la primera. Lo que se elige queda en conceptoControl.
   */
  operacionControl = new FormControl<any>('');
  /** Precalculados para el template (el repo no llama funciones desde el HTML). */
  conceptosFiltrados: any[] = [];
  operacionInexistente = false;
  /** Cómo se muestra la operación elegida en el input. */
  displayOperacion = (c: any): string => c && typeof c === 'object'
    ? (c.numero != null ? c.numero + ' · ' : '') + c.descripcion
    : (c || '');
  /** Precalculado para el template (el repo no llama funciones desde el HTML). */
  signoConcepto = '';

  // Gating por rol (UX; el backend valida de todas formas). ADMIN por rol o nickname.
  puedeLiquidar = false;
  puedeAprobar = false;
  puedePagar = false;

  /**
   * Neto negativo = los descuentos superan a los haberes, o sea que el funcionario le debe a
   * la empresa: no hay nada que pagarle y el backend rechaza el pago. Se calcula al cargar la
   * liquidacion y no en el HTML, por la regla de no llamar funciones desde el template.
   */
  netoNegativo = false;

  constructor(
    private tabService: TabService,
    private liquidacionService: LiquidacionService,
    private cajaVirtualService: CajaVirtualService,
    private dialogosService: DialogosService,
    private reporteService: ReporteService,
    public mainService: MainService,
    private notificacion: NotificacionSnackbarService,
    private impresionService: ImpresionService
  ) { }

  ngOnInit(): void {
    const roles = this.mainService.usuarioActual?.roles || [];
    const esAdmin = this.mainService.usuarioActual?.nickname === 'ADMIN' || roles.includes('ADMIN');
    this.liquidacionService.onGetConceptosParaItemManual()
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.conceptos = res || [];
        this.conceptosFiltrados = this.conceptos;
        this.sinCatalogo = this.conceptos.length === 0;
        if (this.sinCatalogo) { this.conceptoControl.clearValidators(); }
        this.conceptoControl.updateValueAndValidity();
      });
    this.puedeLiquidar = esAdmin || roles.includes('RRHH LIQUIDAR');
    this.puedeAprobar = esAdmin || roles.includes('RRHH APROBAR');
    this.puedePagar = esAdmin || roles.includes('RRHH PAGAR');
    this.operacionControl.valueChanges.pipe(untilDestroyed(this)).subscribe(v => this.filtrarOperaciones(v));
    const id = this.data?.tabData?.id ?? this.data?.tabData?.data?.id;
    if (id != null) {
      this.recargar(id);
    }
    this.cajaVirtualService.onGetActivas()
      .pipe(untilDestroyed(this))
      .subscribe((res: CajaVirtual[]) => { this.cajas = (res || []).filter(c => c.tipo === 'CAJA_MAYOR'); });
  }

  /** Trae cabecera + items desde el backend por id. */
  private recargar(id?: number) {
    const liqId = id ?? this.liq?.id;
    if (liqId == null) { return; }
    this.liquidacionService.onGetById(liqId).pipe(untilDestroyed(this)).subscribe((res: LiquidacionSueldo) => {
      if (res != null) {
        this.liq = res;
        this.netoNegativo = (this.liq?.totalNeto ?? 0) < 0;
        this.cargarProgramados();
      }
    });
    this.cargarItems(liqId);
  }

  private cargarItems(id?: number) {
    const liqId = id ?? this.liq?.id;
    if (liqId == null) { return; }
    this.liquidacionService.onGetItems(liqId)
      .pipe(untilDestroyed(this)).subscribe(res => { this.items.data = res || []; });
  }


  private cargarProgramados() {
    const funcionarioId = this.liq?.funcionario?.id;
    if (funcionarioId == null) { return; }
    this.liquidacionService.onGetItemsProgramados(funcionarioId, 'PENDIENTE')
      .pipe(untilDestroyed(this)).subscribe({ next: res => { this.programados.data = res || []; }, error: () => {} });
  }

  onAnularProgramado(p: any) {
    this.dialogosService.confirm(
      'Anular item programado',
      '¿Anular "' + (p.descripcion || '') + '" programado para ' + p.periodo + '?',
      'Si ya está en el borrador de ese periodo, se saca de ahí.', null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(r => {
      if (r === true) {
        this.liquidacionService.onAnularItemProgramado(p.id).pipe(untilDestroyed(this))
          .subscribe({ next: res => { if (res != null) { this.recargar(); } }, error: () => {} });
      }
    });
  }

  private aplicar(res: any) {
    if (res != null) {
      this.liq = res;
      this.netoNegativo = (this.liq?.totalNeto ?? 0) < 0;
      this.cargarItems();
    }
  }

  // En todas las acciones de este diálogo, el aviso de error (negocio o red) ya lo muestra
  // GenericCrudService.onSaveCustom: el `error` solo evita la excepción no capturada.
  onRegenerar() {
    this.liquidacionService.onGenerarBorrador(this.liq.funcionario?.id, this.liq.periodo, this.liq.moneda?.id)
      .pipe(untilDestroyed(this)).subscribe({ next: res => this.aplicar(res), error: () => {} });
  }

  /** Abre el panel en modo edición con los valores del item (todo es negociable). */
  onEditarItemInit(it: LiquidacionItem) {
    this.editandoItemId = it.id;
    this.descripcionControl.setValue(it.descripcion);
    this.montoControl.setValue(it.monto);
    this.tipoControl.setValue(it.tipo);
    this.mostrarAgregar = true;
  }

  /** Guarda el panel: edición si hay editandoItemId, alta si no. */
  onGuardarItem() {
    if (this.montoControl.value == null || this.montoControl.value < 0) { return; }
    // En alta, la operacion define el signo. Sin ella el backend cae al camino viejo y
    // confia en el tipo que mande el cliente, que en alta esta clavado en DESCUENTO: un
    // bono cargado sin elegir operacion se restaria del sueldo en vez de sumarse.
    if (this.editandoItemId == null && !this.sinCatalogo && this.conceptoControl.value == null) {
      this.notificacion.notification$.next({
        texto: 'Elegí la operación: define si el ítem suma o resta',
        color: NotificacionColor.warn, duracion: 4
      });
      return;
    }
    // Otro periodo: el item queda programado y entra solo en la liquidacion de ese mes. Vacio = el de
    // esta liquidacion. El rango (posterior y hasta 12 meses) lo valida el backend con un mensaje claro.
    if (this.editandoItemId == null && this.periodoControl.invalid) {
      this.notificacion.notification$.next({
        texto: 'Periodo inválido: escribilo como 2026-11 o 11/2026',
        color: NotificacionColor.warn, duracion: 4
      });
      return;
    }
    const periodo = normalizarPeriodo(this.periodoControl.value) ?? this.liq.periodo;
    const programar = this.editandoItemId == null && periodo !== this.liq.periodo;
    const obs = this.editandoItemId != null
      ? this.liquidacionService.onEditarItem(this.editandoItemId, this.descripcionControl.value,
          this.montoControl.value, this.tipoControl.value, this.mainService.usuarioActual?.id)
      : programar
        ? this.liquidacionService.onProgramarItem(this.liq.id, periodo, this.descripcionControl.value,
            this.montoControl.value, this.tipoControl.value, this.conceptoControl.value)
        : this.liquidacionService.onAgregarItem(this.liq.id, this.descripcionControl.value,
            this.montoControl.value, this.tipoControl.value, this.conceptoControl.value);
    obs.pipe(untilDestroyed(this)).subscribe({
      next: res => {
        if (res != null) {
          if (programar) {
            this.notificacion.notification$.next({
              texto: 'Programado: se aplicará en la liquidación de ' + periodo,
              color: NotificacionColor.success, duracion: 4
            });
          }
          this.editandoItemId = null;
          this.descripcionControl.reset(); this.montoControl.setValue(0);
          this.conceptoControl.reset(); this.signoConcepto = ''; this.mostrarAgregar = false;
          this.limpiarOperacion();
          this.recargar();
        }
      },
      error: () => {}
    });
  }

  /**
   * Número: primero la operación con ese número (queda elegida), después las que empiezan igual (1 → 10…).
   * Texto: las que lo contienen en el nombre; queda elegida si el nombre coincide entero.
   * Un objeto es una opción elegida de la lista.
   */
  private filtrarOperaciones(valor: any) {
    if (valor && typeof valor === 'object') {
      this.conceptosFiltrados = this.conceptos;
      this.elegirOperacion(valor);
      return;
    }
    const t = (valor || '').toString().trim().toUpperCase();
    if (!t) {
      this.conceptosFiltrados = this.conceptos;
      this.elegirOperacion(null);
      return;
    }
    let elegida = null;
    if (/^\d+$/.test(t)) {
      const exacta = this.conceptos.filter(c => c.numero === +t);
      const empiezan = this.conceptos.filter(c => c.numero != null && c.numero !== +t && String(c.numero).startsWith(t));
      this.conceptosFiltrados = [...exacta, ...empiezan];
      elegida = exacta[0] ?? null;
    } else {
      this.conceptosFiltrados = this.conceptos.filter(c => (c.descripcion || '').toUpperCase().includes(t));
      elegida = this.conceptosFiltrados.find(c => (c.descripcion || '').toUpperCase() === t) ?? null;
    }
    this.elegirOperacion(elegida, this.conceptosFiltrados.length === 0);
  }

  /** Al salir del campo: si lo escrito deja una sola opción, se elige esa. */
  onOperacionBlur() {
    if (this.conceptoControl.value == null && this.conceptosFiltrados.length === 1
        && typeof this.operacionControl.value === 'string' && this.operacionControl.value.trim() !== '') {
      this.operacionControl.setValue(this.conceptosFiltrados[0]);
    }
  }

  private elegirOperacion(c: any, inexistente = false) {
    this.conceptoControl.setValue(c ? c.id : null);
    this.signoConcepto = c ? (c.esHaber ? 'Suma al total (HABER)' : 'Resta del total (DESCUENTO)') : '';
    this.operacionInexistente = inexistente;
  }

  private limpiarOperacion() {
    this.operacionControl.setValue('', { emitEvent: false });
    this.conceptosFiltrados = this.conceptos;
    this.operacionInexistente = false;
  }

  onEliminarItem(it: LiquidacionItem) {
    // Los items automaticos tambien se pueden eliminar (el backend nunca lo impidio,
    // solo exige BORRADOR). Ojo: "Regenerar" los vuelve a crear, porque generarBorrador
    // solo preserva los manuales — igual que ya pasa con la edicion de un automatico.
    const aviso = it.manual
      ? null
      : 'Es un item automatico: si volvés a generar el borrador, se recalcula y reaparece.';
    this.dialogosService.confirm(
      'Eliminar item',
      '¿Eliminar "' + (it.descripcion || '') + '" de la liquidación?',
      aviso, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(r => {
      if (r === true) {
        this.liquidacionService.onEliminarItem(it.id)
          .pipe(untilDestroyed(this))
          .subscribe({ next: res => { if (res != null) { this.recargar(); } }, error: () => {} });
      }
    });
  }

  onAprobar() {
    this.liquidacionService.onAprobar(this.liq.id, this.mainService.usuarioActual?.id)
      .pipe(untilDestroyed(this)).subscribe({ next: res => this.aplicar(res), error: () => {} });
  }

  onVolverBorrador() {
    this.liquidacionService.onVolverBorrador(this.liq.id)
      .pipe(untilDestroyed(this)).subscribe({ next: res => this.aplicar(res), error: () => {} });
  }

  onPagar() {
    if (this.cajaControl.value == null) {
      this.notificacion.notification$.next({ texto: 'Seleccione la Caja Mayor', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    this.dialogosService.confirm(
      'Pagar liquidación',
      '¿Pagar el neto de ' + (this.liq.totalNeto || 0) + ' desde la Caja Mayor?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(r => {
      if (r === true) {
        this.liquidacionService.onPagar(this.liq.id, this.cajaControl.value)
          .pipe(untilDestroyed(this)).subscribe({ next: res => this.aplicar(res), error: () => {} });
      }
    });
  }

  onAnular() {
    this.dialogosService.confirm(
      'Anular liquidación',
      '¿Anular esta liquidación pagada? Se generará el contra-asiento y se revertirán los efectos.',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(r => {
      if (r === true) {
        this.liquidacionService.onAnular(this.liq.id)
          .pipe(untilDestroyed(this)).subscribe({ next: res => this.aplicar(res), error: () => {} });
      }
    });
  }

  onImprimirRecibo() {
    this.liquidacionService.onImprimirRecibo(this.liq.id).pipe(untilDestroyed(this)).subscribe((base64: string) => {
      if (!base64) {
        this.notificacion.notification$.next({ texto: 'No se pudo generar el recibo', color: NotificacionColor.warn, duracion: 3 });
        return;
      }
      // Todos los PDF se ven en el visor integrado (tab "Reportes"), no en window.open.
      this.reporteService.onAdd(
        'Recibo ' + this.liq.periodo + ' - ' + (this.liq.funcionario?.persona?.nombre || this.liq.id), base64);
      this.tabService.addTab(new Tab(ReportesComponent, 'Reportes', null, null));
    });
  }

  /** Recibo de un solo item: PDF o ticket, con el dialogo oficial de impresion. */
  onReciboItem(it: LiquidacionItem) {
    this.impresionService.imprimir(
      'Recibo ' + (it.descripcion || it.codigo || it.id) + ' - ' + (this.liq.funcionario?.persona?.nombre || this.liq.id),
      (anchoMm, escpos) => this.liquidacionService.onImprimirReciboItem(it.id, anchoMm, escpos));
  }

  onToggleAgregar() {
    this.mostrarAgregar = !this.mostrarAgregar;
    if (!this.mostrarAgregar) { this.editandoItemId = null; this.descripcionControl.reset(); this.montoControl.setValue(0); }
    else { this.editandoItemId = null; this.descripcionControl.reset(); this.montoControl.setValue(0);
      this.tipoControl.setValue('DESCUENTO'); this.conceptoControl.reset(); this.signoConcepto = '';
      this.limpiarOperacion();
      this.periodoControl.setValue(this.liq?.periodo); }
  }

  onCerrar() {
    // Cierra esta tab. El titulo se arma igual que al abrirla desde la lista.
    if (this.liq != null) {
      const idx = this.tabService.getIndexByName('Liquidación ' + this.liq.id);
      if (idx != null && idx > -1) { this.tabService.removeTab(idx); }
    }
  }
}
