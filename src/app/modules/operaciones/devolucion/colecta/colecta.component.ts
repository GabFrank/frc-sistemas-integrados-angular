import { PROPAGAR_ERROR_DE_RED } from "../../../../generics/generic-crud.service";
import { TIMEOUT_POR_DEFECTO_MS } from "../../../../shared/services/timeout-link";
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
  origenId: number | null;
  origen: string;
  proveedor: string;
  seleccionada: boolean;
  // Ya está en el depósito destino elegido: el backend la rechaza, no se ofrece.
  enDestino: boolean;
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
  cantidadSeleccionadas = 0;
  todasSeleccionadas = false;
  hayColectables = false;

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
      .onGetAllSucursales(true, PROPAGAR_ERROR_DE_RED, { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.sucursales = (res || []).filter((s) => s.id != 0);
        },
        error: () => this.notificacionService.openWarn("No se pudieron cargar las sucursales: el servidor no responde.", 5),
      });
    this.cargarSeparadas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Marca las filas cuyo origen es el depósito destino: se destildan y quedan
   * deshabilitadas. Las que dejan de estarlo vuelven al default (tildadas).
   */
  aplicarDestino(): void {
    const destinoId = this.destino?.id != null ? Number(this.destino.id) : null;
    this.filas.forEach((f) => {
      const enDestino = destinoId != null && f.origenId === destinoId;
      if (enDestino) {
        f.seleccionada = false;
      } else if (f.enDestino) {
        f.seleccionada = true;
      }
      f.enDestino = enDestino;
    });
    this.recalcularSeleccion();
  }

  recalcularSeleccion(): void {
    const colectables = this.filas.filter((f) => !f.enDestino);
    this.cantidadSeleccionadas = colectables.filter((f) => f.seleccionada).length;
    this.hayColectables = colectables.length > 0;
    this.todasSeleccionadas =
      this.hayColectables && this.cantidadSeleccionadas === colectables.length;
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
        200,
        true,
        undefined,
        PROPAGAR_ERROR_DE_RED,
        { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true }
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
              // El ID de GraphQL puede llegar como string: normalizar para comparar.
              origenId:
                d.sucursalOrigen?.id != null ? Number(d.sucursalOrigen.id) : null,
              origen: d.sucursalOrigen?.nombre || "—",
              proveedor: d.proveedor?.persona?.nombre || "—",
              seleccionada: true,
              enDestino: false,
            }));
          this.aplicarDestino();
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
    this.filas
      .filter((f) => !f.enDestino)
      .forEach((f) => (f.seleccionada = checked));
    this.recalcularSeleccion();
  }

  onColectar(): void {
    if (this.colectando) return;
    if (!this.destino?.id) {
      this.notificacionService.openWarn("Elegí un depósito destino");
      return;
    }
    // Las que ya están en el destino no se colectan (el backend las rechaza).
    const seleccionadas = this.filas.filter((f) => f.seleccionada && !f.enDestino);
    const ids = seleccionadas.map((f) => f.id);
    if (ids.length === 0) {
      this.notificacionService.openWarn("Seleccioná al menos una devolución");
      return;
    }
    // Una colecta = un viaje origen -> destino: el backend crea una operación por
    // cada sucursal de origen distinta. Avisar si la selección cruza varios orígenes.
    const origenes = new Set(seleccionadas.map((f) => f.origenId));
    if (origenes.size > 1) {
      const enDestino = this.filas.filter((f) => f.enDestino).length;
      const aviso =
        enDestino > 0
          ? ` ${enDestino} devolución(es) ya está(n) en ${this.destino.nombre} y no se colecta(n).`
          : "";
      this.dialogosService
        .confirm(
          "Atención!!",
          `La selección incluye ${origenes.size} sucursales de origen distintas.`,
          `Se generará una operación de colecta separada por cada origen.${aviso} ¿Continuar?`
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
          const fallidas = resultados.filter((r: any) => !r.ok);
          if (fallidas.length > 0) {
            const motivos = Array.from(
              new Set(fallidas.map((r: any) => r.mensaje || "motivo desconocido"))
            ).join(" / ");
            this.notificacionService.openWarn(
              `${ok} enviada(s) a ${this.destino?.nombre}. ` +
                `${fallidas.length} sin colectar: ${motivos}`,
              8
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
