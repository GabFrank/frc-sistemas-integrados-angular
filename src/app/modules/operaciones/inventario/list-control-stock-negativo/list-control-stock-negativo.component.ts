import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { of } from "rxjs";
import { catchError, finalize } from "rxjs/operators";

import { dateToString } from "../../../../commons/core/utils/dateUtils";
import { Tab } from "../../../../layouts/tab/tab.model";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { ControlStockNegativo, ControlStockNegativoFiltros, FiltroStockControl, TipoControlStock } from "../control-stock-negativo.model";
import { ControlStockNegativoGQL } from "../graphql/controlStockNegativo.gql";

/**
 * Control de stock negativo: productos que salieron por venta o transferencia cuando su stock en
 * la sucursal ya era 0 o negativo. Solo lectura; los registros los crea el central.
 */
@UntilDestroy()
@Component({
  selector: "app-list-control-stock-negativo",
  templateUrl: "./list-control-stock-negativo.component.html",
  styleUrls: ["./list-control-stock-negativo.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListControlStockNegativoComponent implements OnInit {
  @Input() data: Tab;

  dataSource = new MatTableDataSource<ControlStockNegativo>([]);
  fechaFormGroup = new FormGroup({
    inicio: new FormControl<Date | null>(null),
    fin: new FormControl<Date | null>(null),
  });
  sucursalControl = new FormControl<Sucursal | null>(null);
  tipoControl = new FormControl<TipoControlStock | null>(null);
  textoControl = new FormControl<string>("");
  stockControl = new FormControl<FiltroStockControl | null>(null);

  sucursalList: Sucursal[] = [];
  readonly tipoOpciones: { value: TipoControlStock; label: string }[] = [
    { value: "VENTA", label: "Venta" },
    { value: "TRANSFERENCIA", label: "Transferencia" },
  ];
  readonly stockOpciones: { value: FiltroStockControl; label: string }[] = [
    { value: "CERO", label: "Stock 0" },
    { value: "NEGATIVO", label: "Stock negativo" },
  ];
  readonly displayedColumns: string[] = [
    "fecha", "sucursal", "tipo", "producto", "cantidad", "stockPrevio", "stockActual", "usuario", "referencia",
  ];
  readonly pageSizeOptions = [15, 25, 50, 100];
  readonly today = new Date();
  length = 0;
  pageSize = 15;
  pageIndex = 0;
  /** true cuando la última consulta falló: la tabla vacía no significa «no hay registros». */
  huboError = false;

  constructor(
    private controlStockNegativoGQL: ControlStockNegativoGQL,
    private sucursalService: SucursalService,
    private cargandoService: CargandoDialogService,
    private notificacion: NotificacionSnackbarService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.rangoPorDefecto();
    this.sucursalService
      .onGetAllSucursales()
      .pipe(untilDestroyed(this))
      .subscribe((lista) => {
        this.sucursalList = lista;
        this.cdRef.detectChanges();
      });
    this.buscar();
  }

  onFiltrar(): void {
    this.pageIndex = 0;
    this.buscar();
  }

  onResetFiltro(): void {
    this.rangoPorDefecto();
    this.sucursalControl.setValue(null);
    this.tipoControl.setValue(null);
    this.textoControl.setValue("");
    this.stockControl.setValue(null);
    this.pageIndex = 0;
    this.buscar();
  }

  onPage(e: PageEvent): void {
    const pageIndexAnterior = this.pageIndex;
    const pageSizeAnterior = this.pageSize;
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    if (!this.buscar()) {
      // La consulta no salió: el paginador no puede quedar en una página cuyas filas no están en pantalla.
      this.pageIndex = pageIndexAnterior;
      this.pageSize = pageSizeAnterior;
      this.cdRef.detectChanges();
    }
  }

  trackById(_: number, item: ControlStockNegativo): number {
    return item.id;
  }

  private rangoPorDefecto(): void {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(fin.getDate() - 7);
    this.fechaFormGroup.setValue({ inicio, fin });
  }

  /** Rango elegido, o null si falta una fecha o la escrita a mano no es válida (el control queda en null), o el fin es anterior al inicio. */
  private rangoValido(): { inicio: Date; fin: Date } | null {
    const { inicio, fin } = this.fechaFormGroup.value;
    const esFecha = (d: unknown): d is Date => d instanceof Date && !isNaN(d.getTime());
    if (!esFecha(inicio) || !esFecha(fin)) {
      return null;
    }
    if (fin.getTime() < inicio.getTime()) {
      return null;
    }
    return { inicio: new Date(inicio), fin: new Date(fin) };
  }

  private filtros(rango: { inicio: Date; fin: Date }): ControlStockNegativoFiltros {
    rango.inicio.setHours(0, 0, 0, 0);
    rango.fin.setHours(23, 59, 59, 0);
    const texto = (this.textoControl.value ?? "").trim();
    return {
      fechaInicio: dateToString(rango.inicio),
      fechaFin: dateToString(rango.fin),
      sucursalId: this.sucursalControl.value?.id ?? null,
      tipo: this.tipoControl.value ?? null,
      texto: texto.length > 0 ? texto.toUpperCase() : null,
      stock: this.stockControl.value ?? null,
      page: this.pageIndex,
      size: this.pageSize,
    };
  }

  /** @returns true si la consulta se envió; false si el rango no es válido y no se envió. */
  private buscar(): boolean {
    const rango = this.rangoValido();
    if (rango == null) {
      this.notificacion.openWarn("Completá un rango de fechas válido (inicio y fin) desde el calendario.");
      return false;
    }
    const { requestId } = this.cargandoService.openDialog(false, "Buscando...");
    this.controlStockNegativoGQL
      .fetch(this.filtros(rango), {
        fetchPolicy: "no-cache",
        errorPolicy: "all",
        // La tabla vive solo en el central: sin esto, en modo local Apollo la rutea al filial.
        context: { clientName: "servidor" },
      })
      .pipe(
        catchError(() => of(null)),
        finalize(() => this.cargandoService.closeDialog(requestId)),
        untilDestroyed(this)
      )
      .subscribe((result) => {
        const pagina = result?.data?.data;
        if (result == null || result.errors?.length || pagina == null) {
          this.huboError = true;
          this.dataSource.data = [];
          this.length = 0;
          this.notificacion.openAlgoSalioMal(this.mensajeDeError(result?.errors?.[0]?.message));
        } else {
          this.huboError = false;
          this.dataSource.data = pagina.getContent || [];
          this.length = pagina.getTotalElements || 0;
        }
        this.cdRef.detectChanges();
      });
    return true;
  }

  /** Un servidor central anterior a esta función rechaza la consulta por validación del esquema. */
  private mensajeDeError(mensaje: string | undefined): string {
    if (/validation error|fieldundefined/i.test(mensaje ?? "")) {
      return "El servidor todavía no tiene el control de stock negativo. Actualizá el servidor central.";
    }
    return mensaje || "No se pudo consultar el control de stock negativo";
  }
}
