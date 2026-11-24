import { Component, OnInit } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
import { of } from "rxjs";
import { catchError } from "rxjs/operators";
import { PaginacionLista } from "../../../../shared/components/paginacion/paginacion-lista";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { TimbradoDetalle } from "../../timbrado/timbrado.modal";
import { TimbradoService } from "../../timbrado/timbrado.service";
import { EventoInutilizacionDE, EstadoEvento } from "../../evento-inutilizacion-de/evento-inutilizacion-de.model";
import { EventoInutilizacionDEService } from "../../evento-inutilizacion-de/evento-inutilizacion-de.service";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-inutilizacion-numeros-tab",
  templateUrl: "./inutilizacion-numeros-tab.component.html",
  styleUrls: ["./inutilizacion-numeros-tab.component.scss"],
})
export class InutilizacionNumerosTabComponent implements OnInit {

  // Form controls
  sucursalControl = new FormControl(null, Validators.required);
  timbradoDetalleControl = new FormControl(null, Validators.required);
  numeroInicioControl = new FormControl(null, [Validators.required, Validators.min(1)]);
  numeroFinControl = new FormControl(null, [Validators.required, Validators.min(1)]);
  motivoControl = new FormControl(null, Validators.required);
  motivoOtrosControl = new FormControl("");

  // Lists
  sucursalList: Sucursal[] = [];
  timbradoDetalleList: TimbradoDetalle[] = [];

  // Selected values
  selectedSucursal: Sucursal;
  selectedTimbradoDetalle: TimbradoDetalle;

  // Table
  eventosDataSource = new MatTableDataSource<EventoInutilizacionDE>([]);

  /** Eventos de inutilización paginados en el central (#772): cada página con los filtros a la vista. */
  pag: PaginacionLista<EventoInutilizacionDE> = new PaginacionLista<EventoInutilizacionDE>({
    cargar: (page, size) => this.consultarEventos(page, size),
    pageSize: 25,
    pageSizeOptions: [15, 25, 50, 100],
    alCargar: (res) => this.eventosDataSource.data = res.getContent ?? [],
    alFallar: (filtroNuevo) => {
      if (filtroNuevo) this.eventosDataSource.data = [];
    },
  });
  displayedColumns: string[] = [
    "id",
    "fecha",
    "timbrado",
    "establecimiento",
    "puntoExpedicion",
    "numeroInicio",
    "numeroFin",
    "motivo",
    "estado",
    "codigoRespuesta",
    "mensaje"
  ];

  // Motivos predefinidos
  motivosPredefinidos = [
    "Inutilización de números por rechazo definitivo del DE.",
    "Inutilización por salto de numeración generado por error del sistema.",
    "Inutilización por error en la parametrización del timbrado o punto de expedición.",
    "Inutilización por pruebas internas realizadas sin transmisión al SIFEN.",
    "Inutilización por migración o actualización del sistema que dejó numeración inconsistente.",
    "Otros"
  ];

  // Filters
  filtroSucursalControl = new FormControl(null);
  filtroTimbradoControl = new FormControl(null);
  filtroEstadoControl = new FormControl("TODOS");
  filtroFechaInicioControl = new FormControl(null);
  filtroFechaFinControl = new FormControl(null);

  estadosDisponibles = [
    { value: "TODOS", label: "Todos" },
    { value: EstadoEvento.PENDIENTE, label: "Pendiente" },
    { value: EstadoEvento.APROBADO, label: "Aprobado" },
    { value: EstadoEvento.RECHAZADO, label: "Rechazado" },
    { value: EstadoEvento.ERROR_ENVIO, label: "Error Envío" }
  ];

  get isMotivoOtros(): boolean {
    return this.motivoControl.value === "Otros";
  }

  constructor(
    private sucursalService: SucursalService,
    private timbradoService: TimbradoService,
    private eventoInutilizacionService: EventoInutilizacionDEService,
    private notificacionService: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.cargarSucursales();
    this.setupFormListeners();
  }

