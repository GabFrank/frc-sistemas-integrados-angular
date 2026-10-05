import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { MainService } from '../../../../main.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { esSucursalCompras } from '../../../empresarial/sucursal/sucursal-compras.util';
import { ROLES } from '../../../personas/roles/roles.enum';
import { Producto } from '../producto.model';
import { MovimientoStockService } from '../../../operaciones/movimiento-stock/movimiento-stock.service';
import { MovimientoStock, MovimientoStockInput } from '../../../operaciones/movimiento-stock/movimiento-stock.model';
import { TipoMovimiento } from '../../../operaciones/movimiento-stock/movimiento-stock.enums';
import { ContextoConsulta, QueryError, TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../../shared/services/timeout-link';

/** Stock actual: el error de red y el del servidor llegan al diálogo, que avisa; nunca un 0 inventado (#390). */
const LECTURA_STOCK: QueryError = {
  networkError: { propagate: true, show: false },
  graphError: { propagate: true, show: false },
};
const CONSULTA_STOCK: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };
/** Tolerancia para comparar stocks leídos (cantidades con decimales). */
const EPSILON = 0.0001;

export interface AjustarStockDialogData {
  producto: Producto;
  sucursalPreseleccionada?: Sucursal;
  permitirCambiarSucursal?: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-ajustar-stock-dialog',
  templateUrl: './ajustar-stock-dialog.component.html',
  styleUrls: ['./ajustar-stock-dialog.component.scss']
})
export class AjustarStockDialogComponent implements OnInit {

  @ViewChild('cantidadInput', { static: false }) cantidadInput: ElementRef;

  formGroup: FormGroup;
  sucursalControl = new FormControl(null, Validators.required);
  cantidadControl = new FormControl(null, Validators.required);
  observacionControl = new FormControl();

