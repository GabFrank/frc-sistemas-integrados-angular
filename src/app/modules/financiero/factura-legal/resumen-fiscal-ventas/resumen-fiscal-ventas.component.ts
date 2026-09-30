import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  finalize,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
  tap,
  catchError,
} from "rxjs";
import { listarAnhosGrafico } from "../../../../commons/core/utils/dateUtils";
import { MESES_GRAFICO } from "../../../../shared/constants/grafico.constants";
import { Tab } from "../../../../layouts/tab/tab.model";
import { TabService } from "../../../../layouts/tab/tab.service";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { GraficoFiltroSucursalesMulti } from "../../../grafico/utils/grafico-filtro-sucursales-multi.helper";
import { ReporteService } from "../../../reportes/reporte.service";
import { ReportesComponent } from "../../../reportes/reportes/reportes.component";
import { ResumenFiscalVentas } from "./resumen-fiscal-ventas.model";
import { ResumenFiscalVentasService } from "./resumen-fiscal-ventas.service";

/**
 * Resumen de ventas del mes para el contador (Reportes y Análisis): exentas, gravadas 5 % y 10 %
 * (base sin IVA e IVA) y detalle por timbrado, en PDF. Solo datos: la declaración la arma el
 * contador. Todo el cálculo lo hace el central; la pantalla solo muestra y pide el PDF.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: "resumen-fiscal-ventas",
  templateUrl: "./resumen-fiscal-ventas.component.html",
  styleUrls: ["./resumen-fiscal-ventas.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumenFiscalVentasComponent implements OnInit {
  private resumenService = inject(ResumenFiscalVentasService);
  private sucursalService = inject(SucursalService);
  private reporteService = inject(ReporteService);
  private tabService = inject(TabService);
  private cdr = inject(ChangeDetectorRef);

  readonly filtroSucursales = new GraficoFiltroSucursalesMulti();
  readonly anhos: number[] = listarAnhosGrafico();
  readonly meses = MESES_GRAFICO;

  // Por defecto el mes anterior: es el que se declara.
  private readonly mesAnterior = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  anioControl = new FormControl<number>(this.mesAnterior.getFullYear());
  mesControl = new FormControl<number>(this.mesAnterior.getMonth() + 1);

  sucursales$: Observable<Sucursal[]>;
  resumen$: Observable<ResumenFiscalVentas | null>;

  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly imprimiendoSubject = new BehaviorSubject<boolean>(false);
  readonly cargando$ = this.cargandoSubject.asObservable();
  readonly imprimiendo$ = this.imprimiendoSubject.asObservable();


  ngOnInit(): void {
    this.sucursales$ = this.sucursalService.onGetAllSucursales(true).pipe(
      map((sucs) => (sucs || []).filter((s) => s.activo && s.id > 0 && s.id !== 999)),
      shareReplay(1)
    );

    this.resumen$ = combineLatest([
      this.anioControl.valueChanges.pipe(startWith(this.anioControl.value)),
      this.mesControl.valueChanges.pipe(startWith(this.mesControl.value)),
      this.filtroSucursales.control.valueChanges.pipe(
        startWith(this.filtroSucursales.control.value)
      ),
    ]).pipe(
      tap(() => this.cargandoSubject.next(true)),
      switchMap(([anio, mes, sucIds]) =>
        this.resumenService
          .obtenerResumen(anio, mes, this.filtroSucursales.normalizarIds(sucIds))
          .pipe(
            catchError(() => of(null)),
            finalize(() => this.cargandoSubject.next(false))
          )
      ),
      shareReplay(1),
      untilDestroyed(this)
    );
  }

  imprimirPdf(): void {
    if (this.imprimiendoSubject.value) {
      return;
    }
    this.imprimiendoSubject.next(true);
    const anio = this.anioControl.value;
    const mes = this.mesControl.value;
    this.resumenService
      .imprimir(anio, mes, this.filtroSucursales.normalizarIds())
      .pipe(
        finalize(() => {
          this.imprimiendoSubject.next(false);
          this.cdr.markForCheck();
        }),
        untilDestroyed(this)
      )
      .subscribe((pdf) => {
        if (pdf) {
          const nombreMes = this.meses.find((m) => m.valor === mes)?.nombre ?? mes;
          this.reporteService.onAdd(`Resumen fiscal ${nombreMes} ${anio}`, pdf);
          this.tabService.addTab(new Tab(ReportesComponent, "Reportes", null, null));
        }
      });
  }

  limpiarFiltros(): void {
    this.filtroSucursales.limpiar();
    this.anioControl.setValue(this.mesAnterior.getFullYear());
    this.mesControl.setValue(this.mesAnterior.getMonth() + 1);
  }
}
