import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { map } from "rxjs/operators";
import { PaginacionLista } from "../../../../shared/components/paginacion/paginacion-lista";
import { Tab } from "../../../../layouts/tab/tab.model";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { TabData, TabService } from "../../../../layouts/tab/tab.service";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import {
  PdvSearchProductoData,
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData,
} from "../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { Producto } from "../../../productos/producto/producto.model";
import { EditTransferenciaComponent } from "../edit-transferencia/edit-transferencia.component";
import { TransferenciaItemMotivoRechazo } from "../transferencia.model";
import { TransferenciaService } from "../transferencia.service";
import { ReporteService } from "../../../reportes/reporte.service";
import { ReportesComponent } from "../../../reportes/reportes/reportes.component";

const DIAS_POR_DEFECTO = 30;

/** Etapas en el orden del flujo: la del rechazo es la primera cuyo motivo coincide con el filtrado. */
const ETAPAS = [
  { nombre: "Creación", motivo: "motivoRechazoPreTransferencia", usuario: "usuarioPreTransferencia" },
  { nombre: "Preparación (origen)", motivo: "motivoRechazoPreparacion", usuario: "usuarioPreparacion" },
  { nombre: "Transporte", motivo: "motivoRechazoTransporte", usuario: "usuarioTransporte" },
  { nombre: "Recepción (destino)", motivo: "motivoRechazoRecepcion", usuario: "usuarioRecepcion" },
];

export const MOTIVOS_RECHAZO = [
  { value: TransferenciaItemMotivoRechazo.FALTA_PRODUCTO, label: "Falta producto" },
  { value: TransferenciaItemMotivoRechazo.PRODUCTO_AVERIADO, label: "Producto averiado" },
  { value: TransferenciaItemMotivoRechazo.PRODUCTO_VENCIDO, label: "Producto vencido" },
  { value: TransferenciaItemMotivoRechazo.PRODUCTO_EQUIVOCADO, label: "Producto equivocado" },
];

export interface FilaProductoFaltante {
  itemId: number;
  transferenciaId: number;
  fecha: string;
  origen: string;
  destino: string;
  producto: string;
  codigo: string;
  presentacion: number;
  cantidadPedida: number;
  cantidadPreparada: number;
  etapa: string;
  responsable: string;
  estado: string;
}

/** Arma la fila una sola vez al recibir la página: el HTML no llama funciones. */
export function toFilaProductoFaltante(item: any, motivo: TransferenciaItemMotivoRechazo): FilaProductoFaltante {
  const t = item?.transferencia;
  const etapa = ETAPAS.find((e) => item?.[e.motivo] === motivo);
  return {
    itemId: item?.id,
    transferenciaId: t?.id,
    fecha: t?.creadoEn,
    origen: t?.sucursalOrigen?.nombre,
    destino: t?.sucursalDestino?.nombre,
    producto: item?.presentacionPreTransferencia?.producto?.descripcion,
    codigo: item?.presentacionPreTransferencia?.producto?.codigoPrincipal,
    presentacion: item?.presentacionPreTransferencia?.cantidad,
    cantidadPedida: item?.cantidadPreTransferencia,
    cantidadPreparada: item?.cantidadPreparacion,
    etapa: etapa?.nombre,
    responsable: etapa ? t?.[etapa.usuario]?.nickname : null,
    estado: t?.estado?.replace(/_/g, " "),
  };
}

function fechaSinHora(fecha: Date): string {
  const d = new Date(fecha);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-list-productos-faltantes",
  templateUrl: "./list-productos-faltantes.component.html",
  styleUrls: ["./list-productos-faltantes.component.scss"],
})
export class ListProductosFaltantesComponent implements OnInit {
  readonly motivos = MOTIVOS_RECHAZO;
  readonly today = new Date();
  fechaFormGroup = new FormGroup({ inicio: new FormControl<Date>(null), fin: new FormControl<Date>(null) });
  motivoControl = new FormControl(TransferenciaItemMotivoRechazo.FALTA_PRODUCTO);
  origenControl = new FormControl<number>(null);
  destinoControl = new FormControl<number>(null);
  transferenciaIdControl = new FormControl<number>(null);
  buscarProductoControl = new FormControl("");
  selectedProducto: Producto = null;
  sucursalList: Sucursal[] = [];

  /**
   * Paginada en el central (#772): gana la última página pedida; si falla una página vuelve a la anterior.
   * Las páginas usan los filtros del último Buscar (un rango a medio elegir no frena el paginador).
   */
  pag: PaginacionLista<FilaProductoFaltante> = new PaginacionLista<FilaProductoFaltante>({
    cargar: (page, size) => {
      const filtros = this.filtrosAplicados;
      // Un error de red ya lo avisó el genérico.
      return this.transferenciaService.onGetItemsRechazados({ ...filtros, page, size }).pipe(
        map((res) => res && {
          getTotalElements: res.getTotalElements,
          getContent: (res.getContent ?? []).map((it) => toFilaProductoFaltante(it, filtros.motivo)),
        })
      );
    },
    pageSize: 20,
    pageSizeOptions: [20, 50, 100],
  });
  private filtrosAplicados: ReturnType<ListProductosFaltantesComponent["filtros"]>;
  private isDialogOpen = false;

