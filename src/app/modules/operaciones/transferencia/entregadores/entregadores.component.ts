import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { HojaRuta, Transferencia } from '../transferencia.model';
import { Persona } from '../../../personas/persona/persona.model';
import { EMPTY, Observable } from 'rxjs';
import { expand, finalize, reduce } from 'rxjs/operators';
import { PageInfo } from '../../../../app.component';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { UbicacionService } from '../../../../shared/services/ubicacion.service';
import { TransferenciaService } from '../transferencia.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { QrCodeComponent } from '../../../../shared/qr-code/qr-code.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'entregadores',
  templateUrl: './entregadores.component.html',
  styleUrls: ['./entregadores.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class EntregadoresComponent implements OnInit {

  private static readonly TAMANIO_PAGINA_TRANSFERENCIAS = 50;

  private readonly transferenciaService = inject(TransferenciaService);
  private readonly ubicacionService = inject(UbicacionService);
  private readonly notificacionService = inject(NotificacionSnackbarService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly dialog = inject(MatDialog);

  displayedColumns: string[] = ['id', 'chofer', 'vehiculo', 'fechaSalida', 'qr'];
  dataSource = new MatTableDataSource<HojaRuta>([]);
  isLoading = true;
  expandedElement: HojaRuta | null = null;
  transferenciasCache: Record<number, Transferencia[]> = {};
  cargandoTransferencias: Record<number, boolean> = {};

  // Paginación resuelta en el backend
  pageIndex = 0;
  pageSize = 15;
  totalElementos = 0;
  readonly pageSizeOptions: number[] = [15, 25, 50, 100];

  fechaInicioControl = new FormControl(new Date());
  fechaFinControl = new FormControl(new Date());
  searchControl = new FormControl('');

  ngOnInit(): void {
    this.buscarHojasRuta();
  }

  onFiltrar(): void {
    this.pageIndex = 0;
    this.buscarHojasRuta();
  }

  onResetFiltro(): void {
    this.searchControl.setValue('');
    this.fechaInicioControl.setValue(new Date());
    this.fechaFinControl.setValue(new Date());
    this.pageIndex = 0;
    this.buscarHojasRuta();
  }

  onCambiarPagina(evento: PageEvent): void {
    this.pageIndex = evento.pageIndex;
    this.pageSize = evento.pageSize;
    this.buscarHojasRuta();
  }

  onExpandRow(element: HojaRuta): void {
    this.expandedElement = this.expandedElement === element ? null : element;

    if (this.expandedElement && !this.transferenciasCache[element.id]) {
      this.cargarTransferencias(element.id);
    }
  }

  onScanQr(hojaRuta: HojaRuta): void {
    const enCache = this.transferenciasCache[hojaRuta.id];
    if (enCache) {
      this.generarYMostrarQr(hojaRuta, enCache);
      return;
    }

    this.cargandoTransferencias = { ...this.cargandoTransferencias, [hojaRuta.id]: true };
    this.todasLasTransferencias(hojaRuta.id)
      .pipe(
        untilDestroyed(this),
        finalize(() => {
          this.cargandoTransferencias = { ...this.cargandoTransferencias, [hojaRuta.id]: false };
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (transferencias) => {
          this.transferenciasCache = { ...this.transferenciasCache, [hojaRuta.id]: transferencias };
          this.generarYMostrarQr(hojaRuta, transferencias);
        },
        error: (err) => {
          console.error(`Error al cargar transferencias para hoja de ruta ${hojaRuta.id}:`, err);
          this.notificacionService.openWarn('Error de red: No se lograron cargar las transferencias del backend.');
        }
      });
  }

  /**
   * Consulta las hojas de ruta con el rango de fechas, el texto y la página resueltos
   * por el backend. El filtrado y la paginación ya no se hacen sobre el arreglo local.
   */
  buscarHojasRuta(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const inicio = this.inicioDelDia(this.fechaInicioControl.value);
    const fin = this.finDelDia(this.fechaFinControl.value);
    const texto = (this.searchControl.value || '').trim();

    this.transferenciaService
      .buscarHojasRutaPorFecha(inicio, fin, texto, this.pageIndex, this.pageSize)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (pagina: PageInfo<HojaRuta>) => {
          // El caché queda invalidado: las transferencias de una hoja pueden haber
          // cambiado desde la última consulta.
          this.transferenciasCache = {};
          this.expandedElement = null;
          this.dataSource.data = pagina?.getContent || [];
          this.totalElementos = pagina?.getTotalElements || 0;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error al cargar hojas de ruta:', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  cargarTransferencias(hojaRutaId: number): void {
    this.cargandoTransferencias = { ...this.cargandoTransferencias, [hojaRutaId]: true };
    this.todasLasTransferencias(hojaRutaId)
      .pipe(
        untilDestroyed(this),
        finalize(() => {
          this.cargandoTransferencias = { ...this.cargandoTransferencias, [hojaRutaId]: false };
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (transferencias) => {
          this.transferenciasCache = { ...this.transferenciasCache, [hojaRutaId]: transferencias };
        },
        error: (err) => {
          console.error(`Error al cargar transferencias para hoja de ruta ${hojaRutaId}:`, err);
        }
      });
  }

  /**
   * Trae todas las transferencias de la hoja de ruta recorriendo las páginas del backend.
   * Antes se pedía una sola página, por lo que el detalle y el manifiesto quedaban
   * truncados sin ningún aviso.
   */
  private todasLasTransferencias(hojaRutaId: number): Observable<Transferencia[]> {
    const size = EntregadoresComponent.TAMANIO_PAGINA_TRANSFERENCIAS;
    let pagina = 0;
    return this.transferenciaService.onGetTransferenciasPorHojaRuta(hojaRutaId, pagina, size)
      .pipe(
        expand(res => {
          if (res != null && res.length === size) {
            pagina++;
            return this.transferenciaService.onGetTransferenciasPorHojaRuta(hojaRutaId, pagina, size);
          }
          return EMPTY;
        }),
        reduce((acc: Transferencia[], res: Transferencia[]) => acc.concat(res || []), [])
      );
  }

  private inicioDelDia(fecha: Date): string {
    if (!fecha) return null;
    const d = new Date(fecha);
    d.setHours(0, 0, 0, 0);
    return dateToString(d);
  }

  private finDelDia(fecha: Date): string {
    if (!fecha) return null;
    const d = new Date(fecha);
    d.setHours(23, 59, 0, 0);
    return dateToString(d);
  }

  private generarYMostrarQr(hojaRuta: HojaRuta, transferencias: Transferencia[]): void {
    const idsTransf = transferencias.map(t => t.id).join(', ');
    const chofer = hojaRuta.chofer?.nombre || 'Desconocido';
    const acompList = hojaRuta.acompanantes && hojaRuta.acompanantes.length > 0
      ? hojaRuta.acompanantes.map((a: Persona) => a.nombre).join(', ')
      : 'Ninguno';

    // Una hoja de ruta puede agrupar transferencias de distintos orígenes: antes se
    // informaba solo el de la primera, que podía no ser el único.
    const origenes: string[] = [];
    transferencias.forEach(t => {
      const nombre = t.sucursalOrigen?.nombre;
      if (nombre && origenes.indexOf(nombre) === -1) {
        origenes.push(nombre);
      }
    });
    const origenStr = origenes.length > 0 ? origenes.join(', ') : 'Desconocida';

    const sucursalesMap = new Map<string, { destino: string, km: number }>();
    let maxKm = -1;
    let sucursalMayorKm = 'Ninguna';

    transferencias.forEach(t => {
      const km = this.kilometrosEntreSucursales(t);
      const sucDestinoStr = t.sucursalDestino?.nombre || 'Desconocida';

      if (!sucursalesMap.has(sucDestinoStr)) {
        sucursalesMap.set(sucDestinoStr, { destino: sucDestinoStr, km });
      }

      if (km > maxKm) {
        maxKm = km;
        sucursalMayorKm = sucDestinoStr;
      }
    });

    let sucursalesInfo = '';
    sucursalesMap.forEach(info => {
      sucursalesInfo += `- ${info.destino}: ${info.km} km\n`;
    });
    if (sucursalesInfo === '') {
      sucursalesInfo = '- Sin transferencias asignadas\n';
    }

    const cargaStr = idsTransf !== '' ? idsTransf : 'Sin transferencias asignadas';
    const mayorKmStr = maxKm >= 0 ? `\nSucursal mas lejana: ${sucursalMayorKm} (${maxKm} km)` : '';

    const customStr = `Chofer: ${chofer}\nAcompañantes: ${acompList}\nCarga: ${cargaStr}\nSaliendo desde: ${origenStr}\nA sucursales:\n${sucursalesInfo}`.trimEnd() + mayorKmStr;

    this.dialog.open(QrCodeComponent, {
      data: {
        nombre: 'Manifiesto',
        textoCustom: customStr,
        imprimir: false
      }
    });
  }

  private kilometrosEntreSucursales(transferencia: Transferencia): number {
    const locOrigen = transferencia.sucursalOrigen?.localizacion;
    const locDestino = transferencia.sucursalDestino?.localizacion;

    if (!locOrigen || !locDestino || !locOrigen.includes(',') || !locDestino.includes(',')) {
      return 0;
    }

    const [lat1, lon1] = locOrigen.split(',').map(v => parseFloat(v));
    const [lat2, lon2] = locDestino.split(',').map(v => parseFloat(v));
    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
      return 0;
    }

    const metros = this.ubicacionService.calcularDistanciaMetros(lat1, lon1, lat2, lon2);
    return Math.round(metros / 1000);
  }
}
