import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { PageEvent } from "@angular/material/paginator";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
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
@UntilDestroy()
@Component({
  selector: "app-historial-retiros",
  templateUrl: "./historial-retiros.component.html",
  styleUrls: ["./historial-retiros.component.scss"],
})
export class HistorialRetirosComponent implements OnInit {
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
    private reporteService: ReporteService,
    private tabService: TabService,
    private dialogosService: DialogosService,
    private notificacionService: NotificacionSnackbarService,
    private matDialog: MatDialog
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

  cargar(): void {
    this.cargando = true;
    const fi = this.desde ? this.desde + " 00:00" : undefined;
    const ff = this.hasta ? this.hasta + " 23:59" : undefined;
    this.operacionService
      .onGetRetiros(this.pageIndex, this.pageSize, fi, ff)
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

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.cargar();
  }

  onReimprimir(op: any): void {
    this.operacionService
      .onGetRemitoRetiro(op.id)
      .pipe(untilDestroyed(this))
      .subscribe((pdf: string) => {
        if (pdf) {
          this.reporteService.onAdd(`Comprobante retiro ${op._titulo}`, pdf);
          this.tabService.addTab(new Tab(ReportesComponent, "Reportes", null, null));
        } else {
          this.notificacionService.openWarn("No se pudo generar el comprobante");
        }
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
            () => (this.procesando = false)
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
