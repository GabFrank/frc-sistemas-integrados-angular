import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { Component, OnInit } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { of, timer } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { PaginacionLista } from "../../../../shared/components/paginacion/paginacion-lista";
import { avisoTrasMutacion, erroresDeRechazo, RECARGA_TRAS_CORTE_MS } from "../../../../commons/core/utils/graphqlErrorUtils";
import { Tab } from "../../../../layouts/tab/tab.model";
import { TabService } from "../../../../layouts/tab/tab.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { ReporteService } from "../../../reportes/reporte.service";
import { ReportesComponent } from "../../../reportes/reportes/reportes.component";
import { EtiquetasDevolucionService } from "../etiquetas/etiquetas-devolucion.service";
import { OperacionDevolucionService } from "../operacion-devolucion/operacion-devolucion.service";

/**
 * Histórico de colectas internas (cabeceras origen -> destino). Permite
 * reimprimir la etiqueta de cada devolución y revertir la colecta (solo si
 * sus devoluciones siguen en COLECTADO).
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-historial-colectas",
  templateUrl: "./historial-colectas.component.html",
  styleUrls: ["./historial-colectas.component.scss"],
})
export class HistorialColectasComponent implements OnInit {
  /**
   * Paginadas en el central (#772): gana la última página pedida. Si falla, la lista se oculta y queda
   * «Reintentar», que repite la última página que cargó (#390).
   */
  pag = new PaginacionLista<any>({
    cargar: (page, size) => this.operacionService
      .onGetColectas(page, size, this.desde ? this.desde + " 00:00" : undefined, this.hasta ? this.hasta + " 23:59" : undefined)
      .pipe(
        // null: el servicio ya avisó el error. Sin respuesta (error de red) se avisa acá.
        catchError(() => {
          this.notificacionService.openWarn("No se pudieron cargar las colectas: el servidor no responde.", 5);
          return of(null);
        }),
        map((res: any) => res && { getTotalElements: res.getTotalElements, getContent: (res.getContent || []).map((op: any) => this.mapOp(op)) })
      ),
    pageSize: 15,
    pageSizeOptions: [15, 25, 50],
  });
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
    this.pag.filtrar();
  }

  onFiltrar(): void {
    this.pag.filtrar();
  }

  onLimpiar(): void {
    this.desde = null;
    this.hasta = null;
    this.pag.filtrar();
  }

  /** Repite la página a la vista (Reintentar, tras revertir o acreditar). */
  cargar(): void {
    this.pag.recargar();
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

  onReimprimirEtiquetas(d: any): void {
    this.etiquetasService
      .onGetPdf(d.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (pdf: string) => {
          if (pdf) {
            this.reporteService.onAdd(`Etiqueta ${d.identificador || "#" + d.id}`, pdf);
            this.tabService.addTab(new Tab(ReportesComponent, "Reportes", null, null));
          } else {
            this.notificacionService.openWarn("No se pudo generar la etiqueta.");
          }
        },
        error: () => this.notificacionService.openWarn("No se pudo generar la etiqueta: el servidor no responde.")
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
            (err) => this.trasErrorDeReversa(err)
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
            (err) => this.trasErrorDeReversa(err)
          );
      });
  }

  /**
   * Tras el error de una reversa. En un rechazo el genérico ya mostró el motivo y no se aplicó nada. Sin respuesta
   * pudo aplicarse y repetirla desharía de más: se avisa y se relee a los 5 s, con los botones deshabilitados hasta
   * entonces (#501).
   */
  private trasErrorDeReversa(err: any): void {
    if (erroresDeRechazo(err) != null) {
      this.procesando = false;
      return;
    }
    const aviso = avisoTrasMutacion(err, "se revirtió");
    if (aviso != null) this.notificacionService.openWarn(aviso, 8);
    timer(RECARGA_TRAS_CORTE_MS).pipe(untilDestroyed(this)).subscribe(() => {
      this.procesando = false;
      this.cargar();
    });
  }
}
