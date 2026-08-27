import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Tab } from '../../../../../layouts/tab/tab.model';
import { TabData, TabService } from '../../../../../layouts/tab/tab.service';
import { RetiroVerificacionService } from '../retiro-verificacion.service';
import {
  CATEGORIA_LABEL, EstadoCasoRetiro, RetiroCaso, RetiroVerificacionDetalle, VEREDICTO_LABEL,
} from '../retiro-verificacion.model';
import { DialogosService } from '../../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../../notificacion-snackbar.service';
import { MainService } from '../../../../../main.service';
import { ROLES } from '../../../../personas/roles/roles.enum';
import { FormControl } from '@angular/forms';
import { Sucursal } from '../../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../../empresarial/sucursal/sucursal.service';
import { dateToString } from '../../../../../commons/core/utils/dateUtils';
import { DetalleCasoDialogComponent, DetalleCasoDialogData } from '../detalle-caso-dialog/detalle-caso-dialog.component';
import { ListVentaComponent } from '../../../../operaciones/venta/list-venta/list-venta.component';

/** Fila con los campos de display precalculados (no se llaman funciones desde el HTML). */
interface CasoRow extends RetiroCaso {
  _diferencias: string;
  _contadoPor: string;
  _chipColor: string;
  _chipBg: string;
  _chipLabel: string;
  _rapida: boolean;
  /** Veredicto ya traducido; vacío mientras el caso no se cerró con uno. */
  _veredicto: string;
  /** Lo tomé yo (o soy ADMIN): puedo cerrarlo. */
  _puedoCerrar: boolean;
  /** Resaltado momentáneo tras tomar el caso, para no perderlo de vista al cambiar de tab. */
  _resaltada?: boolean;
}