  readonly displayedColumns = [
    "transferencia", "fecha", "ruta", "producto", "cantidadPedida", "cantidadPreparada",
    "etapa", "responsable", "estado",
  ];

  constructor(
    private transferenciaService: TransferenciaService,
    private sucursalService: SucursalService,
    private tabService: TabService,
    private dialog: MatDialog,
    private notificacion: NotificacionSnackbarService,
    private reporteService: ReporteService
  ) {}

  ngOnInit(): void {
    this.setFechasPorDefecto();
    this.sucursalService.onGetAllSucursales().pipe(untilDestroyed(this))
      .subscribe((data) => (this.sucursalList = data ?? []));
    this.onFiltrar();
  }

  private setFechasPorDefecto(): void {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(fin.getDate() - DIAS_POR_DEFECTO);
    this.fechaFormGroup.setValue({ inicio, fin });
  }

  /** Los mismos filtros para la lista y el PDF. Con id el central ignora las fechas. */
  filtros() {
    const transferenciaId = this.transferenciaIdControl.value || null;
    return {
      motivo: this.motivoControl.value,
      sucursalOrigenId: this.origenControl.value,
      sucursalDestinoId: this.destinoControl.value,
      productoId: this.selectedProducto?.id,
      transferenciaId,
      creadoDesde: transferenciaId ? null : fechaSinHora(this.fechaFormGroup.value.inicio),
      creadoHasta: transferenciaId ? null : fechaSinHora(this.fechaFormGroup.value.fin),
    };
  }

  private filtrosCompletos(): boolean {
    if (!this.transferenciaIdControl.value && (!this.fechaFormGroup.value.inicio || !this.fechaFormGroup.value.fin)) {
      this.notificacion.openWarn("Elegí las dos fechas del rango.");
      return false;
    }
    return true;
  }

  /** El PDF trae todo lo que coincide con los filtros (hasta 5000 filas), no solo la página visible. */
  onGenerarPdf(): void {
    if (!this.filtrosCompletos()) return;
    this.transferenciaService.onGetReporteItemsRechazados(this.filtros())
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (pdf) => {
          if (pdf == null) {
            this.notificacion.openWarn("No hay productos rechazados para estos filtros.");
            return;
          }
          this.reporteService.onAdd("Productos faltantes", pdf);
          this.tabService.addTab(new Tab(ReportesComponent, "Reportes", null, ListProductosFaltantesComponent));
        },
        error: () => {}, // rechazo del central o error de red: ya lo avisó el genérico
      });
  }

  /** Buscar y Limpiar: vuelve a la página 1 con los filtros de ahora. */
  onFiltrar(): void {
    if (!this.filtrosCompletos()) return;
    this.filtrosAplicados = this.filtros();
    this.pag.filtrar();
  }

  onResetFiltro(): void {
    this.setFechasPorDefecto();
    this.motivoControl.setValue(TransferenciaItemMotivoRechazo.FALTA_PRODUCTO);
    this.origenControl.setValue(null);
    this.destinoControl.setValue(null);
    this.transferenciaIdControl.setValue(null);
    this.selectedProducto = null;
    this.buscarProductoControl.setValue("");
    this.onFiltrar();
  }

  onBuscarProducto(): void {
    if (this.isDialogOpen) return;
    this.isDialogOpen = true;
    const data: PdvSearchProductoData = {
      texto: this.buscarProductoControl.value?.trim() || null,
      mostrarOpciones: false,
      mostrarStock: false,
      conservarUltimaBusqueda: true,
    };
    this.dialog.open(PdvSearchProductoDialogComponent, { data, height: "80%" })
      .afterClosed().subscribe((result: PdvSearchProductoResponseData) => {
        this.isDialogOpen = false;
        if (result?.producto) {
          this.selectedProducto = result.producto;
          this.buscarProductoControl.setValue(`${result.producto.descripcion} - ${result.producto.codigoPrincipal}`);
          this.onFiltrar();
        }
      });
  }

  onClearProducto(): void {
    this.selectedProducto = null;
    this.buscarProductoControl.setValue("");
    this.onFiltrar();
  }

  onAbrirTransferencia(fila: FilaProductoFaltante): void {
    this.tabService.addTab(new Tab(EditTransferenciaComponent, "Transf. " + fila.transferenciaId,
      new TabData(fila.transferenciaId), ListProductosFaltantesComponent));
  }

  trackByItemId(index: number, fila: FilaProductoFaltante): number {
    return fila.itemId;
  }
}
