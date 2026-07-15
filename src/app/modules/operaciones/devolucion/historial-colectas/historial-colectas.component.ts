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

  constructor(
    private operacionService: OperacionDevolucionService,
    private etiquetasService: EtiquetasDevolucionService,
    private reporteService: ReporteService,
    private tabService: TabService,
    private dialogosService: DialogosService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.operacionService
      .onGetColectas(this.pageIndex, this.pageSize)
      .pipe(untilDestroyed(this))
      .subscribe((res: any) => {
        this.cargando = false;
        if (res != null) {
          this.totalElements = res.getTotalElements;
          this.operaciones = (res.getContent || []).map((op: any) => this.mapOp(op));
        }
      });
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
      .subscribe((pdf: string) => {
        if (pdf) {
          this.reporteService.onAdd(`Etiquetas ${d.identificador || "#" + d.id}`, pdf);
          this.tabService.addTab(new Tab(ReportesComponent, "Reportes", null, null));
        }
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
