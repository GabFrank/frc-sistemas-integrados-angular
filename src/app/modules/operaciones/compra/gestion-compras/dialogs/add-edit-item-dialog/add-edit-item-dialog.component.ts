import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Inject,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
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
import { PedidoService } from "../../../pedido.service";
import { NotificacionSnackbarService } from "../../../../../../notificacion-snackbar.service";
import { dateToString } from "../../../../../../commons/core/utils/dateUtils";
import { MatButton } from "@angular/material/button";
import { DialogosService } from "../../../../../../shared/components/dialogos/dialogos.service";

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

@Component({
  selector: "app-add-edit-item-dialog",
  templateUrl: "./add-edit-item-dialog.component.html",
  styleUrls: ["./add-edit-item-dialog.component.scss"],
})
export class AddEditItemDialogComponent implements OnInit {
  @ViewChild("productoInput") productoInput!: ElementRef;
  @ViewChild("cantidadInput") cantidadInput!: ElementRef;
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
  cantidadEnUnidadesBaseComputed = 0;
  cantidadPorPresentacionComputed = 0;

  // Loading state
  savingComputed = false;

  currencyMask = new CurrencyMask();
  selectedCurrencyOptions = null; //select it based on the selected moneda from pedido on dialog data
  selectedCurrencyPrefix = "";

  // Almacenar el precio original para comparar cambios
  precioOriginal: number = 0;
  
