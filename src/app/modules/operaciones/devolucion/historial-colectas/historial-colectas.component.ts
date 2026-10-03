import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { Component, OnInit } from "@angular/core";
import { PageEvent } from "@angular/material/paginator";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Tab } from "../../../../layouts/tab/tab.model";
import { TabService } from "../../../../layouts/tab/tab.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { ReporteService } from "../../../reportes/reporte.service";
import { ReportesComponent } from "../../../reportes/reportes/reportes.component";
import { EtiquetasDevolucionService } from "../etiquetas/etiquetas-devolucion.service";
import { OperacionDevolucionService } from "../operacion-devolucion/operacion-devolucion.service";

/**
 * Histórico de colectas internas (cabeceras origen -> destino). Permite
 * reimprimir las etiquetas de cada devolución y revertir la colecta (solo si
 * sus devoluciones siguen en COLECTADO).
 */
@UntilDestroy()
@Component({
  selector: "app-historial-colectas",
  templateUrl: "./historial-colectas.component.html",
  styleUrls: ["./historial-colectas.component.scss"],
})
export class HistorialColectasComponent implements OnInit {
  operaciones: any[] = [];
  pageIndex = 0;
  pageSize = 15;
  totalElements = 0;
  cargando = false;
  procesando = false;
  desde: string | null = null; // yyyy-MM-dd
  hasta: string | null = null;

  constructor(
    private operacionService: OperacionDevolucionService,
    private etiquetasService: EtiquetasDevolucionService,
    private reporteService: ReporteService,
    private tabService: TabService,
    private dialogosService: DialogosService,
    private notificacionService: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  onFiltrar(): void {
    this.pageIndex = 0;
    this.cargar();
  }

  onLimpiar(): void {
    this.desde = null;
    this.hasta = null;
    this.pageIndex = 0;
    this.cargar();
  }

  /** La última carga falló: se muestra el error con «Reintentar», no «No hay…». */
  cargaFallo = false;
  private paginaCargada = { pageIndex: 0, pageSize: 15 };

  cargar(): void {
    this.cargando = true;
    const fi = this.desde ? this.desde + " 00:00" : undefined;
    const ff = this.hasta ? this.hasta + " 23:59" : undefined;
    this.operacionService
      .onGetColectas(this.pageIndex, this.pageSize, fi, ff)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res: any) => {
          this.cargando = false;
          if (res == null) { this.noCargo(); return; }
          this.cargaFallo = false;
          this.paginaCargada = { pageIndex: this.pageIndex, pageSize: this.pageSize };
          this.totalElements = res.getTotalElements;
          this.operaciones = (res.getContent || []).map((op: any) => this.mapOp(op));
        },
        error: () => { this.cargando = false; this.noCargo(); }
      });
  }

  /**
   * Sin respuesta: no se muestra «No hay…» ni datos viejos, y la página vuelve a la última que cargó (si no,
   * «Reintentar» pediría la página a la que se intentó ir) (#390).
   */
  private noCargo(): void {
    this.cargaFallo = true;
    this.operaciones = [];
    this.pageIndex = this.paginaCargada.pageIndex;
    this.pageSize = this.paginaCargada.pageSize;
    this.notificacionService.openWarn("No se pudieron cargar las colectas: el servidor no responde.", 5);
  }

  private mapOp(op: any): any {
    const revertida = op.estado === "REVERTIDO";
    const devs = (op.devoluciones || []).map((d: any) => ({
      ...d,
      _rev: !revertida && d.estado === "COLECTADO",
    }));
    const revertible = !revertida && devs.length > 0 && devs.every((d: any) => d.estado === "COLECTADO");
    return {
      ...op,
      devoluciones: devs,
      _titulo: (op.sucursalOrigen?.nombre || "") + " → " + (op.sucursalDestino?.nombre || ""),
      _revertida: revertida,
      _revertible: revertible,
    };
  }

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.cargar();
  }

  onReimprimirEtiquetas(d: any): void {
    this.etiquetasService
      .onGetPdf(d.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (pdf: string) => {
          if (pdf) {
            this.reporteService.onAdd(`Etiquetas ${d.identificador || "#" + d.id}`, pdf);
            this.tabService.addTab(new Tab(ReportesComponent, "Reportes", null, null));
          } else {
            this.notificacionService.openWarn("No se pudieron generar las etiquetas.");
          }
        },
        error: () => this.notificacionService.openWarn("No se pudieron generar las etiquetas: el servidor no responde.")
      });
  }

  onRevertirOperacion(op: any): void {
    this.dialogosService
      .confirm("Atención!!", "¿Revertir la colecta completa? Se deshace toda la operación.")
      .pipe(untilDestroyed(this))
      .subscribe((confirmado) => {
        if (!confirmado) return;
        this.procesando = true;
        this.operacionService
          .onRevertirColecta(op.id)
          .pipe(untilDestroyed(this))
          .subscribe(
            (r) => {
              this.procesando = false;
              if (r != null) this.cargar();
            },
            () => (this.procesando = false)
          );
      });
  }

  onRevertirLinea(d: any): void {
    this.dialogosService
      .confirm("Atención!!", `¿Revertir ${d.identificador || "#" + d.id}?`)
      .pipe(untilDestroyed(this))
      .subscribe((confirmado) => {
        if (!confirmado) return;
        this.procesando = true;
        this.operacionService
          .onRevertirEstado(d.id)
          .pipe(untilDestroyed(this))
          .subscribe(
            (r) => {
              this.procesando = false;
              if (r != null) this.cargar();
            },
            () => (this.procesando = false)
          );
      });
  }
}
