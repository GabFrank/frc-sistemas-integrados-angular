import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { of } from "rxjs";
import { catchError, finalize } from "rxjs/operators";

import { dateToString } from "../../../../commons/core/utils/dateUtils";
import { Tab } from "../../../../layouts/tab/tab.model";
import { TabData, TabService } from "../../../../layouts/tab/tab.service";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { GestionComprasComponent } from "../../compra/gestion-compras/gestion-compras.component";
import { EditTransferenciaComponent } from "../../transferencia/edit-transferencia/edit-transferencia.component";
import { ProductosRechazadosGQL } from "../graphql/productosRechazados.gql";
import {
  ETAPA_RECHAZO_LABEL,
  etiquetaRechazo,
  FuenteRechazo,
  MOTIVO_RECHAZO_LABEL,
  ProductoRechazado,
  ProductoRechazadoFiltros,
} from "../producto-rechazado.model";

/**
 * Productos rechazados: lo rechazado en transferencias (preparación, transporte o recepción) y en
 * compras (recepción física o documental), con la fuente y el nro. de transferencia o pedido para
 * abrirlo. Solo lectura; la lista la arma el central (query productosRechazados).
 */
@UntilDestroy()
@Component({
  selector: "app-list-producto-rechazado",
  templateUrl: "./list-producto-rechazado.component.html",
  styleUrls: ["./list-producto-rechazado.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListProductoRechazadoComponent implements OnInit {
  @Input() data: Tab;

  dataSource = new MatTableDataSource<ProductoRechazado>([]);
  fechaFormGroup = new FormGroup({
    inicio: new FormControl<Date | null>(null),
    fin: new FormControl<Date | null>(null),
  });
  fuenteControl = new FormControl<FuenteRechazo | null>(null);
  sucursalControl = new FormControl<Sucursal | null>(null);
  referenciaControl = new FormControl<number | null>(null);
  textoControl = new FormControl<string>("");

  sucursalList: Sucursal[] = [];
  readonly fuenteOpciones: { value: FuenteRechazo; label: string }[] = [
    { value: "TRANSFERENCIA", label: "Transferencia" },
    { value: "COMPRA", label: "Compra" },
  ];
  readonly displayedColumns: string[] = [
    "fecha", "fuente", "referencia", "etapa", "producto", "presentacion", "cantidad", "motivo", "origen", "destino", "usuario",
  ];
  readonly pageSizeOptions = [15, 25, 50, 100];
  readonly today = new Date();
  length = 0;
  pageSize = 15;
  pageIndex = 0;
  /** true cuando la última consulta falló: la tabla vacía no significa «no hay rechazos». */
  huboError = false;

  constructor(
    private productosRechazadosGQL: ProductosRechazadosGQL,
    private sucursalService: SucursalService,
    private cargandoService: CargandoDialogService,
    private notificacion: NotificacionSnackbarService,
    private tabService: TabService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
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
    this.fechaFormGroup.setValue({ inicio: null, fin: null });
    this.fuenteControl.setValue(null);
    this.sucursalControl.setValue(null);
    this.referenciaControl.setValue(null);
    this.textoControl.setValue("");
    this.pageIndex = 0;
    this.buscar();
  }

  onPage(e: PageEvent): void {
    const pageIndexAnterior = this.pageIndex;
    const pageSizeAnterior = this.pageSize;
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    if (!this.buscar()) {
      this.pageIndex = pageIndexAnterior;
      this.pageSize = pageSizeAnterior;
      this.cdRef.detectChanges();
    }
  }

  trackByFila(_: number, item: ProductoRechazado): string {
    return `${item.fuente}-${item.etapa}-${item.itemId}`;
  }

  etapaLabel(item: ProductoRechazado): string {
    return etiquetaRechazo(ETAPA_RECHAZO_LABEL, item.etapa);
  }

  motivoLabel(item: ProductoRechazado): string {
    return etiquetaRechazo(MOTIVO_RECHAZO_LABEL, item.motivo);
  }

  /** Abre la transferencia o el pedido de compra de la fila en una pestaña nueva. */
  onIrAReferencia(item: ProductoRechazado): void {
    const id = item.referenciaId != null ? Number(item.referenciaId) : null;
    if (id == null) {
      this.notificacion.openWarn("El rechazo no tiene una transferencia o pedido asociado");
      return;
    }
    if (item.fuente === "TRANSFERENCIA") {
      this.tabService.addTab(
        new Tab(EditTransferenciaComponent, `Transferencia ${id}`, new TabData(id, { id }), ListProductoRechazadoComponent)
      );
    } else {
      this.tabService.addTab(
        new Tab(GestionComprasComponent, `Pedido ${id}`, new TabData(id), ListProductoRechazadoComponent)
      );
    }
  }

  /**
   * Rango opcional: sin fechas trae todo, del más reciente al más viejo (la lista va paginada). Con
   * una sola fecha, o con el fin antes del inicio, no se consulta.
   */
  private rango(): { inicio: string | null; fin: string | null } | "invalido" {
    const { inicio, fin } = this.fechaFormGroup.value;
    const esFecha = (d: unknown): d is Date => d instanceof Date && !isNaN(d.getTime());
    if (inicio == null && fin == null) {
      return { inicio: null, fin: null };
    }
    if (!esFecha(inicio) || !esFecha(fin) || fin.getTime() < inicio.getTime()) {
      return "invalido";
    }
    return { inicio: dateToString(inicio, "yyyy-MM-dd"), fin: dateToString(fin, "yyyy-MM-dd") };
  }

  private filtros(rango: { inicio: string | null; fin: string | null }): ProductoRechazadoFiltros {
    const texto = (this.textoControl.value ?? "").trim();
    const referencia = this.referenciaControl.value;
    return {
      fuente: this.fuenteControl.value ?? null,
      fechaInicio: rango.inicio,
      fechaFin: rango.fin,
      sucursalId: this.sucursalControl.value?.id ?? null,
      referenciaId: referencia != null && referencia > 0 ? referencia : null,
      texto: texto.length > 0 ? texto : null,
      page: this.pageIndex,
      size: this.pageSize,
    };
  }

  /** @returns true si la consulta se envió; false si el rango no es válido. */
  private buscar(): boolean {
    const rango = this.rango();
    if (rango === "invalido") {
      this.notificacion.openWarn("Completá las dos fechas del rango (o dejá las dos vacías) desde el calendario.");
      return false;
    }
    const { requestId } = this.cargandoService.openDialog(false, "Buscando...");
    this.productosRechazadosGQL
      .fetch(this.filtros(rango), {
        fetchPolicy: "no-cache",
        errorPolicy: "all",
        // Transferencias y compras viven en el central: sin esto, en modo local Apollo la rutea al filial.
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

  /** Un central anterior a esta pantalla rechaza la consulta por validación del esquema. */
  private mensajeDeError(mensaje: string | undefined): string {
    if (/validation error|fieldundefined/i.test(mensaje ?? "")) {
      return "El servidor todavía no tiene la lista de productos rechazados. Actualizá el servidor central.";
    }
    return mensaje || "No se pudo consultar la lista de productos rechazados";
  }
}