  sucursales: Sucursal[] = [];
  selectedSucursal: Sucursal;
  stockActual: number = 0;
  isLoadingStock = false;
  /**
   * El ajuste manda la DIFERENCIA contra el stock actual y el central la suma: sin el stock leído (antes un error
   * lo dejaba en 0) se ajustaría sobre una base falsa. Guardar exige el stock de la sucursal actual (#390).
   */
  stockCargado = false;
  stockFallo = false;
  sucursalesFallo = false;
  /**
   * Un guardado quedó sin respuesta: pudo haberse aplicado (o aplicarse después). Se recuerda la base y la
   * diferencia enviadas para reconocerlo al releer, y no se permite otro intento a ciegas (duplicaría el ajuste).
   * Es de UNA sucursal: mientras exista no se puede cambiar de sucursal (un segundo pendiente pisaría a este).
   */
  ajusteSinConfirmar: { sucursalId: number; base: number; diferencia: number; avisado?: boolean } | null = null;
  /** El pendiente es de la sucursal elegida (para el template y el bloqueo). */
  pendienteEnSucursal = false;
  private sucursalBloqueadaPorPendiente = false;
  guardando = false;
  /** Solo aplica la última lectura de stock (cambio de sucursal, reintentos). */
  private lecturaStock = 0;
  permitirCambiarSucursal: boolean = true;
  diferencia: number = 0;
  /** Sin este rol COMPRAS no se puede ajustar: ajustar exige ver su stock, que está oculto. */
  puedeVerStockCompras = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AjustarStockDialogData,
    private dialogRef: MatDialogRef<AjustarStockDialogComponent>,
    private sucursalService: SucursalService,
    private movimientoStockService: MovimientoStockService,
    private notificacionService: NotificacionSnackbarService,
    private cargandoService: CargandoDialogService,
    private mainService: MainService
  ) {}

  ngOnInit(): void {
    this.puedeVerStockCompras = this.mainService.tieneAlgunRol([ROLES.VER_STOCK_COMPRAS]);
    // Antes de cargarSucursales(): con una sucursal preseleccionada, esa es la que pide el stock.
    if (!this.puedeVerStockCompras && esSucursalCompras(this.data.sucursalPreseleccionada)) {
      // El template se renderiza igual hasta que termina de cerrar y liga [formGroup].
      this.createForm();
      this.notificacionService.openWarn('Sin permiso para ajustar el stock de COMPRAS');
      this.dialogRef.close(false);
      return;
    }
    this.configurarSucursalPreseleccionada();
    this.createForm();
    this.cargarSucursales();
  }

  configurarSucursalPreseleccionada(): void {
    this.permitirCambiarSucursal = this.data.permitirCambiarSucursal !== false;
    
    if (this.data.sucursalPreseleccionada) {
      this.selectedSucursal = this.data.sucursalPreseleccionada;
      this.sucursalControl.setValue(this.data.sucursalPreseleccionada.id);
      
      if (!this.permitirCambiarSucursal) {
        this.sucursalControl.disable();
      }
    }
  }

  createForm(): void {
    this.formGroup = new FormGroup({
      sucursal: this.sucursalControl,
      cantidad: this.cantidadControl,
      observacion: this.observacionControl
    });

    this.sucursalControl.valueChanges.pipe(untilDestroyed(this)).subscribe(sucursalId => {
      if (sucursalId) {
        this.selectedSucursal = this.sucursales.find(s => s.id === sucursalId);
        this.cargarStockActual();
      }
    });

    this.cantidadControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.calcularDiferencia();
    });
  }

  cargarSucursales() {
    this.sucursalesFallo = false;
    this.sucursalService.onGetAllSucursales(true, { networkError: { propagate: true, show: false } },
      { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true }).subscribe({ error: () => {
      this.sucursalesFallo = true;
      this.notificacionService.openWarn('No se pudieron cargar las sucursales: usá «Reintentar».', 5);
    }, next: res => {
      if (res == null) {
        this.sucursalesFallo = true; // error del servidor: ya se avisó
        return;
      }
      this.sucursales = res?.filter(sucursal =>
        sucursal.nombre != "SERVIDOR" &&
        (this.puedeVerStockCompras || !esSucursalCompras(sucursal)));
      
      if (this.data.sucursalPreseleccionada && this.selectedSucursal) {
        this.cargarStockActual();
      }
    } })
  }

  reintentarSucursales(): void {
    this.cargarSucursales();
  }

  /** «Reintentar» / «Volver a leer» del template. */
  volverALeerStock(): void {
    this.cargarStockActual();
  }

  cargarStockActual(): void {
    if (!this.data.producto?.id || !this.selectedSucursal?.id) return;

    const lectura = ++this.lecturaStock;
    this.isLoadingStock = true;
    this.stockCargado = false;
    this.stockFallo = false;
    this.pendienteEnSucursal = this.ajusteSinConfirmar?.sucursalId === this.selectedSucursal.id;
    this.movimientoStockService.onGetStockPorProducto(this.data.producto.id, this.selectedSucursal.id, true,
      LECTURA_STOCK, CONSULTA_STOCK)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (stock) => {
          if (lectura !== this.lecturaStock) return; // respuesta de otra sucursal o de un intento anterior
          this.isLoadingStock = false;
          if (stock == null) {
            // El central devuelve 0 cuando no hay movimientos: un null es un fallo, no «sin stock»
            this.marcarStockSinLeer();
            return;
          }
          this.aplicarStockLeido(stock);
        },
        error: () => {
          if (lectura !== this.lecturaStock) return;
          this.isLoadingStock = false;
          this.marcarStockSinLeer();
        }
      });
  }

  private marcarStockSinLeer(): void {
    this.stockFallo = true;
    this.notificacionService.openWarn(this.pendienteEnSucursal
      ? 'No se pudo confirmar el ajuste ni volver a leer el stock: pudo haberse aplicado. Usá «Reintentar» antes de ajustar de nuevo.'
      : 'No se pudo leer el stock actual: usá «Reintentar» antes de ajustar.', this.pendienteEnSucursal ? 10 : 5);
  }

  private aplicarStockLeido(stock: number): void {
    const pendiente = this.pendienteEnSucursal ? this.ajusteSinConfirmar : null;
    this.stockActual = stock;
    if (pendiente != null) {
      if (Math.abs(stock - (pendiente.base + pendiente.diferencia)) < EPSILON) {
        // El ajuste que quedó sin respuesta sí se aplicó
        this.ajusteSinConfirmar = null;
        this.notificacionService.openGuardadoConExito();
        this.dialogRef.close(true);
        return;
      }
      if (Math.abs(stock - pendiente.base) < EPSILON) {
        // Sigue igual: el central puede aplicarlo todavía. No se habilita otro intento (lo duplicaría).
        this.notificacionService.openWarn(
          'El ajuste anterior todavía no se ve aplicado: esperá unos segundos y usá «Volver a leer» antes de reintentar.', 8);
        this.calcularDiferencia();
        return;
      }
      // Ni la base ni la base ajustada: hubo otros movimientos (ventas, otro ajuste)
      if (!pendiente.avisado) {
        // Primera vez: se muestran los números y se pide una relectura explícita antes de habilitar
        pendiente.avisado = true;
        this.notificacionService.openWarn(
          `El stock cambió (era ${pendiente.base}, ahora ${stock}; el ajuste enviado era de ${pendiente.diferencia}): `
          + 'no se pudo confirmar si se aplicó. Revisá y usá «Volver a leer» antes de ajustar.', 10);
        this.calcularDiferencia();
        return;
      }
      // Releído a pedido del usuario: se parte del valor nuevo
      this.ajusteSinConfirmar = null;
      this.pendienteEnSucursal = false;
      if (this.sucursalBloqueadaPorPendiente) {
        this.sucursalBloqueadaPorPendiente = false;
        this.sucursalControl.enable({ emitEvent: false });
      }
    }
    this.stockCargado = true;
    this.cantidadControl.setValue(this.stockActual);
    this.calcularDiferencia();
    setTimeout(() => {
      if (this.cantidadInput) {
        this.cantidadInput.nativeElement.focus();
        this.cantidadInput.nativeElement.select();
      }
    }, 100);
  }

  calcularDiferencia(): void {
    const nuevaCantidad = this.cantidadControl.value || 0;
    this.diferencia = nuevaCantidad - this.stockActual;
  }

  onGuardar(): void {
    // Acá y no solo en el botón: Enter en el campo llama directo a este método
    if (this.guardando || this.isLoadingStock) return;
    if (this.pendienteEnSucursal) {
      this.notificacionService.openWarn('El ajuste anterior no se pudo confirmar: usá «Volver a leer» antes de reintentar.', 6);
      return;
    }
    if (!this.stockCargado) {
      this.notificacionService.openWarn('Todavía no se leyó el stock actual de la sucursal: usá «Reintentar».', 5);
      return;
    }
    if (this.formGroup.invalid) {
      this.notificacionService.openWarn('Por favor complete todos los campos requeridos');
      return;
    }

    const nuevaCantidad = this.cantidadControl.value;
    const diferencia = nuevaCantidad - this.stockActual;

    if (diferencia === 0) {
      this.notificacionService.openWarn('No hay diferencia en el stock para ajustar');
      return;
    }

    const { requestId } = this.cargandoService.openDialog();
    const base = this.stockActual;
    this.guardando = true;

    const movimientoStockInput: MovimientoStockInput = {
      id: 0,
      sucursalId: this.selectedSucursal.id,
      productoId: this.data.producto.id,
      tipoMovimiento: TipoMovimiento.AJUSTE,
      referencia: this.data.producto.id,
      cantidad: diferencia,
      estado: true,
      usuarioId: this.mainService.usuarioActual.id
    };

    this.movimientoStockService.onSaveMovimientoStock(movimientoStockInput)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (movimientoGuardado) => {
          this.cargandoService.closeDialog(requestId);
          this.guardando = false;
          
          if (movimientoGuardado.data) {
            try {
              const data = JSON.parse(movimientoGuardado.data);
              console.log('Información del ajuste:', data);
            } catch (e) {
              console.warn('Error al procesar data del movimiento:', e);
            }
          }
          
          this.notificacionService.openGuardadoConExito();
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.cargandoService.closeDialog(requestId);
          this.guardando = false;
          if (Array.isArray(error)) {
            // El servidor respondió que no (ya lo avisó el servicio): no se aplicó y se puede reintentar
            return;
          }
          // Sin respuesta: pudo haberse aplicado. Se relee el stock y se compara antes de permitir otro intento.
          this.ajusteSinConfirmar = { sucursalId: movimientoStockInput.sucursalId, base, diferencia };
          this.pendienteEnSucursal = true;
          if (this.sucursalControl.enabled) {
            this.sucursalBloqueadaPorPendiente = true;
            this.sucursalControl.disable({ emitEvent: false });
          }
          this.stockCargado = false;
          // Un solo aviso: lo da la relectura (se aplicó / todavía no se ve / cambió / no se pudo leer)
          this.cargarStockActual();
        }
      });
  }

  onCancelar(): void {
    // Con un ajuste sin confirmar la lista se refresca igual: pudo haberse aplicado
    this.dialogRef.close(this.ajusteSinConfirmar != null);
  }




} 