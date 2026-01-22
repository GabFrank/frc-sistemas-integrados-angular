import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Inject,
} from "@angular/core";
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from "@angular/forms";
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from "@angular/material/dialog";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatSelect } from "@angular/material/select";
import { Producto } from "../../../../../productos/producto/producto.model";
import { Presentacion } from "../../../../../productos/presentacion/presentacion.model";
import {
  PdvSearchProductoData,
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData,
} from "../../../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import {
  PedidoItem,
  PedidoItemInput,
  PedidoItemEstado,
} from "../../pedido-item.model";
import { CurrencyMask } from "../../../../../../commons/core/utils/numbersUtils";
import { Pedido } from "../../pedido.model";
import { MonedaService } from "../../../../../financiero/moneda/moneda.service";
import { Moneda } from "../../../../../financiero/moneda/moneda.model";
import { PedidoService } from "../../../pedido.service";
import { NotificacionSnackbarService } from "../../../../../../notificacion-snackbar.service";
import { dateToString } from "../../../../../../commons/core/utils/dateUtils";
import { MatButton } from "@angular/material/button";
import { DialogosService } from "../../../../../../shared/components/dialogos/dialogos.service";
import { Sucursal } from "../../../../../empresarial/sucursal/sucursal.model";
import { PedidoItemDistribucion, PedidoItemDistribucionInput } from "../../pedido-item-distribucion.model";
import { ProductoService } from "../../../../../productos/producto/producto.service";
import { MovimientoStockService } from "../../../../../operaciones/movimiento-stock/movimiento-stock.service";
import { TipoMovimiento } from "../../../../../operaciones/movimiento-stock/movimiento-stock.enums";
import { MatTableDataSource } from "@angular/material/table";
import { SelectSucursalesDialogComponent, SelectSucursalesDialogData, SelectSucursalesDialogResult } from "./select-sucursales-dialog.component";

export interface AddEditItemDialogData {
  title: string;
  isEdit: boolean;
  pedido: Pedido;
  item?: PedidoItem;
}

export interface AddEditItemDialogResult {
  item: PedidoItem;
  action: "save" | "cancel";
}

export interface DistribucionItem {
  sucursalInfluencia: Sucursal;
  sucursalEntrega: Sucursal;
  stockActual: number;
  stockActualLoading: boolean;
  cantidadSugerida: number;
  cantidadSugeridaLoading: boolean;
  cantidadPedir: number;
  distribucionId?: number; // Para modo edición
}

@Component({
  selector: "app-add-edit-item-dialog",
  templateUrl: "./add-edit-item-dialog.component.html",
  styleUrls: ["./add-edit-item-dialog.component.scss"],
})
export class AddEditItemDialogComponent implements OnInit {
  @ViewChild("productoInput") productoInput!: ElementRef;
  @ViewChild("bonificacionCheckbox") bonificacionCheckbox!: MatCheckbox;
  @ViewChild("presentacionSelect") presentacionSelect!: MatSelect;
  @ViewChild("precioUnitarioInput") precioUnitarioInput!: ElementRef;
  @ViewChild("precioPorPresentacionInput")
  precioPorPresentacionInput!: ElementRef;
  @ViewChild("vencimientoInput") vencimientoInput!: ElementRef;
  @ViewChild("observacionInput") observacionInput!: ElementRef;
  @ViewChild("guardarBtn", { read: MatButton }) guardarBtn!: MatButton;
  @ViewChild("cancelarBtn", { read: MatButton }) cancelarBtn!: MatButton;

  itemForm: FormGroup;

  // Product data
  selectedProducto: Producto | null = null;
  presentacionesDisponibles: Presentacion[] = [];

  // Computed properties for template
  titleComputed = "";
  canSaveComputed = false;
  productoSelectedComputed = false;
  isBonificacionComputed = false;
  subtotalComputed = 0;
  productoManejaVencimientoComputed = false;

  // Display text computed properties (avoid function calls in template)
  productoDisplayTextComputed = "";
  presentacionDisplayTextComputed = "";
  presentacionSelectedComputed = false;
  cantidadTotalComputed = 0;
  cantidadTotalComputedText = "";
  hasCantidadTotalError = false;

  // Simplified view properties
  stockTotalSimplificadoComputed = 0;
  stockBreakdownTooltipComputed = "";
  cantidadSimplificadaControl = new FormControl(0, [Validators.required, Validators.min(0.01)]);

  // Loading state
  savingComputed = false;

  private _distribucionModo: 'COMPLETA' | 'SIMPLIFICADA' = 'COMPLETA';
  
  get distribucionModo(): 'COMPLETA' | 'SIMPLIFICADA' {
    return this._distribucionModo;
  }
  
  set distribucionModo(value: 'COMPLETA' | 'SIMPLIFICADA') {
    if (this._distribucionModo !== value) {
      this._distribucionModo = value;
      // Actualizar propiedades computadas cuando cambia el modo
      this.updateComputedProperties();
      
      // Si cambia a modo simplificado con múltiples sucursales, limpiar distribuciones existentes
      if (value === 'SIMPLIFICADA' && 
          (this.sucursalesInfluencia.length > 1 || this.sucursalesEntrega.length > 1)) {
        console.log('Cambiando a modo simplificado con múltiples sucursales. Distribuciones antes de limpiar:', this.distribucionesItems.length);
        // Sumar cantidades antes de limpiar (si hay distribuciones)
        if (this.distribucionesItems.length > 0) {
          let sumaTotal = 0;
          this.distribucionesFormArray.controls.forEach(control => {
            const cantidadPedir = control.get('cantidadPedir')?.value || 0;
            sumaTotal += cantidadPedir;
          });
          // Establecer el valor en el control simplificado
          this.cantidadSimplificadaControl.setValue(sumaTotal, { emitEvent: false });
        }
        // Limpiar distribuciones porque en modo simplificado con múltiples sucursales no deben existir
        this.clearDistribuciones();
        console.log('Distribuciones después de limpiar:', this.distribucionesItems.length);
      } else if (value === 'SIMPLIFICADA' && 
                 this.sucursalesInfluencia.length === 1 && 
                 this.sucursalesEntrega.length === 1) {
        // En modo simplificado con una sola combinación, inicializar si no hay distribuciones
        if (this.distribucionesItems.length === 0) {
          this.initializeDistribuciones();
        } else {
          // Si ya hay distribuciones, sumar las cantidades
          let sumaTotal = 0;
          this.distribucionesFormArray.controls.forEach(control => {
            const cantidadPedir = control.get('cantidadPedir')?.value || 0;
            sumaTotal += cantidadPedir;
          });
          this.cantidadSimplificadaControl.setValue(sumaTotal, { emitEvent: false });
        }
      }
      
      // Mover el foco al elemento correspondiente según el modo
      setTimeout(() => {
        if (value === 'COMPLETA') {
          // Mover foco al primer input de la lista de distribuciones
          const firstInput = this.getFirstDistribucionInput();
          if (firstInput) {
            firstInput.focus();
            firstInput.select();
          }
        } else if (value === 'SIMPLIFICADA') {
          // Mover foco al input de cantidad total simplificada
          const simplifiedInput = document.querySelector('input.cantidad-simplificada-input') as HTMLInputElement;
          if (simplifiedInput) {
            simplifiedInput.focus();
            simplifiedInput.select();
          }
        }
      }, 100);
    }
  }

  currencyMask = new CurrencyMask();
  selectedCurrencyOptions = null; //select it based on the selected moneda from pedido on dialog data
  selectedCurrencyPrefix = "";
  monedas: Moneda[] = []; // Cache de monedas para buscar la completa si es necesario

  // Almacenar el precio original para comparar cambios
  precioOriginal: number = 0;
  
  // Bandera para evitar validaciones durante la carga inicial de datos
  private isLoadingInitialData = false;

