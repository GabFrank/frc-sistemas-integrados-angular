import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { HojaRuta, Transferencia } from '../transferencia.model';
import { EMPTY, Observable } from 'rxjs';
import { expand, finalize, reduce } from 'rxjs/operators';
import { UbicacionService } from '../../../../shared/services/ubicacion.service';
import { TransferenciaService } from '../transferencia.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { QrCodeComponent } from '../../../../shared/qr-code/qr-code.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'entregadores',
  templateUrl: './entregadores.component.html',
  styleUrls: ['./entregadores.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class EntregadoresComponent implements OnInit, AfterViewInit {

  private static readonly TRANSFERENCIAS_PAGE_SIZE = 50;

  displayedColumns: string[] = ['id', 'chofer', 'vehiculo', 'fechaSalida', 'qr'];
  dataSource = new MatTableDataSource<HojaRuta>([]);
  isLoading = true;
  expandedElement: HojaRuta | null;
  transferenciasCache: { [key: number]: Transferencia[] } = {};
  loadingTransferencias: { [key: number]: boolean } = {};
  @ViewChild(MatPaginator) paginator: MatPaginator;

  fechaInicioControl = new FormControl(new Date());
  fechaFinControl = new FormControl(new Date());

  searchControl = new FormControl('');

  constructor(
    private transferenciaService: TransferenciaService,
    public dialog: MatDialog,
    private ubicacionService: UbicacionService,
    private notificacionService: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    this.dataSource.filterPredicate = (data: HojaRuta, filter: string) => {
      const dataStr = (
        (data.chofer?.nombre || '') +
        (data.vehiculo?.chapa || '') +
        (data.vehiculo?.modelo?.descripcion || '')
      ).toLowerCase();
      return dataStr.indexOf(filter) !== -1;
    };

    this.searchControl.valueChanges.pipe(untilDestroyed(this)).subscribe(value => {
      this.dataSource.filter = value.trim().toLowerCase();
    })

    this.loadHojasRuta();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  loadHojasRuta(): void {
    this.isLoading = true;
    const inicioInfo = this.fechaInicioControl.value;
    const finInfo = this.fechaFinControl.value;

    const formatDate = (date: Date) => {
      if (!date) return null;
      const d = new Date(date);
      let month = '' + (d.getMonth() + 1);
      let day = '' + d.getDate();
      const year = d.getFullYear();

      if (month.length < 2) month = '0' + month;
      if (day.length < 2) day = '0' + day;

      return [year, month, day].join('-');
    };

    const inicio = formatDate(inicioInfo);
    const fin = formatDate(finInfo);

    this.transferenciaService.onGetHojaRutaPorFecha(inicio, fin)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (hojasRuta) => {
          // El cache queda invalidado: las transferencias de una hoja pueden haber
          // cambiado desde la ultima consulta.
          this.transferenciasCache = {};
          this.expandedElement = null;
          this.dataSource.data = hojasRuta || [];
          this.paginator?.firstPage();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error al cargar hojas de ruta:', err);
          this.isLoading = false;
        }
      });
  }

  onFiltrar(): void {
    this.loadHojasRuta();
  }

  onResetFiltro(): void {
    this.searchControl.setValue('');
    this.fechaInicioControl.setValue(new Date());
    this.fechaFinControl.setValue(new Date());
    this.loadHojasRuta();
  }

  onExpandRow(element: HojaRuta): void {
    this.expandedElement = this.expandedElement === element ? null : element;

    if (this.expandedElement && !this.transferenciasCache[element.id]) {
      this.loadTransferencias(element.id);
    }
  }

  /**
   * Trae todas las transferencias de la hoja de ruta recorriendo las paginas del backend.
   * Antes se pedia una sola pagina, por lo que el detalle y el manifiesto quedaban
   * truncados sin ningun aviso.
   */
  private getTodasLasTransferencias(hojaRutaId: number): Observable<Transferencia[]> {
    const size = EntregadoresComponent.TRANSFERENCIAS_PAGE_SIZE;
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

  loadTransferencias(hojaRutaId: number): void {
    this.loadingTransferencias[hojaRutaId] = true;
    this.getTodasLasTransferencias(hojaRutaId)
      .pipe(
        untilDestroyed(this),
        finalize(() => {
          this.loadingTransferencias[hojaRutaId] = false;
          this.loadingTransferencias = { ...this.loadingTransferencias };
        })
      )
      .subscribe({
        next: (transferencias) => {
          this.transferenciasCache[hojaRutaId] = transferencias;
        },
        error: (err) => {
          console.error(`Error al cargar transferencias para hoja de ruta ${hojaRutaId}:`, err);
        }
      });
  }

  onScanQr(hojaRuta: HojaRuta): void {
    if (this.transferenciasCache[hojaRuta.id]) {
      this.generarYMostrarQr(hojaRuta, this.transferenciasCache[hojaRuta.id]);
    } else {
      this.loadingTransferencias[hojaRuta.id] = true;
      this.getTodasLasTransferencias(hojaRuta.id)
        .pipe(
          untilDestroyed(this),
          finalize(() => this.loadingTransferencias[hojaRuta.id] = false)
        )
        .subscribe({
          next: (transferencias) => {
            this.transferenciasCache[hojaRuta.id] = transferencias;
            this.generarYMostrarQr(hojaRuta, transferencias);
          },
          error: (err) => {
            console.error(`Error al cargar transferencias para hoja de ruta ${hojaRuta.id}:`, err);
            this.notificacionService.openWarn('Error de red: No se lograron cargar las transferencias del backend.');
          }
        });
    }
  }

  private generarYMostrarQr(hojaRuta: HojaRuta, transferencias: Transferencia[]): void {
    const idsTransf = transferencias.map(t => t.id).join(', ');
    const chofer = hojaRuta.chofer?.nombre || 'Desconocido';
    const acompList = hojaRuta.acompanantes && hojaRuta.acompanantes.length > 0
      ? hojaRuta.acompanantes.map((a: any) => a.nombre).join(', ')
      : 'Ninguno';

    // Una hoja de ruta puede agrupar transferencias de distintos origenes: antes se
    // informaba solo el de la primera, que podia no ser el unico.
    const origenes: string[] = [];
    transferencias.forEach(t => {
      const nombre = t.sucursalOrigen?.nombre;
      if (nombre && origenes.indexOf(nombre) === -1) {
        origenes.push(nombre);
      }
    });
    const origenStr = origenes.length > 0 ? origenes.join(', ') : 'Desconocida';

    const sucursalesMap = new Map<string, {destino: string, km: number}>();
    let maxKm = -1;
    let sucursalMayorKm = 'Ninguna';

    transferencias.forEach(t => {
      let km = 0;
      let locOrigen = t.sucursalOrigen?.localizacion;
      let locDestino = t.sucursalDestino?.localizacion;

      if (locOrigen && locDestino && locOrigen.includes(',') && locDestino.includes(',')) {
        let [lat1, lon1] = locOrigen.split(',').map(v => parseFloat(v));
        let [lat2, lon2] = locDestino.split(',').map(v => parseFloat(v));
        if (!isNaN(lat1) && !isNaN(lon1) && !isNaN(lat2) && !isNaN(lon2)) {
          let metros = this.ubicacionService.calcularDistanciaMetros(lat1, lon1, lat2, lon2);
          km = Math.round(metros / 1000);
        }
      }

      const sucDestinoStr = t.sucursalDestino?.nombre || 'Desconocida';
      const key = sucDestinoStr;

      if (!sucursalesMap.has(key)) {
        sucursalesMap.set(key, { destino: sucDestinoStr, km });
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

    let customStr = `Chofer: ${chofer}\nAcompañantes: ${acompList}\nCarga: ${cargaStr}\nSaliendo desde: ${origenStr}\nA sucursales:\n${sucursalesInfo}`.trimEnd() + mayorKmStr;

    this.dialog.open(QrCodeComponent, {
      data: {
        nombre: "Manifiesto",
        textoCustom: customStr,
        imprimir: false
      }
    });
  }
}
