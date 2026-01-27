import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TransferenciaService } from '../transferencia.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { HojaRuta, Transferencia } from '../transferencia.model';
import { finalize } from 'rxjs/operators';

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

  displayedColumns: string[] = ['id', 'chofer', 'vehiculo', 'fechaSalida', 'ubicacion'];
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
    private transferenciaService: TransferenciaService
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

  loadTransferencias(hojaRutaId: number): void {
    this.loadingTransferencias[hojaRutaId] = true;
    this.transferenciaService.onGetTransferenciasPorHojaRuta(hojaRutaId, 0, 20)
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
  onVerUbicacion(hojaRuta: HojaRuta): void {
    console.log('Ver ubicación para hoja de ruta:', hojaRuta.id);
  }
}