  // Distribuciones
  distribucionesFormArray: FormArray;
  distribucionesItems: DistribucionItem[] = [];
  distribucionesDataSource = new MatTableDataSource<DistribucionItem>([]);
  distribucionesDisplayedColumns: string[] = [
    'sucursalInfluencia',
    'sucursalEntrega',
    'stockActual',
    'cantidadSugerida',
    'cantidadPedir',
    'acciones'
  ];
  sucursalesInfluencia: Sucursal[] = [];
  sucursalesEntrega: Sucursal[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<AddEditItemDialogComponent>,
    private dialog: MatDialog,
    private monedaService: MonedaService,
    private pedidoService: PedidoService,
    private notificacionService: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    private productoService: ProductoService,
    private movimientoStockService: MovimientoStockService,
    @Inject(MAT_DIALOG_DATA) public data: AddEditItemDialogData
  ) {
    this.initializeForm();
    this.initializeSucursales();
  }

  ngOnInit(): void {
    // Cargar monedas para tener la información completa disponible
    this.loadMonedas();
    
    if (!this.data.isEdit) {
      this.updateComputedProperties();
    }
    this.loadDataIfEdit();
    this.setupFormSubscriptions();
    this.setInitialFocus();
  }

  private loadMonedas(): void {
    this.monedaService.onGetAll().subscribe({
      next: (monedas) => {
        this.monedas = monedas || [];
        // Si la moneda del pedido no está completa, actualizar computed properties
        if (!this.isMonedaCompleta(this.data.pedido.moneda)) {
          this.updateComputedProperties();
        }
      },
      error: (err) => {
        console.error('Error cargando monedas:', err);
        // Continuar con valores por defecto
        this.updateComputedProperties();
      }
    });
  }

  private isMonedaCompleta(moneda: any): boolean {
    return moneda && moneda.denominacion && typeof moneda.denominacion === 'string';
  }

  private getMonedaCompleta(moneda: any): Moneda | null {
    if (!moneda) return null;
    
    // Si ya está completa, retornarla
    if (this.isMonedaCompleta(moneda)) {
      return moneda;
    }
    
    // Si tiene ID, buscar en el cache de monedas
    if (moneda.id && this.monedas.length > 0) {
      const monedaCompleta = this.monedas.find(m => m.id === moneda.id);
      if (monedaCompleta) {
        return monedaCompleta;
      }
    }
    
    // Si no se encuentra, retornar null (se usará valor por defecto)
    return null;
  }

  private initializeForm(): void {
    this.itemForm = this.formBuilder.group({
      productoSearch: [""], // Campo de búsqueda de producto
      producto: [null, [Validators.required]],
      presentacion: [null, [Validators.required]],
      cantidadSolicitada: [0, [Validators.required, Validators.min(0.01)]], // Cantidad en unidades base (calculada desde distribuciones)
      precioUnitarioSolicitado: [0, [Validators.min(0)]],
      precioUnitarioPorPresentacion: [0, [Validators.min(0)]],
      esBonificacion: [false],
      vencimientoEsperado: [null],
      observacion: [""],
      distribuciones: this.formBuilder.array([]) // FormArray para distribuciones
    });
    this.distribucionesFormArray = this.itemForm.get('distribuciones') as FormArray;
  }

  private initializeSucursales(): void {
    // Extraer sucursales del pedido con validación extra
    const pedido = this.data.pedido;
    if (pedido) {
      // Mapear con el wrapper .sucursal (estándar de GraphQL)
      this.sucursalesInfluencia = (pedido.sucursalInfluenciaList || [])
        .map(si => si.sucursal)
        .filter((s): s is Sucursal => s != null && s.id != null);
        
      this.sucursalesEntrega = (pedido.sucursalEntregaList || [])
        .map(se => se.sucursal)
        .filter((s): s is Sucursal => s != null && s.id != null);
    }
  }

  private loadDataIfEdit(): void {
    if (this.data.isEdit && this.data.item) {
      this.isLoadingInitialData = true; // Marcar que estamos cargando datos iniciales
      
      const item = this.data.item;
      this.selectedProducto = item.producto;
      this.presentacionesDisponibles = item.producto?.presentaciones || [];

      // Buscar la presentación correcta en el array por ID para asegurar que sea la misma referencia
      // Esto es necesario para que Angular Material Select la reconozca correctamente
      let presentacionSeleccionada = null;
      if (item.presentacionCreacion && this.presentacionesDisponibles.length > 0) {
        presentacionSeleccionada = this.presentacionesDisponibles.find(
          (p) => p.id === item.presentacionCreacion?.id
        ) || item.presentacionCreacion; // Fallback al original si no se encuentra
      }

      // Calcular precio por presentación basándose en precio unitario y cantidad de presentación
      const precioUnitarioPorPresentacion =
        presentacionSeleccionada && presentacionSeleccionada.cantidad > 0
          ? item.precioUnitarioSolicitado * presentacionSeleccionada.cantidad
          : item.precioUnitarioSolicitado;

      this.itemForm.patchValue({
        productoSearch: item.producto?.descripcion || "",
        producto: item.producto,
        presentacion: presentacionSeleccionada,
        cantidadSolicitada: item.cantidadSolicitada,
        precioUnitarioSolicitado: item.precioUnitarioSolicitado,
        precioUnitarioPorPresentacion: precioUnitarioPorPresentacion,
        esBonificacion: item.esBonificacion,
        vencimientoEsperado: item.vencimientoEsperado,
        observacion: item.observacion,
      });

      // Cargar distribuciones existentes
      this.loadDistribucionesExistentes(item.id);

      // Guardar el precio original para comparar cambios
      this.precioOriginal = item.precioUnitarioSolicitado || 0;

      this.updateComputedProperties();
      
      // Resetear la bandera después de un pequeño delay para permitir que los valueChanges se procesen
      setTimeout(() => {
        this.isLoadingInitialData = false;
      }, 100);
    }
  }

  private setInitialFocus(): void {
    // Si hay producto y presentación ya seleccionados, el foco debe ir al precio
    setTimeout(() => {
      const producto = this.itemForm.get("producto")?.value;
      const presentacion = this.itemForm.get("presentacion")?.value;
      
      if (producto && presentacion) {
        // Si ya hay producto y presentación seleccionados, ir directamente a precio
        if (!this.isBonificacionComputed) {
          this.precioPorPresentacionInput?.nativeElement.focus();
          this.precioPorPresentacionInput?.nativeElement.select();
        } else {
          // Si es bonificación, ir a vencimiento u observación
          if (this.productoManejaVencimientoComputed) {
            this.vencimientoInput?.nativeElement.focus();
          } else {
            this.observacionInput?.nativeElement.focus();
          }
        }
      } else if (producto && !presentacion) {
        // Si hay producto pero no presentación, ir al select de presentación
        if (this.presentacionesDisponibles.length > 0) {
          this.presentacionSelect?.focus();
          setTimeout(() => {
            this.presentacionSelect?.open();
          }, 100);
        } else {
          // Si no hay presentaciones disponibles, ir a precio
          if (!this.isBonificacionComputed) {
            this.precioPorPresentacionInput?.nativeElement.focus();
            this.precioPorPresentacionInput?.nativeElement.select();
          }
        }
      } else {
        // Si no hay producto, el foco ya está en el input de búsqueda
      }
    }, 300);
  }

