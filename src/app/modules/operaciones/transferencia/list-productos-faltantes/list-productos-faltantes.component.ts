import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { PageEvent } from "@angular/material/paginator";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { of, Subject } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";
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

const DIAS_POR_DEFECTO = 30;

/** Etapas en el orden del flujo: la del rechazo es la primera cuyo motivo coincide con el filtrado. */
const ETAPAS = [
  { nombre: "Creación", motivo: "motivoRechazoPreTransferencia", usuario: "usuarioPreTransferencia", observacion: "observacionPreTransferencia" },
  { nombre: "Preparación (origen)", motivo: "motivoRechazoPreparacion", usuario: "usuarioPreparacion", observacion: "observacionPreparacion" },
  { nombre: "Transporte", motivo: "motivoRechazoTransporte", usuario: "usuarioTransporte", observacion: "observacionTransporte" },
  { nombre: "Recepción (destino)", motivo: "motivoRechazoRecepcion", usuario: "usuarioRecepcion", observacion: "observacionRecepcion" },
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
  /** Motivo de recepción cuando difiere del filtrado (el destino lo cambió); si no, null. */
  motivoFinal: string;
  etapa: string;
  responsable: string;
  observacion: string;
  estado: string;
}

/** Arma la fila una sola vez al recibir la página: el HTML no llama funciones. */
export function toFilaProductoFaltante(item: any, motivo: TransferenciaItemMotivoRechazo): FilaProductoFaltante {
  const t = item?.transferencia;
  const etapa = ETAPAS.find((e) => item?.[e.motivo] === motivo);
  const recepcion = item?.motivoRechazoRecepcion;
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
    motivoFinal: recepcion && recepcion !== motivo ? MOTIVOS_RECHAZO.find((m) => m.value === recepcion)?.label ?? recepcion : null,
    etapa: etapa?.nombre,
    responsable: etapa ? t?.[etapa.usuario]?.persona?.nombre : null,
    observacion: etapa ? item?.[etapa.observacion] : null,
    estado: t?.estado?.replace(/_/g, " "),
  };
}

function fechaSinHora(fecha: Date): string {
  const d = new Date(fecha);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

@UntilDestroy()
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
  buscarProductoControl = new FormControl("");
  selectedProducto: Producto = null;
  sucursalList: Sucursal[] = [];

  filas: FilaProductoFaltante[] = [];
  length = 0;
  pageIndex = 0;
  pageSize = 20;
  readonly pageSizeOptions = [20, 50, 100];
  /** «vacio» solo tras una respuesta correcta: un error no se muestra como «no hay faltantes». */
  estado: "cargando" | "vacio" | "error" = "cargando";
  private isDialogOpen = false;
  private buscar$ = new Subject<void>();

  readonly displayedColumns = [
    "transferencia", "fecha", "ruta", "producto", "cantidadPedida", "cantidadPreparada",
    "motivo", "etapa", "responsable", "observacion", "estado",
  ];

  constructor(
    private transferenciaService: TransferenciaService,
    private sucursalService: SucursalService,
    private tabService: TabService,
    private dialog: MatDialog,
    private notificacion: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.setFechasPorDefecto();
    this.sucursalService.onGetAllSucursales().pipe(untilDestroyed(this))
      .subscribe((data) => (this.sucursalList = data ?? []));
    // switchMap: si se busca de nuevo antes de que vuelva la anterior, la respuesta vieja se descarta.
    this.buscar$.pipe(
      switchMap(() => {
        const motivo = this.motivoControl.value;
        return this.transferenciaService.onGetItemsRechazados({
          motivo,
          sucursalOrigenId: this.origenControl.value,
          sucursalDestinoId: this.destinoControl.value,
          productoId: this.selectedProducto?.id,
          creadoDesde: fechaSinHora(this.fechaFormGroup.value.inicio),
          creadoHasta: fechaSinHora(this.fechaFormGroup.value.fin),
          page: this.pageIndex,
          size: this.pageSize,
        }).pipe(
          map((res) => ({ res, motivo })),
          // Un error de red ya lo avisó el genérico; sin esto mataría buscar$ y no se podría volver a buscar.
          catchError(() => of({ res: null, motivo }))
        );
      }),
      untilDestroyed(this)
    ).subscribe(({ res, motivo }) => {
      if (res == null) {
        // El genérico ya avisó el error: queda la tabla anterior; sin filas, se dice que falló.
        this.estado = "error";
        return;
      }
      this.filas = (res.getContent ?? []).map((it) => toFilaProductoFaltante(it, motivo));
      this.length = res.getTotalElements ?? 0;
      this.estado = "vacio";
    });
    this.buscar();
  }

  private setFechasPorDefecto(): void {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(fin.getDate() - DIAS_POR_DEFECTO);
    this.fechaFormGroup.setValue({ inicio, fin });
  }

  private buscar(): void {
    if (!this.fechaFormGroup.value.inicio || !this.fechaFormGroup.value.fin) {
      this.notificacion.openWarn("Elegí las dos fechas del rango.");
      return;
    }
    this.buscar$.next();
  }

  onFiltrar(): void {
    this.pageIndex = 0;
    this.buscar();
  }

  onResetFiltro(): void {
    this.setFechasPorDefecto();
    this.motivoControl.setValue(TransferenciaItemMotivoRechazo.FALTA_PRODUCTO);
    this.origenControl.setValue(null);
    this.destinoControl.setValue(null);
    this.selectedProducto = null;
    this.buscarProductoControl.setValue("");
    this.onFiltrar();
  }

  handlePageEvent(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.buscar();
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