  // Bandera para evitar validaciones durante la carga inicial de datos
  private isLoadingInitialData = false;

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<AddEditItemDialogComponent>,
    private dialog: MatDialog,
    private monedaService: MonedaService,
    private pedidoService: PedidoService,
    private notificacionService: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    @Inject(MAT_DIALOG_DATA) public data: AddEditItemDialogData
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    if (!this.data.isEdit) {
      this.updateComputedProperties();
    }
    this.loadDataIfEdit();
    this.setupFormSubscriptions();
    this.setInitialFocus();
  }

  private initializeForm(): void {
    this.itemForm = this.formBuilder.group({
      productoSearch: [""], // Campo de búsqueda de producto
      producto: [null, [Validators.required]],
      presentacion: [null, [Validators.required]],
      cantidadPorPresentacion: [1, [Validators.required, Validators.min(0.01)]], // Cantidad por presentación (UI)
      cantidadSolicitada: [1, [Validators.required, Validators.min(0.01)]], // Cantidad en unidades base (hidden)
      precioUnitarioSolicitado: [0, [Validators.min(0)]],
      precioUnitarioPorPresentacion: [0, [Validators.min(0)]],
      esBonificacion: [false],
      vencimientoEsperado: [null],
      observacion: [""],
    });
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

      // Convertir cantidad de unidades base a cantidad por presentación
      const cantidadPorPresentacion =
        presentacionSeleccionada && presentacionSeleccionada.cantidad > 0
          ? item.cantidadSolicitada / presentacionSeleccionada.cantidad
          : item.cantidadSolicitada;

      // Calcular precio por presentación basándose en precio unitario y cantidad de presentación
      const precioUnitarioPorPresentacion =
        presentacionSeleccionada && presentacionSeleccionada.cantidad > 0
          ? item.precioUnitarioSolicitado * presentacionSeleccionada.cantidad
          : item.precioUnitarioSolicitado;

      this.itemForm.patchValue({
        productoSearch: item.producto?.descripcion || "",
        producto: item.producto,
        presentacion: presentacionSeleccionada,
        cantidadPorPresentacion: cantidadPorPresentacion,
        cantidadSolicitada: item.cantidadSolicitada,
        precioUnitarioSolicitado: item.precioUnitarioSolicitado,
        precioUnitarioPorPresentacion: precioUnitarioPorPresentacion,
        esBonificacion: item.esBonificacion,
        vencimientoEsperado: item.vencimientoEsperado,
        observacion: item.observacion,
      });

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
    // Si hay producto y presentación ya seleccionados, el foco debe ir al input de cantidad
    setTimeout(() => {
      const producto = this.itemForm.get("producto")?.value;
      const presentacion = this.itemForm.get("presentacion")?.value;
      
      if (producto && presentacion) {
        // Si ya hay producto y presentación seleccionados, ir directamente a cantidad
        this.cantidadInput?.nativeElement.focus();
        this.cantidadInput?.nativeElement.select();
      } else if (producto && !presentacion) {
        // Si hay producto pero no presentación, ir al select de presentación
        if (this.presentacionesDisponibles.length > 1) {
          this.presentacionSelect?.focus();
          setTimeout(() => {
            this.presentacionSelect?.open();
          }, 100);
        } else if (this.presentacionesDisponibles.length === 1) {
          // Si hay solo una presentación, ir a cantidad
          this.cantidadInput?.nativeElement.focus();
          this.cantidadInput?.nativeElement.select();
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

    // Listen to cantidad por presentación changes
    this.itemForm
      .get("cantidadPorPresentacion")
      ?.valueChanges.subscribe((value) => {
        this.updateCantidadBase(value);
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
      this.updateCantidadBase(
        this.itemForm.get("cantidadPorPresentacion")?.value || 1
      );
    });

    // Listen to producto changes
    this.itemForm.get("producto")?.valueChanges.subscribe(() => {
      this.updateComputedProperties();
    });

    // La validación de vencimiento se hace en el evento blur, no aquí
  }

  private updateCantidadBase(cantidadPorPresentacion: number): void {
    const presentacion = this.itemForm.get("presentacion")?.value;
    if (presentacion && presentacion.cantidad > 0) {
      const cantidadEnUnidadesBase =
        cantidadPorPresentacion * presentacion.cantidad;
      this.itemForm
        .get("cantidadSolicitada")
        ?.setValue(cantidadEnUnidadesBase, { emitEvent: false });
    } else {
      this.itemForm
        .get("cantidadSolicitada")
        ?.setValue(cantidadPorPresentacion, { emitEvent: false });
    }
    this.updateComputedProperties();
  }

  private updateComputedProperties(): void {
    this.titleComputed = this.data.title;
    this.canSaveComputed = this.itemForm.valid && !this.savingComputed;
    this.productoSelectedComputed = !!this.itemForm.get("producto")?.value;
    this.isBonificacionComputed =
      this.itemForm.get("esBonificacion")?.value || false;
    this.selectedCurrencyOptions = this.monedaService.currencyOptionsByMoneda(
      this.data.pedido.moneda
    );
    this.selectedCurrencyPrefix = this.data.pedido.moneda.simbolo || "";

    // Check if product handles expiration
    const producto = this.itemForm.get("producto")?.value;
    this.productoManejaVencimientoComputed = producto?.vencimiento === true;

    // Calculate subtotal using base units
    const cantidadBase = this.itemForm.get("cantidadSolicitada")?.value || 0;
    const precio = this.itemForm.get("precioUnitarioSolicitado")?.value || 0;
    this.subtotalComputed = cantidadBase * precio;

    // Update computed quantities
    this.cantidadEnUnidadesBaseComputed = cantidadBase;
    this.cantidadPorPresentacionComputed =
      this.itemForm.get("cantidadPorPresentacion")?.value || 0;

    // Update display texts (avoid function calls in template)
    this.productoDisplayTextComputed = producto
      ? `${producto.descripcion} (${producto.codigoPrincipal})`
      : "Seleccionar producto...";

    const presentacion = this.itemForm.get("presentacion")?.value;
    this.presentacionDisplayTextComputed = presentacion
      ? `${presentacion.descripcion} (x${presentacion.cantidad})`
      : "Seleccionar presentación...";
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
            this.cantidadInput?.nativeElement.select();
          }
        }, 500);
      });
  }

  onProductoSelected(producto: Producto, presentacion?: Presentacion): void {
    this.isLoadingInitialData = true; // Marcar que estamos cargando datos iniciales
    
    this.selectedProducto = producto;
    this.presentacionesDisponibles = producto.presentaciones || [];

    const presentacionSeleccionada = presentacion ||
      (this.presentacionesDisponibles.length > 0
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

    // Manejar el foco inicial según si la presentación ya fue proporcionada
    setTimeout(() => {
      // Si la presentación ya fue proporcionada (previamente seleccionada), ir directamente a cantidad
      if (presentacion) {
        this.cantidadInput?.nativeElement.focus();
        this.cantidadInput?.nativeElement.select();
      } else if (this.presentacionesDisponibles.length === 1) {
        // Si hay solo una presentación, saltar al input de cantidad
        this.cantidadInput?.nativeElement.focus();
        this.cantidadInput?.nativeElement.select();
      } else if (this.presentacionesDisponibles.length > 1) {
        // Si hay más de una presentación y no fue proporcionada, mover el foco al select y abrirlo
        this.presentacionSelect?.focus();
        // Abrir el panel del select programáticamente
        setTimeout(() => {
          this.presentacionSelect?.open();
        }, 100);
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

  onCantidadKeydown(event: KeyboardEvent): void {
    if (
      event.key === "Enter" &&
      this.itemForm.get("cantidadPorPresentacion")?.valid
    ) {
      event.preventDefault();
      // Navegar a Precio por Presentación
      if (!this.isBonificacionComputed) {
        this.precioPorPresentacionInput?.nativeElement.select();
      } else {
        // Si es bonificación, saltar directamente a vencimiento u observación
        if (this.productoManejaVencimientoComputed) {
          this.vencimientoInput?.nativeElement.select();
        } else {
          this.observacionInput?.nativeElement.select();
        }
      }
    }
  }

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
    // Cuando el select se cierra después de seleccionar, mover el foco a cantidad
    setTimeout(() => {
      // Validar que la presentación esté seleccionada antes de navegar
      const presentacion = this.itemForm.get("presentacion")?.value;
      if (presentacion && this.itemForm.get("presentacion")?.valid) {
        this.cantidadInput?.nativeElement.focus();
        this.cantidadInput?.nativeElement.select();
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
    if (
      event.key === "Enter" &&
      this.itemForm.get("precioUnitarioSolicitado")?.valid
    ) {
      event.preventDefault();
      // Navegar directamente al botón Guardar
      if (this.canSaveComputed) {
        this.guardarBtn?.focus();
      }
    }
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
    if (!this.itemForm.valid) {
      this.markFormGroupTouched();
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

    // Call the service
    this.pedidoService.onSavePedidoItem(pedidoToSave.toInput()).subscribe({
      next: (savedItem) => {
        console.log("PedidoItem guardado exitosamente:", savedItem);

        // Update the saved item with additional computed properties
        const itemResult: PedidoItem = Object.assign(new PedidoItem(), {
          ...savedItem,
          // Add frontend-specific properties
          presentacion: formValue.presentacion,
          precioUnitarioPorPresentacion:
            formValue.precioUnitarioPorPresentacion,
        });

        this.notificacionService.openSucess(
          this.data.isEdit
            ? "Ítem actualizado exitosamente"
            : "Ítem añadido exitosamente"
        );

        const result: AddEditItemDialogResult = {
          item: itemResult,
          action: "save",
        };

        this.dialogRef.close(result);
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
    this.updateComputedProperties();
  }
}