  private setupFormSubscriptions(): void {
    // Listen to bonificacion changes
    this.itemForm.get("esBonificacion")?.valueChanges.subscribe((value) => {
      if (value) {
        this.itemForm.get("precioUnitarioSolicitado")?.setValue(0);
        this.itemForm.get("precioUnitarioSolicitado")?.disable();
        this.itemForm.get("precioUnitarioPorPresentacion")?.setValue(0);
        this.itemForm.get("precioUnitarioPorPresentacion")?.disable();
      } else {
        this.itemForm.get("precioUnitarioSolicitado")?.enable();
        this.itemForm.get("precioUnitarioPorPresentacion")?.enable();
      }
      this.updateComputedProperties();
    });

    // Listen to distribuciones changes
    this.distribucionesFormArray.valueChanges.subscribe(() => {
      this.calculateCantidadTotal();
    });

    // Listen to precio unitario changes
    this.itemForm
      .get("precioUnitarioSolicitado")
      ?.valueChanges.subscribe((value) => {
        this.updatePrecioPorPresentacionFromUnitario(value);
        // La validación se hace en el evento blur, no aquí
      });

    // Listen to precio por presentacion changes
    this.itemForm
      .get("precioUnitarioPorPresentacion")
      ?.valueChanges.subscribe((value) => {
        this.updatePrecioUnitarioFromPresentacion(value);
      });

    // Listen to presentacion changes
    this.itemForm.get("presentacion")?.valueChanges.subscribe(() => {
      this.updatePricesOnPresentacionChange();
      this.updateComputedProperties();
      // Si hay producto y presentación, inicializar distribuciones si no existen
      // Solo si no estamos en modo simplificado con múltiples sucursales
      if (this.itemForm.get("producto")?.value && this.itemForm.get("presentacion")?.value) {
        if (this.distribucionesItems.length === 0 && !this.data.isEdit) {
          const esModoSimplificadoMultiSucursal = this.distribucionModo === 'SIMPLIFICADA' && 
              (this.sucursalesInfluencia.length > 1 || this.sucursalesEntrega.length > 1);
          if (!esModoSimplificadoMultiSucursal) {
            this.initializeDistribuciones();
          }
        }
      }
    });

    // Listen to producto changes
    this.itemForm.get("producto")?.valueChanges.subscribe(() => {
      this.updateComputedProperties();
      // Limpiar distribuciones cuando cambia el producto
      this.clearDistribuciones();
    });

    // Listen to cantidad simplificada changes
    this.cantidadSimplificadaControl.valueChanges.subscribe((value) => {
      if (this.distribucionModo === 'SIMPLIFICADA') {
        this.updateDistribucionesFromSimplified(value || 0);
        // Si no hay distribuciones, actualizar directamente la cantidad total
        if (this.distribucionesItems.length === 0) {
          this.calculateCantidadTotal();
        }
      }
    });

    // La validación de vencimiento se hace en el evento blur, no aquí
  }

  private calculateCantidadTotal(): void {
    let total = 0;
    
    // En modo simplificado sin distribuciones, usar el valor del input simplificado
    if (this.distribucionModo === 'SIMPLIFICADA' && this.distribucionesItems.length === 0) {
      total = this.cantidadSimplificadaControl.value || 0;
    } else {
      // En modo completo o simplificado con distribuciones, sumar las distribuciones
      this.distribucionesFormArray.controls.forEach(control => {
        const cantidadPedir = control.get('cantidadPedir')?.value || 0;
        total += cantidadPedir;
      });
    }
    
    // Las cantidades en distribuciones están en unidades de presentación
    // Mostrar total en unidades de presentación
    this.cantidadTotalComputed = total;
    
    // Convertir a unidades base usando la presentación para guardar en cantidadSolicitada
    const presentacion = this.itemForm.get("presentacion")?.value;
    let cantidadEnUnidadesBase = total;
    if (presentacion && presentacion.cantidad > 0) {
      cantidadEnUnidadesBase = total * presentacion.cantidad;
    }
    
    this.itemForm.get("cantidadSolicitada")?.setValue(cantidadEnUnidadesBase, { emitEvent: false });
    this.hasCantidadTotalError = total <= 0;
    this.updateComputedProperties();
  }

  private updateComputedProperties(): void {
    this.titleComputed = this.data.title;
    
    // Calcular canSaveComputed considerando el modo de distribución
    let formValid = this.itemForm.valid;
    if (this.distribucionModo === 'SIMPLIFICADA') {
      formValid = formValid && this.cantidadSimplificadaControl.valid;
    } else {
      // En modo completo, validar que haya distribuciones y cantidad total > 0
      formValid = formValid && 
                  this.distribucionesItems.length > 0 && 
                  this.cantidadTotalComputed > 0;
    }
    this.canSaveComputed = formValid && !this.savingComputed;
    
    this.productoSelectedComputed = !!this.itemForm.get("producto")?.value;
    this.isBonificacionComputed =
      this.itemForm.get("esBonificacion")?.value || false;
    
    // Obtener moneda completa con validación defensiva
    const monedaCompleta = this.getMonedaCompleta(this.data.pedido.moneda);
    
    if (monedaCompleta) {
      this.selectedCurrencyOptions = this.monedaService.currencyOptionsByMoneda(monedaCompleta);
      this.selectedCurrencyPrefix = monedaCompleta.simbolo || "";
    } else {
      // Valores por defecto si no se puede cargar la moneda
      // Asumir GUARANI como default (comportamiento más común)
      this.selectedCurrencyOptions = this.monedaService.currencyOptionsGuarani;
      this.selectedCurrencyPrefix = this.data.pedido.moneda?.simbolo || "Gs.";
    }

    // Check if product handles expiration
    const producto = this.itemForm.get("producto")?.value;
    this.productoManejaVencimientoComputed = producto?.vencimiento === true;

    // Check if presentacion is selected
    const presentacion = this.itemForm.get("presentacion")?.value;
    this.presentacionSelectedComputed = !!presentacion;

    // Calculate subtotal using base units
    const cantidadBase = this.itemForm.get("cantidadSolicitada")?.value || 0;
    const precio = this.itemForm.get("precioUnitarioSolicitado")?.value || 0;
    this.subtotalComputed = cantidadBase * precio;

    // Update display texts (avoid function calls in template)
    this.productoDisplayTextComputed = producto
      ? `${producto.descripcion} (${producto.codigoPrincipal})`
      : "Seleccionar producto...";

    this.presentacionDisplayTextComputed = presentacion
      ? `${presentacion.descripcion} (x${presentacion.cantidad})`
      : "Seleccionar presentación...";

    // Update simplified stock and tooltip
    this.stockTotalSimplificadoComputed = 0;
    let tooltipText = "Desglose por Sucursal:\n";
    this.distribucionesItems.forEach(item => {
      const stock = item.stockActual || 0;
      if (stock > 0) {
        this.stockTotalSimplificadoComputed += stock;
      }
      tooltipText += `${item.sucursalInfluencia.nombre}: ${this.getCantidadPorPresentacion(stock).toFixed(2)} (${stock} unidades)\n`;
    });
    this.stockBreakdownTooltipComputed = tooltipText;

    // Update cantidad total computed text
    if (presentacion) {
      if (presentacion.cantidad > 1) {
        this.cantidadTotalComputedText = `${this.cantidadTotalComputed} ${presentacion.descripcion} (${cantidadBase} unidades)`;
      } else {
        this.cantidadTotalComputedText = `${cantidadBase} unidades`;
      }
    } else {
      this.cantidadTotalComputedText = "";
    }
  }

  private updatePrecioPorPresentacionFromUnitario(
    precioUnitario: number
  ): void {
    if (this.isBonificacionComputed) return;

    const presentacion = this.itemForm.get("presentacion")?.value;
    if (presentacion && presentacion.cantidad) {
      const precioPorPresentacion = precioUnitario * presentacion.cantidad;
      this.itemForm
        .get("precioUnitarioPorPresentacion")
        ?.setValue(precioPorPresentacion, { emitEvent: false });
    }
    this.updateComputedProperties();
  }

