import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { Subject, timer } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { avisoTrasMutacion, erroresDeRechazo, RECARGA_TRAS_CORTE_MS } from "../../../../commons/core/utils/graphqlErrorUtils";

import { GenericCrudService, PROPAGAR_ERROR_DE_RED } from "../../../../generics/generic-crud.service";
import { TIMEOUT_POR_DEFECTO_MS } from "../../../../shared/services/timeout-link";

/** Consolidado y remito: sus error: ya existían y eran inalcanzables (#390). */
const CONSULTA_PANTALLA = { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true };
import { MainService } from "../../../../main.service";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { Tab } from "../../../../layouts/tab/tab.model";
import { TabService } from "../../../../layouts/tab/tab.service";
import { ConfiguracionService } from "../../../../shared/services/configuracion.service";
import { DevolucionConfiguracionService } from "../configuracion/devolucion-configuracion.service";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { Proveedor } from "../../../personas/proveedor/proveedor.model";
import { ReporteService } from "../../../reportes/reporte.service";
import { ReportesComponent } from "../../../reportes/reportes/reportes.component";

import {
  RetiroBloqueResultado,
  RetiroDevolucionView,
  RetiroProveedorConsolidado,
  RetiroResultadoView,
  RetiroSucursalGrupo,
  RetiroSucursalGrupoView,
} from "./retiro-proveedor.model";
import { RetiroProveedorConsolidadoGQL } from "./graphql/retiroProveedorConsolidado";
import { RemitoRetiroProveedorGQL } from "./graphql/remitoRetiroProveedor";
import { ImprimirTicketRetiroProveedorGQL } from "./graphql/imprimirTicketRetiroProveedor";
import { RetirarDevolucionesEnBloqueGQL } from "./graphql/retirarDevolucionesEnBloque";

@Component({
  selector: "app-retiro-proveedor",
  templateUrl: "./retiro-proveedor.component.html",
  styleUrls: ["./retiro-proveedor.component.scss"],
})
export class RetiroProveedorComponent implements OnInit, OnDestroy {
  // Proveedor opcional pasado por Tab (ej. desde el aviso de Compras): se
  // precarga el consolidado con ese proveedor ya filtrado.
  @Input() data?: Tab;

  private destroy$ = new Subject<void>();

  proveedorControl = new FormControl<Proveedor | null>(null);
  proveedorSeleccionado: Proveedor | null = null;

  // Estado de la vista
  buscando = false;
  guardando = false;
  imprimiendo = false;
  imprimiendoTicket = false;

  consolidado: RetiroProveedorConsolidado | null = null;
  grupos: RetiroSucursalGrupoView[] = [];

  // Columnas de las tablas
  lineasColumns = ["codigo", "descripcion", "presentacion", "cantidadTotal"];
  resultadosColumns = ["id", "estado", "mensaje"];

  // Selección (a nivel devolución, por devolucionIds)
  private selectedDevolucionIds = new Set<string>();
  selectedDevolucionIdsArray: string[] = [];
  totalDevoluciones = 0;

  // Resultados del último retiro en bloque
  resultados: RetiroResultadoView[] = [];

  // Sucursal física del puesto. Cuando el desktop habla con central, el backend
  // responde la sucursal "SERVIDOR" (id 0) y mainService.isServidor queda true:
  // ahí se ven todas las sucursales. Si en cambio estamos contra una filial, el
  // retiro se restringe a esa sucursal: la mercadería está físicamente ahí y el
  // stock se descuenta por devolucion.sucursalOrigen. Ver main.service.ts:170.
  sucursalFija: Sucursal | null = null;
  nombreSucursalFija = "";

  // TODO: leer del módulo de registro de impresoras cuando exista.
  // Se sobrescribe con la config del módulo al iniciar.
  private anchoTicketMmDefault = 58;

  constructor(
    private genericService: GenericCrudService,
    private retiroConsolidadoGQL: RetiroProveedorConsolidadoGQL,
    private remitoGQL: RemitoRetiroProveedorGQL,
    private ticketRetiroGQL: ImprimirTicketRetiroProveedorGQL,
    private retirarEnBloqueGQL: RetirarDevolucionesEnBloqueGQL,
    private configService: ConfiguracionService,
    private devolucionConfigService: DevolucionConfiguracionService,
    private notificacionService: NotificacionSnackbarService,
    private reporteService: ReporteService,
    private tabService: TabService,
    public mainService: MainService
  ) {}

