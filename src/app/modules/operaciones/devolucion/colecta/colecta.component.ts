import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { MainService } from "../../../../main.service";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { DevolucionService } from "../devolucion.service";
import { DevolucionEstado } from "../devolucion.model";
import { ColectaDevolucionService } from "./colecta-devolucion.service";

interface FilaColecta {
  id: number;
  identificador: string;
  origen: string;
  proveedor: string;
  seleccionada: boolean;
}

/**
 * Colecta interna: un funcionario junta las devoluciones SEPARADAS y las envía a
 * un depósito único. Elegir depósito → seleccionar separadas → colectar en bloque.
 */
@Component({
  selector: "app-colecta",
  templateUrl: "./colecta.component.html",
  styleUrls: ["./colecta.component.scss"],
})
export class ColectaComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  sucursales: Sucursal[] = [];
  destino: Sucursal | null = null;

  cargando = false;
  colectando = false;
  filas: FilaColecta[] = [];

  constructor(
    public mainService: MainService,
    private sucursalService: SucursalService,
    private devolucionService: DevolucionService,
    private colectaService: ColectaDevolucionService,
    private notificacionService: NotificacionSnackbarService,
    private dialogosService: DialogosService
  ) {}

  ngOnInit(): void {
    this.sucursalService
      .onGetAllSucursales(true)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.sucursales = (res || []).filter((s) => s.id != 0);
      });
    this.cargarSeparadas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get seleccionadas(): number[] {
    return this.filas.filter((f) => f.seleccionada).map((f) => f.id);
  }

  cargarSeparadas(): void {
    this.cargando = true;
    this.devolucionService
      .onGetDevolucionesConFiltros(
        undefined,
        undefined,
        DevolucionEstado.SEPARADO,
        undefined,
        undefined,
        0,
        200
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          this.cargando = false;
          const data = page?.getContent || (page as any)?.content || [];
          // Solo las CON proveedor pueden colectarse (las sin proveedor van a
          // DESCARTADO). Se filtran para no ofrecer filas que el backend rechaza.
          this.filas = (data || [])
            .filter((d: any) => d.proveedor != null)
            .map((d: any) => ({
              id: d.id,
              identificador: d.identificador,
              origen: d.sucursalOrigen?.nombre || "—",
              proveedor: d.proveedor?.persona?.nombre || "—",
              seleccionada: true,
            }));
        },
        error: () => {
          this.cargando = false;
          this.notificacionService.openAlgoSalioMal(
            "Error al cargar las devoluciones separadas"
          );
        },
      });
  }

  toggleTodas(checked: boolean): void {
    this.filas.forEach((f) => (f.seleccionada = checked));
  }

  onColectar(): void {
    if (this.colectando) return;
    if (!this.destino?.id) {
      this.notificacionService.openWarn("Elegí un depósito destino");
      return;
    }
    const ids = this.seleccionadas;
    if (ids.length === 0) {
      this.notificacionService.openWarn("Seleccioná al menos una devolución");
      return;
    }
    // Una colecta = un viaje origen -> destino: el backend crea una operación por
    // cada sucursal de origen distinta. Avisar si la selección cruza varios orígenes.
    const origenes = new Set(
      this.filas.filter((f) => f.seleccionada).map((f) => f.origen)
    );
    if (origenes.size > 1) {
      this.dialogosService
        .confirm(
          "Atención!!",
          `La selección incluye ${origenes.size} sucursales de origen distintas.`,
          "Se generará una operación de colecta separada por cada origen. ¿Continuar?"
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe((ok) => {
          if (ok) this.ejecutarColecta(ids);
        });
    } else {
      this.ejecutarColecta(ids);
    }
  }

  private ejecutarColecta(ids: number[]): void {
    this.colectando = true;
    const usuarioId = this.mainService.usuarioActual?.id;
    this.colectaService
      .onColectarEnBloque(ids, this.destino.id, usuarioId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.colectando = false;
          const resultados = res?.resultados || [];
          const ok = resultados.filter((r: any) => r.ok).length;
          const fail = resultados.length - ok;
          if (fail > 0) {
            this.notificacionService.openWarn(
              `${ok} colectada(s), ${fail} con error a ${this.destino?.nombre}`
            );
          } else {
            this.notificacionService.openSucess(
              `${ok} devolución(es) enviada(s) a ${this.destino?.nombre}`
            );
          }
          this.cargarSeparadas();
        },
        error: () => {
          this.colectando = false;
          this.notificacionService.openAlgoSalioMal("Error al colectar");
        },
      });
  }
}