  private updatePrecioUnitarioFromPresentacion(
    precioPorPresentacion: number
  ): void {
    if (this.isBonificacionComputed) return;

    const presentacion = this.itemForm.get("presentacion")?.value;
    if (presentacion && presentacion.cantidad > 0) {
      const precioUnitario = precioPorPresentacion / presentacion.cantidad;
      this.itemForm
        .get("precioUnitarioSolicitado")
        ?.setValue(precioUnitario, { emitEvent: false });
    }
    this.updateComputedProperties();
  }

  private updatePricesOnPresentacionChange(): void {
    // When presentacion changes, recalculate the precio por presentacion based on current unitario
    const precioUnitario =
      this.itemForm.get("precioUnitarioSolicitado")?.value || 0;
    this.updatePrecioPorPresentacionFromUnitario(precioUnitario);
  }

  // Product search functionality similar to edit-transferencia.component.ts
  onSearchProducto(): void {
    const searchText = this.itemForm.get("productoSearch")?.value || "";

    const dialogData: PdvSearchProductoData = {
      texto: searchText,
      cantidad: 1,
      mostrarStock: false,
      conservarUltimaBusqueda: true,
    };

    const dialogRef = this.dialog.open(PdvSearchProductoDialogComponent, {
      height: "80%",
      data: dialogData,
    });

    dialogRef
      .afterClosed()
      .subscribe((result: PdvSearchProductoResponseData) => {
        if (result && result.producto && result.presentacion) {
          console.log(result);
          this.onProductoSelected(result.producto, result.presentacion);
        }

        // based on some condition, move focus
        setTimeout(() => {
          if (!result.producto) {
            this.productoInput?.nativeElement.select();
          } else if (!result.presentacion) {
            this.presentacionSelect?.focus();
            setTimeout(() => {
              this.presentacionSelect?.open();
            }, 100);
          } else {
            // Si hay producto y presentación, ir a precio
            if (!this.isBonificacionComputed) {
              this.precioPorPresentacionInput?.nativeElement.focus();
              this.precioPorPresentacionInput?.nativeElement.select();
            }
          }
        }, 500);
      });
  }

  onProductoSelected(producto: Producto, presentacion?: Presentacion): void {
    this.isLoadingInitialData = true; // Marcar que estamos cargando datos iniciales
    
    this.selectedProducto = producto;
    this.presentacionesDisponibles = producto.presentaciones || [];

    // Solo seleccionar automáticamente la primera presentación si NO se proporcionó una presentación
    // y hay exactamente una presentación disponible
    // Si se proporcionó una presentación, usarla (modo edición o selección previa)
    // Si NO se proporcionó y hay múltiples presentaciones, dejar null para que el usuario seleccione
    const presentacionSeleccionada = presentacion ||
      (this.presentacionesDisponibles.length === 1
        ? this.presentacionesDisponibles[0]
        : null);

    const precioInicial = producto?.costo?.ultimoPrecioCompra || 0;
    
    this.itemForm.patchValue(
      {
        productoSearch: producto.descripcion,
        producto: producto,
        presentacion: presentacionSeleccionada,
        precioUnitarioSolicitado: precioInicial,
      }
    );

    // Guardar el precio original para comparar cambios
    this.precioOriginal = precioInicial;

    this.updateComputedProperties();
    
    // Resetear la bandera después de un pequeño delay
    setTimeout(() => {
      this.isLoadingInitialData = false;
    }, 100);

    // Inicializar distribuciones si hay producto y presentación seleccionados
    // Solo si no estamos en modo simplificado con múltiples sucursales
    if (presentacionSeleccionada && this.distribucionesItems.length === 0 && !this.data.isEdit) {
      const esModoSimplificadoMultiSucursal = this.distribucionModo === 'SIMPLIFICADA' && 
          (this.sucursalesInfluencia.length > 1 || this.sucursalesEntrega.length > 1);
      if (!esModoSimplificadoMultiSucursal) {
        this.initializeDistribuciones();
      }
    }

    // Manejar el foco inicial según si la presentación ya fue proporcionada
    setTimeout(() => {
      // Si la presentación ya fue proporcionada (previamente seleccionada o modo edición), ir directamente a precio
      if (presentacion || (this.presentacionesDisponibles.length === 1 && presentacionSeleccionada)) {
        if (!this.isBonificacionComputed) {
          this.precioPorPresentacionInput?.nativeElement.focus();
          this.precioPorPresentacionInput?.nativeElement.select();
        } else {
          // Si es bonificación, ir a vencimiento u observación
          if (this.productoManejaVencimientoComputed) {
            this.vencimientoInput?.nativeElement.focus();
          } else {
            this.observacionInput?.nativeElement.focus();
          }
        }
      } else if (this.presentacionesDisponibles.length > 1) {
        // Si hay más de una presentación y no fue proporcionada, mover el foco al select y abrirlo
        this.presentacionSelect?.focus();
        // Abrir el panel del select programáticamente
        setTimeout(() => {
          this.presentacionSelect?.open();
        }, 100);
      } else if (this.presentacionesDisponibles.length === 0) {
        // Si no hay presentaciones disponibles, ir a precio
        if (!this.isBonificacionComputed) {
          this.precioPorPresentacionInput?.nativeElement.focus();
          this.precioPorPresentacionInput?.nativeElement.select();
        }
      }
    }, 200);
  }