  cargarSucursales(): void {
    this.sucursalService.onGetAllSucursalesByActive(true, true)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (sucursales) => {
          this.sucursalList = sucursales || [];
        },
        error: (error) => {
          console.error("Error al cargar sucursales:", error);
          this.notificacionService.openWarn("Error al cargar sucursales");
        }
      });
  }

  setupFormListeners(): void {
    // Cuando cambia la sucursal, cargar timbrados
    this.sucursalControl.valueChanges.pipe(untilDestroyed(this)).subscribe((sucursal: Sucursal) => {
      if (sucursal) {
        this.selectedSucursal = sucursal;
        this.timbradoDetalleControl.enable();
        this.cargarTimbradosPorSucursal(sucursal.id);
        // Inicializar filtro de sucursal con la sucursal seleccionada
        this.filtroSucursalControl.setValue(sucursal);
        // Cargar eventos con filtros
        this.pag.filtrar();
      } else {
        this.timbradoDetalleList = [];
        this.timbradoDetalleControl.setValue(null);
        this.timbradoDetalleControl.disable();
        this.eventosDataSource.data = [];
        this.pag.limpiar();
      }
    });

    // Cuando cambia el timbrado detalle
    this.timbradoDetalleControl.valueChanges.pipe(untilDestroyed(this)).subscribe((timbradoDetalle: TimbradoDetalle) => {
      this.selectedTimbradoDetalle = timbradoDetalle;
    });

    // Validar que numeroInicio <= numeroFin
    this.numeroInicioControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.validarRangoNumeros();
    });

    this.numeroFinControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.validarRangoNumeros();
    });

    // Cuando cambia el motivo a "Otros", habilitar el campo de texto
    this.motivoControl.valueChanges.pipe(untilDestroyed(this)).subscribe((motivo) => {
      if (motivo === "Otros") {
        this.motivoOtrosControl.setValidators([Validators.required]);
        this.motivoOtrosControl.updateValueAndValidity();
      } else {
        this.motivoOtrosControl.clearValidators();
        this.motivoOtrosControl.updateValueAndValidity();
        this.motivoOtrosControl.setValue("");
      }
    });
  }

  validarRangoNumeros(): void {
    const inicio = this.numeroInicioControl.value;
    const fin = this.numeroFinControl.value;
    if (inicio != null && fin != null && inicio > fin) {
      this.numeroFinControl.setErrors({ rangoInvalido: true });
    } else {
      this.numeroFinControl.setErrors(null);
    }
  }

  cargarTimbradosPorSucursal(sucursalId: number): void {
    this.timbradoService.onGetTimbradoDetallesBySucursalId(sucursalId, true)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (timbradoDetalles) => {
          // Filtrar solo timbrados electrónicos y activos
          this.timbradoDetalleList = (timbradoDetalles || []).filter(
            (td) => td.activo && td.timbrado?.isElectronico && td.timbrado?.activo
          );
          
          // Si hay solo uno, auto-seleccionarlo
          if (this.timbradoDetalleList.length === 1) {
            this.timbradoDetalleControl.setValue(this.timbradoDetalleList[0]);
            this.selectedTimbradoDetalle = this.timbradoDetalleList[0];
          }
        },
        error: (error) => {
          console.error("Error al cargar timbrados:", error);
          this.notificacionService.openWarn("Error al cargar timbrados para la sucursal seleccionada");
          this.timbradoDetalleList = [];
        }
      });
  }

  /** Repite la página a la vista (después de inutilizar números). */
  cargarEventosConFiltros(): void {
    this.pag.recargar();
  }

  private consultarEventos(page: number, size: number) {
    const sucursalId = this.filtroSucursalControl.value?.id || this.selectedSucursal?.id;
    const timbradoId = this.filtroTimbradoControl.value?.id || null;
    const estado = this.filtroEstadoControl.value !== "TODOS" ? (this.filtroEstadoControl.value as EstadoEvento) : null;
    
    // Convertir fechas a formato string para el servidor
    let fechaInicio: string = null;
    let fechaFin: string = null;
    
    if (this.filtroFechaInicioControl.value) {
      const fecha = new Date(this.filtroFechaInicioControl.value);
      fechaInicio = fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    }
    
    if (this.filtroFechaFinControl.value) {
      const fecha = new Date(this.filtroFechaFinControl.value);
      fechaFin = fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    }

    return this.eventoInutilizacionService.onGetEventosConFiltros(
      sucursalId,
      timbradoId,
      estado,
      fechaInicio,
      fechaFin,
      page,
      size,
      true
    ).pipe(
      catchError((error) => {
        console.error("Error al cargar eventos:", error);
        this.notificacionService.openWarn("Error al cargar eventos de inutilización");
        return of(null);
      })
    );
  }

  onGuardar(): void {
    if (!this.sucursalControl.valid || 
        !this.timbradoDetalleControl.valid || 
        !this.numeroInicioControl.valid || 
        !this.numeroFinControl.valid || 
        !this.motivoControl.valid) {
      this.notificacionService.openWarn("Por favor complete todos los campos requeridos");
      return;
    }

    if (this.isMotivoOtros && !this.motivoOtrosControl.valid) {
      this.notificacionService.openWarn("Por favor ingrese el motivo");
      return;
    }

    const motivo = this.isMotivoOtros 
      ? this.motivoOtrosControl.value 
      : this.motivoControl.value;

    const timbrado = this.selectedTimbradoDetalle.timbrado;
    const establecimiento = this.selectedSucursal.codigoEstablecimientoFactura;
    if (!establecimiento) {
      this.notificacionService.openWarn("La sucursal seleccionada no tiene código de establecimiento configurado");
      return;
    }
    const puntoExpedicion = this.selectedTimbradoDetalle.puntoExpedicion;

    this.eventoInutilizacionService.onInutilizarNumeros(
      timbrado.id,
      establecimiento,
      puntoExpedicion,
      this.numeroInicioControl.value,
      this.numeroFinControl.value,
      motivo,
      this.selectedSucursal.id,
      this.selectedTimbradoDetalle.id,
      true
    ).pipe(untilDestroyed(this))
    .subscribe({
      next: (evento) => {
        // Mostrar mensaje según el estado del evento
        if (evento.estado === EstadoEvento.APROBADO) {
          this.notificacionService.openGuardadoConExito();
        } else if (evento.estado === EstadoEvento.RECHAZADO) {
          // No es un error, es una respuesta válida de SIFEN
          const mensaje = evento.mensajeRespuesta || "SIFEN rechazó la inutilización";
          this.notificacionService.notification$.next({
            texto: `SIFEN rechazó la inutilización: ${mensaje}`,
            color: "warn" as any,
            duracion: 6
          });
        } else if (evento.estado === EstadoEvento.PENDIENTE) {
          this.notificacionService.notification$.next({
            texto: "Evento registrado. Pendiente de procesamiento por SIFEN.",
            color: "info" as any,
            duracion: 4
          });
        } else {
          this.notificacionService.openGuardadoConExito();
        }
        
        // Limpiar formulario
        this.numeroInicioControl.setValue(null);
        this.numeroFinControl.setValue(null);
        this.motivoControl.setValue(null);
        this.motivoOtrosControl.setValue("");
        
        // Limpiar filtros
        this.onLimpiarFiltros();
        
        // Recargar eventos
        this.cargarEventosConFiltros();
      },
      error: (error) => {
        console.error("Error al inutilizar números:", error);
        // Extraer mensaje amigable del error
        let mensaje = "Error al inutilizar números";
        if (error?.message) {
          // Si el mensaje contiene información de SIFEN, extraerla
          const mensajeCompleto = error.message;
          if (mensajeCompleto.includes("SIFEN")) {
            // Extraer el mensaje después de "SIFEN"
            const match = mensajeCompleto.match(/SIFEN[^:]*:\s*(.+?)(?:,|$)/);
            if (match && match[1]) {
              mensaje = `SIFEN: ${match[1].trim()}`;
            } else {
              mensaje = mensajeCompleto.replace(/Error al inutilizar números:\s*/i, "");
            }
          } else {
            mensaje = mensajeCompleto.replace(/Error al inutilizar números:\s*/i, "");
          }
        }
        this.notificacionService.notification$.next({
          texto: `Ups, ocurrió un error: ${mensaje}`,
          color: "danger" as any,
          duracion: 5
        });
      }
    });
  }

  onCancelar(): void {
    this.numeroInicioControl.setValue(null);
    this.numeroFinControl.setValue(null);
    this.motivoControl.setValue(null);
    this.motivoOtrosControl.setValue("");
  }

  onFiltrar(): void {
    this.pag.filtrar();
  }

  onLimpiarFiltros(): void {
    // Mantener el filtro de sucursal si hay una sucursal seleccionada en el formulario
    if (!this.selectedSucursal) {
      this.filtroSucursalControl.setValue(null);
    } else {
      this.filtroSucursalControl.setValue(this.selectedSucursal);
    }
    this.filtroTimbradoControl.setValue(null);
    this.filtroEstadoControl.setValue("TODOS");
    this.filtroFechaInicioControl.setValue(null);
    this.filtroFechaFinControl.setValue(null);
    this.pag.filtrar();
  }

  getEstadoLabel(estado: EstadoEvento): string {
    const estadoMap = {
      [EstadoEvento.PENDIENTE]: "Pendiente",
      [EstadoEvento.APROBADO]: "Aprobado",
      [EstadoEvento.RECHAZADO]: "Rechazado",
      [EstadoEvento.ERROR_ENVIO]: "Error Envío"
    };
    return estadoMap[estado] || estado;
  }

  getEstadoClass(estado: EstadoEvento): string {
    const classMap = {
      [EstadoEvento.PENDIENTE]: "estado-pendiente",
      [EstadoEvento.APROBADO]: "estado-aprobado",
      [EstadoEvento.RECHAZADO]: "estado-rechazado",
      [EstadoEvento.ERROR_ENVIO]: "estado-error"
    };
    return classMap[estado] || "";
  }
}

