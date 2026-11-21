import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { of, timer } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { PaginacionLista } from "../../../../shared/components/paginacion/paginacion-lista";
import { avisoTrasMutacion, erroresDeRechazo, RECARGA_TRAS_CORTE_MS } from "../../../../commons/core/utils/graphqlErrorUtils";
import { Tab } from "../../../../layouts/tab/tab.model";
import { TabService } from "../../../../layouts/tab/tab.service";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { ReporteService } from "../../../reportes/reporte.service";
import { ReportesComponent } from "../../../reportes/reportes/reportes.component";
import { AcreditarRetiroDialogComponent } from "../acreditar-retiro-dialog/acreditar-retiro-dialog.component";
import { OperacionDevolucionService } from "../operacion-devolucion/operacion-devolucion.service";

/**
 * Histórico de retiros a proveedor (cabeceras). Permite reimprimir el remito de
 * la operación y revertir el retiro (solo si sus devoluciones siguen en RETIRADO).
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-historial-retiros",
  templateUrl: "./historial-retiros.component.html",
  styleUrls: ["./historial-retiros.component.scss"],
})
export class HistorialRetirosComponent implements OnInit {
  /**
   * Paginadas en el central (#772): gana la última página pedida. Si falla, la lista se oculta y queda
   * «Reintentar», que repite la última página que cargó (#390).
   */
  pag = new PaginacionLista<any>({
    cargar: (page, size) => this.operacionService
      .onGetRetiros(page, size, this.desde ? this.desde + " 00:00" : undefined, this.hasta ? this.hasta + " 23:59" : undefined)
      .pipe(
        // null: el servicio ya avisó el error. Sin respuesta (error de red) se avisa acá.
        catchError(() => {
          this.notificacionService.openWarn("No se pudieron cargar los retiros: el servidor no responde.", 5);
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
    private reporteService: ReporteService,
    private tabService: TabService,
    private dialogosService: DialogosService,
    private notificacionService: NotificacionSnackbarService,
    private matDialog: MatDialog
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
      _rev: !revertida && d.estado === "RETIRADO",
    }));
    const revertible = !revertida && devs.length > 0 && devs.every((d: any) => d.estado === "RETIRADO");
    const acreditada = !!op.notaCredito;
    // Se puede acreditar un retiro confirmado, no revertido, aun no acreditado y
    // con todas sus devoluciones en RETIRADO.
    const puedeAcreditar =
      !revertida && !acreditada && devs.length > 0 && devs.every((d: any) => d.estado === "RETIRADO");
    return {
      ...op,
      devoluciones: devs,
      _titulo: op.proveedor?.persona?.nombre || "Proveedor",
      _revertida: revertida,
      _revertible: revertible && !acreditada,
      _acreditada: acreditada,
      _puedeAcreditar: puedeAcreditar,
    };
  }

  onReimprimir(op: any): void {
    this.operacionService
      .onGetRemitoRetiro(op.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (pdf: string) => {
          if (pdf) {
            this.reporteService.onAdd(`Comprobante retiro ${op._titulo}`, pdf);
            this.tabService.addTab(new Tab(ReportesComponent, "Reportes", null, null));
          } else {
            this.notificacionService.openWarn("No se pudo generar el comprobante");
          }
        },
        error: () => this.notificacionService.openWarn("No se pudo generar el comprobante: el servidor no responde.")
      });
  }

  onRevertirOperacion(op: any): void {
    this.dialogosService
      .confirm("Atención!!", "¿Revertir el retiro completo? Se deshace toda la operación.")
      .pipe(untilDestroyed(this))
      .subscribe((confirmado) => {
        if (!confirmado) return;
        this.procesando = true;
        this.operacionService
          .onRevertirRetiro(op.id)
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

  onAcreditar(op: any): void {
    this.matDialog
      .open(AcreditarRetiroDialogComponent, {
        data: { retiroId: op.id, proveedorNombre: op._titulo },
        disableClose: true,
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((ok) => {
        if (ok) this.cargar();
      });
  }

  onRevertirNotaCredito(op: any): void {
    if (!op.notaCredito) return;
    this.dialogosService
      .confirm("Atención!!", "¿Revertir la nota de crédito? Las devoluciones vuelven a RETIRADO.")
      .pipe(untilDestroyed(this))
      .subscribe((confirmado) => {
        if (!confirmado) return;
        this.procesando = true;
        this.operacionService
          .onRevertirNotaCredito(op.notaCredito.id)
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