/**
 * Bandeja de casos de retiro.
 *
 * Existe porque el que recibe no investiga: tesorería cuenta, registra la diferencia y sigue
 * trabajando. Sin un lugar donde vivan los casos abiertos, la diferencia se registra y nadie
 * la mira nunca — que es exactamente lo que pasa hoy con la observación del retiro.
 *
 * Va en su propia entrada de menú y no dentro de una caja: quien investiga no es de tesorería
 * y no tiene por qué entrar a una caja para ver sus pendientes.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-retiro-casos',
  templateUrl: './list-retiro-casos.component.html',
  styleUrls: ['./list-retiro-casos.component.scss'],
})
export class ListRetiroCasosComponent implements OnInit {

  @Input() data: Tab;

  dataSource = new MatTableDataSource<CasoRow>([]);
  displayedColumns = ['estado', 'retiro', 'sucursal', 'diferencias', 'contadoPor', 'creadoEn', 'acciones'];

  tabs: { label: string; estado: EstadoCasoRetiro }[] = [
    { label: 'Abiertos', estado: EstadoCasoRetiro.ABIERTO },
    { label: 'En investigación', estado: EstadoCasoRetiro.EN_INVESTIGACION },
    { label: 'Resueltos', estado: EstadoCasoRetiro.RESUELTO },
    { label: 'Todos', estado: null },
  ];
  tabActivo = 0;

  // Filtros. El rango de fechas es sobre la apertura del caso, no sobre la fecha del retiro.
  sucursalControl = new FormControl(null);
  retiroControl = new FormControl(null);
  desdeControl = new FormControl(null);
  hastaControl = new FormControl(null);
  sucursalList: Sucursal[] = [];
  /** En investigación = asignados a mí; en resueltos = los que yo cerré. */
  soloMios = false;

  isLoading = false;
  pageIndex = 0;
  pageSize = 20;
  totalElements = 0;
  puedeGestionar = false;
  /** El ADMIN destraba casos de gente que ya no está; el resto cierra solo lo suyo. */
  esAdmin = false;

  constructor(
    private service: RetiroVerificacionService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private tabService: TabService,
    private notificacion: NotificacionSnackbarService,
    private sucursalService: SucursalService,
    public mainService: MainService,
  ) {}

  ngOnInit(): void {
    this.puedeGestionar = this.mainService.tieneAlgunRol([ROLES.TESORERIA_GESTIONAR]);
    this.esAdmin = this.mainService.tieneAlgunRol([ROLES.ADMIN]);
    this.sucursalService.onGetAllSucursales(true).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.sucursalList = res.filter(s => s.id != 0);
    });
    this.cargar();
  }

  cargar(resaltarId?: number) {
    this.isLoading = true;
    this.service.onGetCasos({
      estado: this.tabs[this.tabActivo].estado,
      sucursalId: this.sucursalControl.value?.id ?? null,
      retiroId: this.retiroControl.value ? Number(this.retiroControl.value) : null,
      desde: this.desdeControl.value ? dateToString(this.desdeControl.value) : null,
      hasta: this.hastaControl.value ? dateToString(this.hastaControl.value) : null,
      soloMios: this.soloMios,
    }, this.pageIndex, this.pageSize)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          this.isLoading = false;
          if (res == null) return;
          // Clonar antes de agregar props de display: Apollo congela los resultados.
          this.dataSource.data = (res.getContent || []).map(c => this.toRow(c));
          this.totalElements = res.getTotalElements || 0;
          if (resaltarId != null) this.resaltar(resaltarId);
        },
        error: () => { this.isLoading = false; },
      });
  }

  private toRow(c: RetiroCaso): CasoRow {
    const row = { ...c } as CasoRow;
    const detalles: RetiroVerificacionDetalle[] = c.verificacion?.detalles || [];
    // Solo las monedas que no cerraron: un retiro puede tener tres y diferir en una.
    row._diferencias = detalles
      .filter(d => Math.abs(d.diferencia || 0) > 0.005)
      .map(d => {
        const dec = d.moneda?.decimales != null ? d.moneda.decimales : 0;
        const monto = (d.diferencia || 0).toLocaleString('es-PY', { maximumFractionDigits: dec });
        const cat = d.categoria ? CATEGORIA_LABEL[d.categoria] : '';
        return `${monto} ${d.moneda?.simbolo || ''} (${cat})`;
      })
      .join(' · ') || '—';
    row._contadoPor = c.verificacion?.usuario?.persona?.nombre || '—';
    row._rapida = !!c.verificacion?.rapida;
    // Un caso resuelto sin veredicto es uno cerrado por anulación de la verificación, no por
    // investigación: se distingue en la lista en vez de mentir con una etiqueta.
    row._veredicto = c.veredicto ? VEREDICTO_LABEL[c.veredicto] : '';
    // Cerrar es firmar: solo el que tomó el caso, o un ADMIN que destraba.
    const yo = this.mainService.usuarioActual?.id;
    row._puedoCerrar = this.puedeGestionar
      && c.estado === EstadoCasoRetiro.EN_INVESTIGACION
      && (this.esAdmin || (!!yo && c.asignadoA?.id === yo));

    switch (c.estado) {
      case EstadoCasoRetiro.ABIERTO:
        row._chipLabel = 'Abierto';
        row._chipColor = '#ff8a80'; row._chipBg = 'rgba(239, 83, 80, 0.16)'; break;
      case EstadoCasoRetiro.EN_INVESTIGACION:
        row._chipLabel = 'En investigación';
        row._chipColor = '#ffb74d'; row._chipBg = 'rgba(255, 167, 38, 0.18)'; break;
      default:
        row._chipLabel = 'Resuelto';
        row._chipColor = '#81c784'; row._chipBg = 'rgba(102, 187, 106, 0.16)';
    }
    return row;
  }

  aplicarFiltros() {
    this.pageIndex = 0;
    this.cargar();
  }

  limpiarFiltros() {
    this.sucursalControl.reset();
    this.retiroControl.reset();
    this.desdeControl.reset();
    this.hastaControl.reset();
    this.soloMios = false;
    this.aplicarFiltros();
  }

  /** Resalta una fila unos segundos: al cambiar de tab, ubica el caso sin filtrar la lista. */
  private resaltar(casoId: number) {
    const fila = this.dataSource.data.find(f => f.id === casoId);
    if (!fila) return;
    fila._resaltada = true;
    setTimeout(() => fila._resaltada = false, 4000);
  }

  onSoloMios() {
    this.soloMios = !this.soloMios;
    this.pageIndex = 0;
    this.cargar();
  }

  onTab(i: number) {
    this.tabActivo = i;
    this.pageIndex = 0;
    this.cargar();
  }

  onPage(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.cargar();
  }

  /**
   * Toma el caso para investigarlo.
   *
   * El backend rechaza asignárselo a quien hizo la verificación: quien cuenta también puede
   * ser el problema, y esa es una de las hipótesis que el caso deja abiertas.
   */
  onTomar(row: CasoRow) {
    const usuarioId = this.mainService.usuarioActual?.id;
    if (!usuarioId) return;

    // El caso más común de rechazo se puede anticipar acá y explicarlo bien, en vez de
    // mandar la llamada y no poder mostrar el motivo: GenericCrudService.onSaveCustom deja
    // el observable colgado cuando el backend devuelve un error de negocio (ni next ni
    // error), así que un handler de error nunca se ejecuta. El backend igual lo valida.
    if (row.verificacion?.usuario?.id === usuarioId) {
      this.notificacion.notification$.next({
        texto: 'No podés investigar un retiro que vos mismo verificaste. Que lo tome otra persona.',
        color: NotificacionColor.warn, duracion: 6,
      });
      return;
    }

    this.service.onAsignarCaso(row.id, usuarioId).pipe(untilDestroyed(this)).subscribe(r => {
      if (r == null) return;
      this.notificacion.notification$.next({
        texto: `Caso del retiro #${row.retiroId} tomado`,
        color: NotificacionColor.success, duracion: 3,
      });
      // Se lo lleva a donde quedó el caso, resaltado, pero sin filtrar: ver el resto de lo
      // que tiene en curso es información útil, y un filtro que no pidió lo confundiría.
      this.tabActivo = 1;
      this.pageIndex = 0;
      this.cargar(row.id);
    });
  }

  /** Devuelve el caso a la bandeja de abiertos. */
  onSoltar(row: CasoRow) {
    this.dialogosService.confirm(
      'Soltar caso', `¿Devolver el caso del retiro #${row.retiroId} a los abiertos?`,
      'Queda disponible para que lo tome otra persona.', null, true, 'Sí, soltar', 'No',
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res !== true) return;
      this.service.onSoltarCaso(row.id).pipe(untilDestroyed(this)).subscribe(r => {
        if (r != null) this.cargar();
      });
    });
  }

  /**
   * Abre las ventas de la caja de la que salió el retiro.
   *
   * El diálogo resume la jornada en cinco líneas; esta pantalla tiene el movimiento venta por
   * venta, que es donde se ve si el faltante coincide con una operación puntual. Mismo destino
   * que ya usa la lista de retiros — no se inventa una pantalla nueva.
   */
  onIrAVentas(row: CasoRow) {
    const caja = row.retiro?.cajaSalida;
    if (!caja?.id) {
      this.notificacion.notification$.next({
        texto: 'Este retiro no tiene caja de origen registrada',
        color: NotificacionColor.warn, duracion: 4,
      });
      return;
    }
    this.tabService.addTab(new Tab(
      ListVentaComponent, 'Ventas de la caja ' + caja.id,
      new TabData(null, caja), ListRetiroCasosComponent,
    ));
  }

  /** El ojo consulta; Resolver cierra. Mismo diálogo, distinto permiso. */
  onVerDetalle(row: CasoRow, paraResolver = false) {
    const data: DetalleCasoDialogData = {
      caso: row,
      puedeResolver: paraResolver && row._puedoCerrar,
    };
    this.dialog.open(DetalleCasoDialogComponent, {
      width: '65vw', height: '70vh', maxWidth: '96vw', data,
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(r => { if (r) this.cargar(); });
  }
}