  // Keyboard navigation methods
  onProductoSearchKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      this.onSearchProducto();
    }
  }

  // Removed onCantidadKeydown - cantidad is now calculated from distributions

  onBonificacionKeydown(event: KeyboardEvent): void {
    // if (event.key === "Enter") {
    //   event.preventDefault();
    //   this.presentacionSelect?.nativeElement.focus();
    // }
  }

  onPresentacionKeydown(event: KeyboardEvent): void {
    // No hacer nada aquí, la navegación se maneja en onPresentacionClosed
  }

  onPresentacionClosed(): void {
    // Cuando el select se cierra después de seleccionar, mover el foco a precio por presentación
    setTimeout(() => {
      // Validar que la presentación esté seleccionada antes de navegar
      const presentacion = this.itemForm.get("presentacion")?.value;
      if (presentacion && this.itemForm.get("presentacion")?.valid) {
        if (!this.isBonificacionComputed) {
          this.precioPorPresentacionInput?.nativeElement.focus();
          this.precioPorPresentacionInput?.nativeElement.select();
        } else {
          // Si es bonificación, ir a vencimiento u observación
          if (this.productoManejaVencimientoComputed) {
            this.vencimientoInput?.nativeElement.focus();
          } else {
            this.observacionInput?.nativeElement.focus();
          }
        }
      }
    }, 100);
  }

  onPrecioPorPresentacionKeydown(event: KeyboardEvent): void {
    if (
      event.key === "Enter" &&
      this.itemForm.get("precioUnitarioPorPresentacion")?.valid
    ) {
      event.preventDefault();
      // Navegar a Precio Unitario
      this.precioUnitarioInput?.nativeElement.select();
    }
  }

  onPrecioUnitarioKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === "Tab") {
      if (event.key === "Enter") {
        event.preventDefault();
      }
      
      // Si hay distribuciones, prevenir el comportamiento por defecto del Tab
      if (event.key === "Tab") {
        event.preventDefault();
      }
      
      // Navegar según el modo
      if (this.distribucionModo === 'COMPLETA' && this.distribucionesItems.length > 0) {
        setTimeout(() => {
          const firstInput = this.getFirstDistribucionInput();
          if (firstInput) {
            firstInput.focus();
            firstInput.select();
          }
        }, 0);
      } else if (this.distribucionModo === 'SIMPLIFICADA') {
        setTimeout(() => {
          const simplifiedInput = document.querySelector('input.cantidad-simplificada-input') as HTMLInputElement;
          if (simplifiedInput) {
            simplifiedInput.focus();
            simplifiedInput.select();
          }
        }, 0);
      } else {
        // Si no hay distribuciones, ir al botón Guardar
        if (event.key === "Enter" && this.canSaveComputed) {
          this.guardarBtn?.focus();
        }
      }
    }
  }

  /**
   * Obtiene el primer input de cantidad de la lista de distribuciones
   */
  private getFirstDistribucionInput(): HTMLInputElement | null {
    const inputs = document.querySelectorAll<HTMLInputElement>(
      'input.cantidad-pedir-input'
    );
    return inputs.length > 0 ? inputs[0] : null;
  }

  /**
   * Calcula la cantidad por presentación a partir de la cantidad en unidades base
   */
  getCantidadPorPresentacion(cantidadUnidades: number): number {
    const presentacion = this.itemForm.get("presentacion")?.value;
    if (presentacion && presentacion.cantidad > 0) {
      return cantidadUnidades / presentacion.cantidad;
    }
    return cantidadUnidades;
  }

  onVencimientoKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      // Navegar a Observación o directamente al botón Guardar
      if (this.canSaveComputed) {
        this.guardarBtn?.focus();
      } else {
        this.observacionInput?.nativeElement.select();
      }
    }
  }

  onObservacionKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      // Navegar al botón Guardar o ejecutar guardado
      if (this.canSaveComputed) {
        this.guardarBtn?.focus();
      }
    }
  }

  onCancelarKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      this.onCancel();
    }
  }

  onGuardarKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation(); // Evitar que el Enter se propague al componente padre
      if (this.canSaveComputed) {
        this.onSave();
      }
    }
  }

  // Dialog actions
  onSave(): void {
    // Validar formulario
    if (!this.itemForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    // Validar que haya al menos una distribución
    // Excepción: En modo simplificado con múltiples sucursales, se permite guardar sin distribuciones
    const esModoSimplificadoMultiSucursal = this.distribucionModo === 'SIMPLIFICADA' && 
        (this.sucursalesInfluencia.length > 1 || this.sucursalesEntrega.length > 1);
    
    if (this.distribucionesItems.length === 0 && !esModoSimplificadoMultiSucursal) {
      this.notificacionService.openWarn("Debe agregar al menos una distribución por sucursal");
      return;
    }

    // Validar que la cantidad total sea mayor a 0
    if (this.cantidadTotalComputed <= 0) {
      this.notificacionService.openWarn("La cantidad total debe ser mayor a 0");
      return;
    }

    // Validar que todas las distribuciones sean válidas (permitir cantidad 0)
    const distribucionesInvalidas = this.distribucionesFormArray.controls.filter(
      control => !control.valid
    );
    
    if (distribucionesInvalidas.length > 0) {
      this.notificacionService.openWarn("Todas las distribuciones deben tener una cantidad válida (puede ser 0)");
      return;
    }

    if (this.savingComputed) {
      return;
    }

    this.savingComputed = true;
    this.updateComputedProperties();

    const formValue = this.itemForm.getRawValue();

    // Create PedidoItem instance using Object.assign to preserve the toInput() method
    // If editing, merge the existing item data with form values
    // If creating new, start with a new PedidoItem instance
    const pedidoToSave = Object.assign(
      new PedidoItem(),
      this.data.item || {},
      {
        pedido: this.data.pedido,
        producto: formValue.producto,
        presentacionCreacion: formValue.presentacion,
        cantidadSolicitada: formValue.cantidadSolicitada,
        precioUnitarioSolicitado: formValue.precioUnitarioSolicitado,
        vencimientoEsperado: formValue.vencimientoEsperado,
        observacion: formValue.observacion,
        esBonificacion: formValue.esBonificacion,
        estado: PedidoItemEstado.ACTIVO,
      }
    );

    // Call the service to save PedidoItem first
    this.pedidoService.onSavePedidoItem(pedidoToSave.toInput()).subscribe({
      next: (savedItem) => {
        console.log("PedidoItem guardado exitosamente:", savedItem);

        // Preparar distribuciones para guardar
        // En modo completo: solo guardar distribuciones con cantidad > 0
        // En modo simplificado: guardar todas las distribuciones (ya están filtradas por la lógica de creación)
        console.log('ANTES de preparar distribuciones:', {
          distribucionesItems: this.distribucionesItems.length,
          modo: this.distribucionModo,
          sucursalesInfluencia: this.sucursalesInfluencia.length,
          sucursalesEntrega: this.sucursalesEntrega.length
        });
        const distribucionesInput: PedidoItemDistribucionInput[] = this.distribucionesItems
          .map((item, index) => {
            const control = this.distribucionesFormArray.at(index);
            const cantidadPedir = control?.get('cantidadPedir')?.value || 0;
            
            // Convertir cantidad de presentación a unidades base
            // Las cantidades en el formulario están en unidades de presentación
            const presentacion = formValue.presentacion;
            const cantidadEnUnidadesBase = presentacion && presentacion.cantidad > 0
              ? cantidadPedir * presentacion.cantidad
              : cantidadPedir;

            return {
              id: item.distribucionId,
              pedidoItemId: savedItem.id,
              sucursalInfluenciaId: item.sucursalInfluencia.id,
              sucursalEntregaId: item.sucursalEntrega.id,
              cantidadAsignada: cantidadEnUnidadesBase
            };
          });
        
        console.log('Distribuciones DESPUÉS del map (antes del filter):', distribucionesInput);
        
        const distribucionesFiltradas = distribucionesInput.filter(dist => {
            // En ambos modos, solo guardar distribuciones con cantidad > 0
            // En modo simplificado con múltiples sucursales, no debería haber distribuciones
            return dist.cantidadAsignada > 0;
          });

        // Log para verificar qué se está enviando
        console.log('Distribuciones a guardar (después del filter):', distribucionesFiltradas);
        console.log('Modo de distribución:', this.distribucionModo);
        console.log('Cantidad de distribuciones:', distribucionesFiltradas.length);

        // Guardar distribuciones usando merge
        this.pedidoService.onMergePedidoItemDistribuciones(savedItem.id, distribucionesFiltradas).subscribe({
          next: (distribucionesGuardadas) => {
            console.log("Distribuciones guardadas exitosamente:", distribucionesGuardadas);

            // Update the saved item with additional computed properties
            const itemResult: PedidoItem = Object.assign(new PedidoItem(), {
              ...savedItem,
              // Add frontend-specific properties
              presentacion: formValue.presentacion,
              precioUnitarioPorPresentacion:
                formValue.precioUnitarioPorPresentacion,
            });

            // Mensaje de éxito según si se guardaron distribuciones o no
            const mensajeExito = distribucionesInput.length > 0
              ? (this.data.isEdit
                  ? "Ítem y distribuciones actualizados exitosamente"
                  : "Ítem y distribuciones añadidos exitosamente")
              : (this.data.isEdit
                  ? "Ítem actualizado exitosamente"
                  : "Ítem añadido exitosamente");
            
            this.notificacionService.openSucess(mensajeExito);

            const result: AddEditItemDialogResult = {
              item: itemResult,
              action: "save",
            };

            this.dialogRef.close(result);
          },
          error: (error) => {
            console.error("Error guardando distribuciones:", error);
            // El PedidoItem ya fue guardado, pero las distribuciones fallaron
            this.notificacionService.openAlgoSalioMal(
              "El ítem fue guardado, pero hubo un error al guardar las distribuciones. Puede intentar guardarlas nuevamente."
            );
            this.savingComputed = false;
            this.updateComputedProperties();
          }
        });
      },
      error: (error) => {
        console.error("Error guardando PedidoItem:", error);
        this.notificacionService.openAlgoSalioMal(
          "Error al guardar el ítem del pedido"
        );
        this.savingComputed = false;
        this.updateComputedProperties();
      },
    });
  }

  onCancel(): void {
    const result: AddEditItemDialogResult = {
      item: {} as PedidoItem,
      action: "cancel",
    };
    this.dialogRef.close(result);
  }

  /**
   * Valida el vencimiento y muestra diálogo de advertencia si es necesario
   * Se ejecuta cuando el input pierde el foco
   */
  onVencimientoBlur(): void {
    const vencimiento = this.itemForm.get("vencimientoEsperado")?.value;
    
    if (!vencimiento) {
      return; // Vencimiento vacío: nada (por ahora)
    }

    const fechaVencimiento = typeof vencimiento === 'string' 
      ? new Date(vencimiento) 
      : vencimiento instanceof Date 
        ? vencimiento 
        : new Date(vencimiento);
    
    if (isNaN(fechaVencimiento.getTime())) {
      return; // Fecha inválida
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaVencimientoNormalizada = new Date(fechaVencimiento);
    fechaVencimientoNormalizada.setHours(0, 0, 0, 0);

    // Calcular diferencia en meses
    const diffTime = fechaVencimientoNormalizada.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = diffDays / 30.44; // Promedio de días por mes

    let mensaje = "";
    let titulo = "Atención - Vencimiento";

    // Vencimiento muy corto (< 3 meses)
    if (diffMonths < 3 && diffMonths > 0) {
      const mesesRestantes = Math.round(diffMonths * 10) / 10;
      mensaje = `El vencimiento es muy corto (${mesesRestantes} meses). ¿Está seguro de que es correcto?`;
    }
    // Vencimiento muy largo (> 2 años)
    else if (diffMonths > 24) {
      const añosRestantes = Math.round((diffMonths / 12) * 10) / 10;
      mensaje = `El vencimiento es muy largo (${añosRestantes} años). ¿Está seguro de que es correcto?`;
    }
    // Vencimiento pasado
    else if (diffDays < 0) {
      mensaje = `La fecha de vencimiento está en el pasado. ¿Está seguro de que es correcta?`;
    }

    // Mostrar diálogo solo si hay un mensaje de advertencia
    if (mensaje) {
      this.dialogosService.confirm(
        titulo,
        mensaje,
        null,
        [],
        true,
        "Sí, es correcto",
        "Corregir"
      ).subscribe((confirmed) => {
        // Si el usuario elige "Corregir", hacer focus de nuevo en el input
        if (!confirmed) {
          setTimeout(() => {
            this.vencimientoInput?.nativeElement.focus();
          }, 100);
        }
      });
    }
  }

  /**
   * Valida el precio unitario y muestra diálogo de advertencia si es necesario
   * Se ejecuta cuando el input pierde el foco
   */
  onPrecioUnitarioBlur(): void {
    const precio = this.itemForm.get("precioUnitarioSolicitado")?.value;
    
    if (precio === null || precio === undefined) {
      return;
    }

    // No validar durante la carga inicial de datos
    if (this.isLoadingInitialData) {
      return;
    }

    // Si es bonificación, no validar precio
    if (this.itemForm.get("esBonificacion")?.value) {
      return;
    }

    let mensaje = "";
    let titulo = "Atención - Precio Unitario";

    // Costo 0: Lanzar aviso
    if (precio === 0) {
      mensaje = "El precio unitario es 0. ¿Está seguro de que es correcto?";
    }
    // Solo validar cambio de precio si estamos editando y hay un precio original
    else if (this.data.isEdit && this.precioOriginal > 0) {
      const cambioPorcentual = ((precio - this.precioOriginal) / this.precioOriginal) * 100;
      const cambioAbsoluto = Math.abs(cambioPorcentual);

      // Cambio mayor a 50% (arriba o abajo)
      if (cambioAbsoluto > 50) {
        const direccion = cambioPorcentual > 0 ? "aumentó" : "disminuyó";
        const porcentajeFormateado = Math.abs(Math.round(cambioPorcentual * 10) / 10);
        const precioOriginalFormateado = this.precioOriginal.toLocaleString('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        const precioNuevoFormateado = precio.toLocaleString('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        mensaje = `El precio ${direccion} ${porcentajeFormateado}% respecto al valor original (${precioOriginalFormateado} → ${precioNuevoFormateado}). ¿Está seguro de que es correcto?`;
      }
    }

    // Mostrar diálogo solo si hay un mensaje de advertencia
    if (mensaje) {
      this.dialogosService.confirm(
        titulo,
        mensaje,
        null,
        [],
        true,
        "Sí, es correcto",
        "Corregir"
      ).subscribe((confirmed) => {
        // Si el usuario elige "Corregir", hacer focus de nuevo en el input
        if (!confirmed) {
          setTimeout(() => {
            this.precioUnitarioInput?.nativeElement.focus();
            this.precioUnitarioInput?.nativeElement.select();
          }, 100);
        }
      });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.itemForm.controls).forEach((key) => {
      const control = this.itemForm.get(key);
      control?.markAsTouched();
    });
    this.updateComputedProperties();
  }

  onClearProducto(): void {
    this.itemForm.get("producto")?.setValue(null);
    this.itemForm.get("presentacion")?.setValue(null);
    this.clearDistribuciones();
    this.updateComputedProperties();
  }

  // ===== MÉTODOS DE DISTRIBUCIONES =====

  /**
   * Inicializa las distribuciones en modo creación
   * - En modo COMPLETA: Crea un item por cada sucursal de influencia con la primera sucursal de entrega
   * - En modo SIMPLIFICADA: Solo crea automáticamente si hay una única sucursal de influencia y una de entrega
   */
  private initializeDistribuciones(): void {
    console.log('initializeDistribuciones llamado. Modo:', this.distribucionModo, 
                'Sucursales influencia:', this.sucursalesInfluencia.length,
                'Sucursales entrega:', this.sucursalesEntrega.length);
    
    if (this.sucursalesInfluencia.length === 0) {
      return;
    }

    // En modo simplificado, solo inicializar si hay una única sucursal de influencia y una de entrega
    if (this.distribucionModo === 'SIMPLIFICADA') {
      if (this.sucursalesInfluencia.length === 1 && 
          this.sucursalesEntrega.length === 1 &&
          !this.existeDistribucion(this.sucursalesInfluencia[0].id, this.sucursalesEntrega[0].id)) {
        console.log('Creando distribución automática en modo simplificado (1-1 sucursales)');
        this.addDistribucionItem(this.sucursalesInfluencia[0], this.sucursalesEntrega[0]);
      } else {
        console.log('NO se crean distribuciones automáticas en modo simplificado (múltiples sucursales)');
      }
      // Si hay más de una sucursal, no crear ninguna distribución automáticamente
      return;
    }

    // En modo completo, crear una distribución por cada sucursal de influencia
    const primeraSucursalEntrega = this.sucursalesEntrega.length > 0 ? this.sucursalesEntrega[0] : null;

    this.sucursalesInfluencia.forEach(sucursalInfluencia => {
      if (primeraSucursalEntrega) {
        // Solo agregar si no existe ya una distribución con esta combinación
        if (!this.existeDistribucion(sucursalInfluencia.id, primeraSucursalEntrega.id)) {
          this.addDistribucionItem(sucursalInfluencia, primeraSucursalEntrega);
        }
      }
    });
  }

  /**
   * Carga las distribuciones existentes en modo edición
   */
  private loadDistribucionesExistentes(pedidoItemId: number): void {
    this.pedidoService.onGetPedidoItemDistribucionesByPedidoItemId(pedidoItemId).subscribe({
      next: (distribuciones) => {
        if (distribuciones && distribuciones.length > 0) {
          // Convertir cantidad de unidades base a cantidad por presentación
          const presentacion = this.itemForm.get("presentacion")?.value;
          distribuciones.forEach(dist => {
            let cantidadPorPresentacion = dist.cantidadAsignada || 0;
            if (presentacion && presentacion.cantidad > 0) {
              cantidadPorPresentacion = cantidadPorPresentacion / presentacion.cantidad;
            }
            this.addDistribucionItem(
              dist.sucursalInfluencia,
              dist.sucursalEntrega,
              cantidadPorPresentacion,
              dist.id
            );
          });
        } else {
          // Si no hay distribuciones, inicializar como en modo creación
          // Solo si no estamos en modo simplificado con múltiples sucursales
          const esModoSimplificadoMultiSucursal = this.distribucionModo === 'SIMPLIFICADA' && 
              (this.sucursalesInfluencia.length > 1 || this.sucursalesEntrega.length > 1);
          if (!esModoSimplificadoMultiSucursal) {
            this.initializeDistribuciones();
          }
        }
      },
      error: (error) => {
        console.error('Error cargando distribuciones:', error);
        // En caso de error, inicializar como en modo creación
        // Solo si no estamos en modo simplificado con múltiples sucursales
        const esModoSimplificadoMultiSucursal = this.distribucionModo === 'SIMPLIFICADA' && 
            (this.sucursalesInfluencia.length > 1 || this.sucursalesEntrega.length > 1);
        if (!esModoSimplificadoMultiSucursal) {
          this.initializeDistribuciones();
        }
      }
    });
  }

  /**
   * Verifica si ya existe una distribución con la misma combinación de sucursales
   */
  private existeDistribucion(sucursalInfluenciaId: number, sucursalEntregaId: number): boolean {
    return this.distribucionesItems.some(
      item => item.sucursalInfluencia.id === sucursalInfluenciaId &&
              item.sucursalEntrega.id === sucursalEntregaId
    );
  }

  /**
   * Agrega un item de distribución
   */
  private addDistribucionItem(
    sucursalInfluencia: Sucursal,
    sucursalEntrega: Sucursal,
    cantidadInicial: number = 0,
    distribucionId?: number
  ): void {
    console.log('addDistribucionItem llamado:', {
      sucursalInfluencia: sucursalInfluencia.nombre,
      sucursalEntrega: sucursalEntrega.nombre,
      cantidadInicial,
      distribucionId,
      modo: this.distribucionModo,
      distribucionesActuales: this.distribucionesItems.length
    });
    
    // Validar que no exista ya una distribución con la misma combinación
    if (this.existeDistribucion(sucursalInfluencia.id, sucursalEntrega.id)) {
      console.warn('Intento de agregar distribución duplicada:', sucursalInfluencia.nombre, '-', sucursalEntrega.nombre);
      this.notificacionService.openWarn(
        `Ya existe una distribución para la combinación: ${sucursalInfluencia.nombre} - ${sucursalEntrega.nombre}`
      );
      return;
    }
    const distribucionItem: DistribucionItem = {
      sucursalInfluencia,
      sucursalEntrega,
      stockActual: 0,
      stockActualLoading: true,
      cantidadSugerida: 0,
      cantidadSugeridaLoading: true,
      cantidadPedir: cantidadInicial,
      distribucionId
    };

    this.distribucionesItems.push(distribucionItem);

    // Agregar control al FormArray
    const control = this.formBuilder.group({
      sucursalInfluenciaId: [sucursalInfluencia.id],
      sucursalEntregaId: [sucursalEntrega.id],
      cantidadPedir: [cantidadInicial, [Validators.required, Validators.min(0)]]
    });

    this.distribucionesFormArray.push(control);

    // Actualizar data source
    this.distribucionesDataSource.data = [...this.distribucionesItems];

    // Cargar stock actual y cantidad sugerida
    this.loadStockActual(distribucionItem);
    this.calculateCantidadSugerida(distribucionItem);

    this.calculateCantidadTotal();
  }

  /**
   * Elimina un item de distribución
   */
  onRemoveDistribucion(index: number): void {
    if (index >= 0 && index < this.distribucionesItems.length) {
      this.distribucionesItems.splice(index, 1);
      this.distribucionesFormArray.removeAt(index);
      this.distribucionesDataSource.data = [...this.distribucionesItems];
      this.calculateCantidadTotal();
    }
  }

  /**
   * Abre diálogo para agregar nueva distribución
   */
  onAddDistribucion(): void {
    // Asegurarse de que las sucursales estén inicializadas antes de abrir el diálogo
    if (this.sucursalesInfluencia.length === 0 || this.sucursalesEntrega.length === 0) {
      this.initializeSucursales();
    }

    // Si solo hay una sucursal de influencia y una de entrega, agregar directamente
    if (this.sucursalesInfluencia.length === 1 && this.sucursalesEntrega.length === 1) {
      // Verificar que no esté ya agregada usando el método de validación
      if (!this.existeDistribucion(this.sucursalesInfluencia[0].id, this.sucursalesEntrega[0].id)) {
        this.addDistribucionItem(this.sucursalesInfluencia[0], this.sucursalesEntrega[0]);
      }
      return;
    }

    // Abrir diálogo para seleccionar sucursales
    const dialogData: SelectSucursalesDialogData = {
      sucursalesInfluencia: this.sucursalesInfluencia,
      sucursalesEntrega: this.sucursalesEntrega,
      sucursalesInfluenciaUsadas: this.distribucionesItems.map(d => d.sucursalInfluencia.id),
      sucursalesEntregaUsadas: this.distribucionesItems.map(d => d.sucursalEntrega.id)
    };

    const dialogRef = this.dialog.open(SelectSucursalesDialogComponent, {
      width: '500px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: SelectSucursalesDialogResult | null) => {
      if (result) {
        // Verificar que no esté duplicada usando el método de validación
        if (!this.existeDistribucion(result.sucursalInfluencia.id, result.sucursalEntrega.id)) {
          this.addDistribucionItem(result.sucursalInfluencia, result.sucursalEntrega);
        }
      }
    });
  }

  /**
   * Obtiene el control de una distribución específica
   */
  getDistribucionControl(index: number, fieldName: string): FormControl {
    const control = this.distribucionesFormArray.at(index)?.get(fieldName);
    return control as FormControl;
  }

  /**
   * Carga el stock actual para una distribución
   */
  private loadStockActual(distribucionItem: DistribucionItem): void {
    const producto = this.itemForm.get("producto")?.value;
    if (!producto?.id || !distribucionItem.sucursalInfluencia?.id) {
      distribucionItem.stockActualLoading = false;
      return;
    }

    this.productoService.onGetStockPorProductoAndSucursal(
      producto.id,
      distribucionItem.sucursalInfluencia.id
    ).subscribe({
      next: (stock) => {
        distribucionItem.stockActual = stock || 0;
        distribucionItem.stockActualLoading = false;
        // Actualizar el stock total simplificado cuando se carga el stock
        this.updateComputedProperties();
      },
      error: (error) => {
        console.error('Error cargando stock:', error);
        distribucionItem.stockActual = 0;
        distribucionItem.stockActualLoading = false;
        // Actualizar también en caso de error
        this.updateComputedProperties();
      }
    });
  }

  /**
   * Calcula la cantidad sugerida para una distribución
   */
  private calculateCantidadSugerida(distribucionItem: DistribucionItem): void {
    const producto = this.itemForm.get("producto")?.value;
    if (!producto?.id || !distribucionItem.sucursalInfluencia?.id) {
      distribucionItem.cantidadSugeridaLoading = false;
      distribucionItem.cantidadSugerida = 0;
      return;
    }

    distribucionItem.cantidadSugeridaLoading = true;

    // Obtener fecha del mes actual del año pasado
    const ahora = new Date();
    const añoPasado = ahora.getFullYear() - 1;
    const mesActual = ahora.getMonth(); // 0-11

    const inicio = new Date(añoPasado, mesActual, 1);
    const fin = new Date(añoPasado, mesActual + 1, 0, 23, 59, 59);

    // Obtener movimientos de compra/transferencia (positivas) y venta
    const tipoMovimientosCompra: TipoMovimiento[] = [TipoMovimiento.COMPRA, TipoMovimiento.TRANSFERENCIA];
    const tipoMovimientosVenta: TipoMovimiento[] = [TipoMovimiento.VENTA];

    // Obtener movimientos de compra
    this.movimientoStockService.onGetMovimientoStockPorFiltros(
      dateToString(inicio),
      dateToString(fin),
      [distribucionItem.sucursalInfluencia.id],
      producto.id,
      tipoMovimientosCompra,
      null,
      0,
      1000
    ).subscribe({
      next: (comprasPage) => {
        const compras = comprasPage?.getContent || [];
        
        // Obtener movimientos de venta
        this.movimientoStockService.onGetMovimientoStockPorFiltros(
          dateToString(inicio),
          dateToString(fin),
          [distribucionItem.sucursalInfluencia.id],
          producto.id,
          tipoMovimientosVenta,
          null,
          0,
          1000
        ).subscribe({
          next: (ventasPage) => {
            const ventas = ventasPage?.getContent || [];
            
            // Calcular cantidad sugerida
            const cantidadSugerida = this.calcularCantidadSugeridaInteligente(
              compras,
              ventas,
              distribucionItem.stockActual
            );
            
            distribucionItem.cantidadSugerida = cantidadSugerida;
            distribucionItem.cantidadSugeridaLoading = false;
          },
          error: (error) => {
            console.error('Error calculando cantidad sugerida (ventas):', error);
            distribucionItem.cantidadSugerida = 0;
            distribucionItem.cantidadSugeridaLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error calculando cantidad sugerida (compras):', error);
        distribucionItem.cantidadSugerida = 0;
        distribucionItem.cantidadSugeridaLoading = false;
      }
    });
  }

  /**
   * Calcula la cantidad sugerida de forma inteligente
   */
  private calcularCantidadSugeridaInteligente(
    compras: any[],
    ventas: any[],
    stockActual: number
  ): number {
    if (compras.length === 0 && ventas.length === 0) {
      return 0; // Sin datos históricos
    }

    // Filtrar transferencias positivas (solo las que aumentan stock)
    const comprasFiltradas = compras.filter(c => {
      if (c.tipoMovimiento === TipoMovimiento.TRANSFERENCIA) {
        return c.cantidad > 0;
      }
      return true;
    });

    // Calcular frecuencia de compra (días entre compras)
    let frecuenciaCompraDias = 30; // Default: mensual
    if (comprasFiltradas.length > 1) {
      const fechasCompras = comprasFiltradas
        .map(c => new Date(c.creadoEn))
        .filter(d => !isNaN(d.getTime())) // Filtrar fechas inválidas
        .sort((a, b) => a.getTime() - b.getTime());
      
      if (fechasCompras.length > 1) {
        let totalDias = 0;
        for (let i = 1; i < fechasCompras.length; i++) {
          const diff = fechasCompras[i].getTime() - fechasCompras[i - 1].getTime();
          totalDias += diff / (1000 * 60 * 60 * 24); // Convertir a días
        }
        frecuenciaCompraDias = totalDias / (fechasCompras.length - 1);
      }
    } else if (comprasFiltradas.length === 1) {
      // Si solo hay una compra, usar 30 días como frecuencia por defecto
      frecuenciaCompraDias = 30;
    }

    // Calcular consumo diario promedio (ventas)
    const totalVentas = ventas.reduce((sum, v) => sum + Math.abs(v.cantidad || 0), 0);
    const diasDelMes = 30; // Aproximación
    const consumoDiarioPromedio = totalVentas > 0 ? totalVentas / diasDelMes : 0;

    // Calcular días hasta próxima compra esperada
    const ultimaCompra = comprasFiltradas.length > 0 
      ? (() => {
          const fecha = new Date(comprasFiltradas[comprasFiltradas.length - 1].creadoEn);
          return !isNaN(fecha.getTime()) ? fecha : null;
        })()
      : null;
    
    const ahora = new Date();
    let diasHastaProximaCompra = frecuenciaCompraDias;
    
    if (ultimaCompra) {
      const diasDesdeUltimaCompra = (ahora.getTime() - ultimaCompra.getTime()) / (1000 * 60 * 60 * 24);
      diasHastaProximaCompra = Math.max(0, frecuenciaCompraDias - diasDesdeUltimaCompra);
    }

    // Calcular cantidad sugerida
    // Cantidad sugerida = (consumo diario × días hasta próxima compra) - stock actual
    const cantidadNecesaria = consumoDiarioPromedio * diasHastaProximaCompra;
    const cantidadSugerida = Math.max(0, cantidadNecesaria - stockActual);

    return Math.round(cantidadSugerida * 100) / 100; // Redondear a 2 decimales
  }

  /**
   * Limpia todas las distribuciones
   */
  private clearDistribuciones(): void {
    while (this.distribucionesFormArray.length > 0) {
      this.distribucionesFormArray.removeAt(0);
    }
    this.distribucionesItems = [];
    this.distribucionesDataSource.data = [];
    this.cantidadTotalComputed = 0;
    this.calculateCantidadTotal();
  }

  /**
   * Maneja el keydown en el input de cantidad a pedir
   */
  onCantidadPedirKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === "Enter" || (event.key === "Tab" && !event.shiftKey)) {
      if (event.key === "Enter") {
        event.preventDefault();
      }
      
      // Navegar al siguiente campo o botón
      const nextIndex = index + 1;
      if (nextIndex < this.distribucionesItems.length) {
        // Focus en el siguiente input
        setTimeout(() => {
          const inputs = document.querySelectorAll<HTMLInputElement>(
            'input.cantidad-pedir-input'
          );
          if (inputs[nextIndex]) {
            inputs[nextIndex].focus();
            inputs[nextIndex].select();
          }
        }, 0);
      } else {
        // Si es el último, ir al botón guardar
        if (this.canSaveComputed) {
          this.guardarBtn?.focus();
        }
      }
    }
  }

  /**
   * Maneja el blur en el input de cantidad a pedir
   */
  onCantidadPedirBlur(index: number): void {
    this.calculateCantidadTotal();
  }

  /**
   * Actualiza las distribuciones desde el modo simplificado
   */
  private updateDistribucionesFromSimplified(cantidad: number): void {
    // Si no hay distribuciones y hay sucursales disponibles, crear una distribución automáticamente
    // Solo si hay una única sucursal de influencia y una de entrega (para mantener consistencia)
    if (this.distribucionesItems.length === 0 && 
        this.sucursalesInfluencia.length === 1 && 
        this.sucursalesEntrega.length === 1) {
      this.addDistribucionItem(this.sucursalesInfluencia[0], this.sucursalesEntrega[0], cantidad);
    } else if (this.distribucionesItems.length > 0) {
      // Asignar el total a la primera distribución y poner las demás en 0
      this.distribucionesFormArray.controls.forEach((control, index) => {
        const val = index === 0 ? cantidad : 0;
        control.get('cantidadPedir')?.setValue(val, { emitEvent: false });
        this.distribucionesItems[index].cantidadPedir = val;
      });
    }
    // Si hay múltiples sucursales y no hay distribuciones, no crear automáticamente
    // El usuario deberá cambiar a modo completo para crear distribuciones manualmente
    this.calculateCantidadTotal();
  }

  /**
   * Maneja el keydown en el input simplificado
   */
  onCantidadSimplificadaKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter" || (event.key === "Tab" && !event.shiftKey)) {
      if (event.key === "Enter") {
        event.preventDefault();
      }
      if (this.canSaveComputed) {
        this.guardarBtn?.focus();
      }
    }
  }
}
