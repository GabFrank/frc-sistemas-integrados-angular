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
import { ControlStockNegativo, ControlStockNegativoFiltros, TipoControlStock } from "../control-stock-negativo.model";
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

  sucursalList: Sucursal[] = [];
  readonly tipoOpciones: { value: TipoControlStock; label: string }[] = [
    { value: "VENTA", label: "Venta" },
    { value: "TRANSFERENCIA", label: "Transferencia" },
  ];
  readonly displayedColumns: string[] = [
    "fecha", "sucursal", "tipo", "producto", "cantidad", "stockPrevio", "usuario", "referencia",
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
    this.pageIndex = 0;
    this.buscar();
  }

  onPage(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.buscar();
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

  private filtros(): ControlStockNegativoFiltros {
    const inicio = new Date(this.fechaFormGroup.value.inicio ?? new Date());
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(this.fechaFormGroup.value.fin ?? this.fechaFormGroup.value.inicio ?? new Date());
    fin.setHours(23, 59, 59, 0);
    const texto = (this.textoControl.value ?? "").trim();
    return {
      fechaInicio: dateToString(inicio),
      fechaFin: dateToString(fin),
      sucursalId: this.sucursalControl.value?.id ?? null,
      tipo: this.tipoControl.value ?? null,
      texto: texto.length > 0 ? texto.toUpperCase() : null,
      page: this.pageIndex,
      size: this.pageSize,
    };
  }

  private buscar(): void {
    const { requestId } = this.cargandoService.openDialog(false, "Buscando...");
    this.controlStockNegativoGQL
      .fetch(this.filtros(), {
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
          this.notificacion.openAlgoSalioMal(
            result?.errors?.[0]?.message || "No se pudo consultar el control de stock negativo"
          );
        } else {
          this.huboError = false;
          this.dataSource.data = pagina.getContent || [];
          this.length = pagina.getTotalElements || 0;
        }
        this.cdRef.detectChanges();
      });
  }
}