  ngOnInit(): void {
    this.resolverSucursalFija();
    this.precargarProveedor();
    // Ancho de ticket desde la config del módulo.
    this.devolucionConfigService
      .onGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe((c) => {
        if (c?.ticketAnchoMm != null) this.anchoTicketMmDefault = c.ticketAnchoMm;
      });
  }

  /** Si llegó un proveedor por Tab (ej. aviso de Compras), lo filtra de una. */
  private precargarProveedor(): void {
    const proveedor: Proveedor | undefined = this.data?.tabData?.data;
    if (proveedor?.id != null) {
      this.proveedorSeleccionado = proveedor;
      this.proveedorControl.setValue(proveedor, { emitEvent: false });
      this.cargarConsolidado();
    }
  }

  /** Fija la sucursal cuando el puesto está en una filial (no en el servidor central). */
  private resolverSucursalFija(): void {
    const sucursal = this.mainService.sucursalActual;
    if (!this.mainService.isServidor && sucursal?.id != null) {
      this.sucursalFija = sucursal;
      this.nombreSucursalFija = sucursal.nombre;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== Proveedor =====
  onProveedorSeleccionado(proveedor: Proveedor): void {
    if (!proveedor || !proveedor.id) {
      return;
    }
    this.proveedorSeleccionado = proveedor;
    this.cargarConsolidado();
  }

  onRemoverProveedor(): void {
    this.proveedorSeleccionado = null;
    this.proveedorControl.setValue(null);
    this.consolidado = null;
    this.grupos = [];
    this.resultados = [];
    this.selectedDevolucionIds.clear();
    this.selectedDevolucionIdsArray = [];
    this.totalDevoluciones = 0;
  }

  // ===== Carga del consolidado =====
  /** El consolidado no cargó: la pantalla dice «No se pudo cargar», no «sin devoluciones». */
  consolidadoFallo = false;

  cargarConsolidado(): void {
    if (!this.proveedorSeleccionado?.id) {
      return;
    }
    this.buscando = true;
    this.resultados = [];
    this.genericService
      .onCustomQuery(this.retiroConsolidadoGQL, {
        proveedorId: this.proveedorSeleccionado.id,
        // Filtro en el servidor, no en el HTML: si el puesto está en una filial,
        // no debe siquiera traer devoluciones de otras sucursales.
        sucursalId: this.sucursalFija?.id ?? null,
      }, true, PROPAGAR_ERROR_DE_RED, undefined, CONSULTA_PANTALLA)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: RetiroProveedorConsolidado) => {
          this.buscando = false;
          this.consolidadoFallo = data == null;
          this.consolidado = data || null;
          this.buildGrupos(data);
        },
        error: () => {
          this.buscando = false;
          // Sin el consolidado no se ofrece retirar sobre el de antes (p. ej. tras retirar) (#390).
          this.consolidadoFallo = true;
          this.consolidado = null;
          this.buildGrupos(null);
          this.notificacionService.openAlgoSalioMal(
            "Error al cargar el consolidado de devoluciones"
          );
        },
      });
  }

  private buildGrupos(data: RetiroProveedorConsolidado | null): void {
    // Selección: todo seleccionado por defecto.
    this.selectedDevolucionIds.clear();

    const gruposBackend: RetiroSucursalGrupo[] = data?.grupos || [];
    this.grupos = gruposBackend.map((grupo) => {
      const devolucionIds = (grupo.devolucionIds || []).map((id) => String(id));
      devolucionIds.forEach((id) => this.selectedDevolucionIds.add(id));

      const devoluciones: RetiroDevolucionView[] = devolucionIds.map((id) => ({
        id,
        seleccionado: true,
      }));

      return {
        sucursalId: grupo.sucursalId,
        sucursalNombre: grupo.sucursalNombre,
        lineas: grupo.lineas || [],
        devoluciones,
        todasSeleccionadas: devoluciones.length > 0,
      };
    });

    this.recomputeSeleccion();
  }

  // ===== Selección =====
  onToggleDevolucion(
    grupo: RetiroSucursalGrupoView,
    devolucion: RetiroDevolucionView,
    checked: boolean
  ): void {
    devolucion.seleccionado = checked;
    if (checked) {
      this.selectedDevolucionIds.add(devolucion.id);
    } else {
      this.selectedDevolucionIds.delete(devolucion.id);
    }
    this.recomputeSeleccion();
  }

  onToggleGrupo(grupo: RetiroSucursalGrupoView, checked: boolean): void {
    grupo.devoluciones.forEach((dev) => {
      dev.seleccionado = checked;
      if (checked) {
        this.selectedDevolucionIds.add(dev.id);
      } else {
        this.selectedDevolucionIds.delete(dev.id);
      }
    });
    this.recomputeSeleccion();
  }

  private recomputeSeleccion(): void {
    this.selectedDevolucionIdsArray = Array.from(this.selectedDevolucionIds);

    let total = 0;
    this.grupos.forEach((grupo) => {
      total += grupo.devoluciones.length;
      grupo.todasSeleccionadas =
        grupo.devoluciones.length > 0 &&
        grupo.devoluciones.every((dev) => dev.seleccionado);
    });
    this.totalDevoluciones = total;
  }

  // ===== Imprimir ticket térmico (el backend imprime, devuelve ok) =====
  onImprimirTicket(): void {
    if (this.imprimiendoTicket || this.selectedDevolucionIdsArray.length === 0) {
      return;
    }
    this.imprimiendoTicket = true;
    this.genericService
      .onCustomMutation(this.ticketRetiroGQL, {
        devolucionIds: this.selectedDevolucionIdsArray,
        printerName: this.configService?.getConfig()?.printers?.ticket,
        anchoMm: this.anchoTicketMmDefault,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ok: boolean) => {
          this.imprimiendoTicket = false;
          if (ok) {
            this.notificacionService.openSucess("Ticket enviado a la impresora");
          } else {
            this.notificacionService.openWarn("No se pudo imprimir el ticket");
          }
        },
        error: () => {
          this.imprimiendoTicket = false;
          this.notificacionService.openAlgoSalioMal(
            "Error al imprimir el ticket de retiro"
          );
        },
      });
  }

  // ===== Imprimir remito (PDF Base64) =====
  onImprimirRemito(): void {
    if (this.imprimiendo || this.selectedDevolucionIdsArray.length === 0) {
      return;
    }
    this.imprimiendo = true;
    this.genericService
      .onCustomQuery(this.remitoGQL, {
        devolucionIds: this.selectedDevolucionIdsArray,
      }, true, PROPAGAR_ERROR_DE_RED, undefined, CONSULTA_PANTALLA)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pdfBase64: string) => {
          this.imprimiendo = false;
          if (pdfBase64) {
            const nombreProveedor =
              this.proveedorSeleccionado?.persona?.nombre || "proveedor";
            this.reporteService.onAdd(
              `Comprobante retiro ${nombreProveedor}`,
              pdfBase64
            );
            this.tabService.addTab(
              new Tab(ReportesComponent, "Reportes", null, null)
            );
          } else {
            this.notificacionService.openWarn(
              "No se pudo generar el comprobante"
            );
          }
        },
        error: () => {
          this.imprimiendo = false;
          this.notificacionService.openAlgoSalioMal(
            "Error al generar el comprobante"
          );
        },
      });
  }

  // ===== Marcar retiro (mutation en bloque) =====
  onMarcarRetiro(): void {
    if (this.guardando || this.selectedDevolucionIdsArray.length === 0) {
      return;
    }
    this.guardando = true;
    this.resultados = [];
    this.genericService
      .onCustomMutation(this.retirarEnBloqueGQL, {
        devolucionIds: this.selectedDevolucionIdsArray,
        usuarioId: this.mainService.usuarioActual?.id,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: RetiroBloqueResultado) => {
          this.resultados = (data?.resultados || []).map((r) => ({
            id: String(r.id),
            ok: !!r.ok,
            mensaje: r.mensaje || "",
          }));

          const exitosos = this.resultados.filter((r) => r.ok).length;
          const fallidos = this.resultados.length - exitosos;
          if (fallidos === 0) {
            this.notificacionService.openSucess(
              `Retiro completado: ${exitosos} devolución(es)`
            );
          } else {
            this.notificacionService.openWarn(
              `Retiro parcial: ${exitosos} ok, ${fallidos} con error`
            );
          }

          // Refrescar la vista tras el retiro (libera el flag al resolver el reload).
          this.cargarConsolidado();
          this.guardando = false;
        },
        // En un rechazo el genérico ya mostró el motivo: el aviso propio lo duplicaba, y sin respuesta mentía (#501)
        error: (err) => {
          if (erroresDeRechazo(err) != null) {
            this.cargarConsolidado();
            this.guardando = false;
            return;
          }
          // Pudo aplicarse: el consolidado se relee después. Reintentar es seguro (rechaza lo ya retirado, una por una)
          const aviso = avisoTrasMutacion(err, "se marcó el retiro");
          if (aviso != null) this.notificacionService.openWarn(aviso, 8);
          timer(RECARGA_TRAS_CORTE_MS).pipe(takeUntil(this.destroy$)).subscribe(() => {
            this.cargarConsolidado();
            this.guardando = false;
          });
        },
      });
  }
}
