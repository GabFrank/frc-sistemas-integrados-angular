import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatSelect } from "@angular/material/select";
import { MatTableDataSource } from "@angular/material/table";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Subject } from "rxjs";
import { updateDataSource } from "../../../../commons/core/utils/numbersUtils";
import { getDigitoVerificadorString } from "../../../../commons/core/utils/rucUtils";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import {
  SearchListDialogComponent,
  SearchListtDialogData,
} from "../../../../shared/components/search-list-dialog/search-list-dialog.component";
import { VentaItem } from "../../../operaciones/venta/venta-item.model";
import { Venta } from "../../../operaciones/venta/venta.model";
import { Cliente } from "../../../personas/clientes/cliente.model";
import { ClienteService } from "../../../personas/clientes/cliente.service";
import { Persona } from "../../../personas/persona/persona.model";
import { PersonaService } from "../../../personas/persona/persona.service";
import { CajaService } from "../../pdv/caja/caja.service";
import { EditFacturaLegalItemComponent } from "../edit-factura-legal-item/edit-factura-legal-item.component";
import {
  FacturaLegal,
  FacturaLegalItem,
  FacturaLegalItemInput,
} from "../factura-legal.model";
import { FacturaLegalService } from "../factura-legal.service";
import { PersonaSearchGQL } from "../../../personas/persona/graphql/personaSearch";
import { BotonComponent } from "../../../../shared/components/boton/boton.component";
import { TimbradoDetalle } from "../../timbrado/timbrado.modal";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { TimbradoService } from "../../timbrado/timbrado.service";
import { Moneda } from "../../moneda/moneda.model";
import { MonedaService } from "../../moneda/moneda.service";
import { CambioService } from "../../cambio/cambio.service";
import { Cambio } from "../../cambio/cambio.model";

export interface FacturaLegalData {
  venta?: Venta;
  ventaItemList: VentaItem[];
  descuento: number;
  isServidor?: boolean;
}

@UntilDestroy()
@Component({
  selector: "app-add-factura-legal-dialog",
  templateUrl: "./add-factura-legal-dialog.component.html",
  styleUrls: ["./add-factura-legal-dialog.component.scss"],
})
export class AddFacturaLegalDialogComponent implements OnInit, AfterViewInit {
  @ViewChild("rucInput", { static: false }) rucInput: ElementRef;
  @ViewChild("nombreInput", { static: false }) nombreInput: ElementRef;
  @ViewChild("direccionInput", { static: false }) direccionInput: ElementRef;
  @ViewChild("emailInput", { static: false }) emailInput: ElementRef;
  @ViewChild("imprimirBtb", { read: BotonComponent }) imprimirBtn: BotonComponent;
  @ViewChild("sucursalSelect", { static: false }) sucursalSelect: MatSelect;

  selectedCliente: Cliente;
  selectedVenta: Venta;

  clienteIdControl = new FormControl(null, Validators.required);
  clienteDescripcionControl = new FormControl(null, Validators.required);
  fechaControl = new FormControl(new Date());
  creditoControl = new FormControl(false);
  rucControl = new FormControl(null, [
    Validators.required,
    Validators.minLength(1),
  ]);
  direccionControl = new FormControl("");
  emailControl = new FormControl({ value: "", disabled: true });
  totalFinalControl = new FormControl(0, [
    Validators.required,
    Validators.min(1),
  ]);
  tributaControl = new FormControl(true);

  // Campos para modo filial
  sucursalControl = new FormControl(null);
  timbradoDetalleControl = new FormControl({value: null, disabled: true}, Validators.required);
  monedaControl = new FormControl(null);
  tipoCambioControl = new FormControl({value: null, disabled: true});

  dataSource = new MatTableDataSource<FacturaLegalItem>([]);
  selectedFacturaItem: FacturaLegalItem;
  cantidadHojas = 1;

  digitoVerificador = "";

  guardarSub = new Subject<boolean>();

  isNuevoCliente = false;

  isServidor = false;
  
  // Listas para modo filial
  sucursalList: Sucursal[] = [];
  timbradoDetalleList: TimbradoDetalle[] = [];
  monedaList: Moneda[] = [];
  selectedSucursal: Sucursal;
  selectedTimbradoDetalle: TimbradoDetalle;
  selectedMoneda: Moneda;
  
  // Totales calculados por moneda
  totalFinalEnMoneda: number = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: FacturaLegalData,
    private matDialogRef: MatDialogRef<AddFacturaLegalDialogComponent>,
    private facturaService: FacturaLegalService,
    private clienteService: ClienteService,
    private notificacionService: NotificacionSnackbarService,
    private dialogoService: DialogosService,
    private matDialog: MatDialog,
    private personaService: PersonaService,
    private cajaService: CajaService,
    private personaSearch: PersonaSearchGQL,
    private dialog: MatDialog,
    private sucursalService: SucursalService,
    private timbradoService: TimbradoService,
    private monedaService: MonedaService,
    private cambioService: CambioService
  ) {}
  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.isServidor && this.sucursalSelect) {
        // Si es modo filial, abrir el panel del select de sucursal
        try {
          this.sucursalSelect.open();
        } catch (e) {
          console.log('No se pudo abrir el select automáticamente');
        }
      } else if (this.rucInput) {
        // Modo normal, enfocar en RUC
        this.rucInput.nativeElement.focus();
      }
    }, 600);
  }

  onSucursalSelectOpened() {
    // Este método se llama cuando el select se abre, útil para debugging
  }

  ngOnInit(): void {
    this.clienteDescripcionControl.disable();
    this.direccionControl.disable();
    this.emailControl.disable();
    
    // Detectar modo filial
    this.isServidor = this.data?.isServidor === true;
    
    this.cargarDatos();
    
    // Si es modo filial, cargar datos adicionales
    if (this.isServidor) {
      this.cargarDatosFilial();
    }

    this.rucControl.valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      if (this.rucControl.value?.length > 4) {
        this.digitoVerificador = getDigitoVerificadorString(
          this.rucControl.value
        );
      } else {
        this.digitoVerificador = "";
      }
    });
    
    // Suscribirse a cambios en totales para recalcular en moneda extranjera
    this.totalFinalControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.calcularTotalEnMoneda();
    });
    
    this.tipoCambioControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.calcularTotalEnMoneda();
    });
  }

  cargarDatos() {
    if (this.data.venta != null) {
      this.totalFinalControl.setValue(this.data?.venta?.totalGs);
    }
    if (this.data.ventaItemList != null) {
      let facturaItemList: FacturaLegalItem[] = [];
      this.data.ventaItemList.forEach((v) => {
        let facturaItem = new FacturaLegalItem();
        facturaItem.cantidad = v.cantidad;
        facturaItem.descripcion = v.producto.descripcionFactura;
        facturaItem.precioUnitario = v.precio;
        facturaItem.total = v.cantidad * v.precio;
        facturaItem.presentacion = v.presentacion;
        facturaItem.producto = v.producto;
        facturaItemList.push(facturaItem);
      });
      this.cantidadHojas = Math.floor(facturaItemList.length / 7) + 1;
      this.dataSource.data = facturaItemList;
    }
  }
  
  cargarDatosFilial() {
    // Cargar sucursales activas
    // this.sucursalService.onGetAllSucursalesByActive(true, true)
    //   .pipe(untilDestroyed(this))
    //   .subscribe({
    //     next: (sucursales) => {
    //       this.sucursalList = sucursales || [];
    //       console.log('Sucursales cargadas:', this.sucursalList);
    //     },
    //     error: (error) => {
    //       console.error('Error al cargar sucursales:', error);
    //       this.notificacionService.openWarn('Error al cargar sucursales');
    //     }
    //   });
     this.sucursalService.onGetAllSucursalesByActive(true, true)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (sucursales) => {
          this.sucursalList = sucursales || [];
          console.log('Sucursales cargadas:', this.sucursalList);
        },
        error: (error) => {
          console.error('Error al cargar sucursales:', error);
          this.notificacionService.openWarn('Error al cargar sucursales');
        }
      });
    
    // Cargar monedas
    this.monedaService.onGetAll(true)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (monedas) => {
          this.monedaList = monedas || [];
          console.log('Monedas cargadas:', this.monedaList);
        },
        error: (error) => {
          console.error('Error al cargar monedas:', error);
          this.notificacionService.openWarn('Error al cargar monedas');
        }
      });
    
    // Suscribirse a cambios de sucursal para cargar timbrados
    this.sucursalControl.valueChanges.pipe(untilDestroyed(this)).subscribe((sucursal: Sucursal) => {
      if (sucursal) {
        this.selectedSucursal = sucursal;
        this.timbradoDetalleControl.enable();
        this.cargarTimbradosPorSucursal(sucursal.id);
      } else {
        this.timbradoDetalleList = [];
        this.timbradoDetalleControl.setValue(null);
        this.timbradoDetalleControl.disable();
      }
    });
    
    // Suscribirse a cambios de timbrado detalle
    this.timbradoDetalleControl.valueChanges.pipe(untilDestroyed(this)).subscribe((timbradoDetalle: TimbradoDetalle) => {
      this.selectedTimbradoDetalle = timbradoDetalle;
    });
    
    // Suscribirse a cambios de moneda para cargar último cambio
    this.monedaControl.valueChanges.pipe(untilDestroyed(this)).subscribe((moneda: Moneda) => {
      if (moneda && moneda.denominacion !== 'GUARANI') {
        this.selectedMoneda = moneda;
        this.tipoCambioControl.enable();
        this.cargarUltimoCambio(moneda.id);
      } else {
        this.selectedMoneda = null;
        this.tipoCambioControl.setValue(null);
        this.tipoCambioControl.disable();
      }
    });
  }
  
  cargarTimbradosPorSucursal(sucursalId: number) {
    this.timbradoService.onGetTimbradoDetallesBySucursalId(sucursalId, true)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (timbradoDetalles) => {
          this.timbradoDetalleList = timbradoDetalles || [];
          console.log('Timbrados cargados para sucursal', sucursalId, ':', this.timbradoDetalleList);
          // Si hay solo uno, preseleccionarlo
          if (this.timbradoDetalleList.length === 1) {
            this.timbradoDetalleControl.setValue(this.timbradoDetalleList[0]);
            this.selectedTimbradoDetalle = this.timbradoDetalleList[0];
          }
        },
        error: (error) => {
          console.error('Error al cargar timbrados:', error);
          this.notificacionService.openWarn('Error al cargar timbrados para la sucursal seleccionada');
          this.timbradoDetalleList = [];
        }
      });
  }
  
  cargarUltimoCambio(monedaId: number) {
    // Intentar primero con el cambio del modelo Moneda si está disponible
    if (this.selectedMoneda?.cambio) {
      this.tipoCambioControl.setValue(this.selectedMoneda.cambio);
    } else {
      // Si no está disponible, obtener el último cambio desde el servicio
      this.cambioService.getUltimoCambioPorMonedaId(monedaId)
        .pipe(untilDestroyed(this))
        .subscribe((cambio) => {
          if (cambio && cambio.valorEnGs) {
            this.tipoCambioControl.setValue(cambio.valorEnGs);
          }
        });
    }
  }
  
  calcularTotalEnMoneda() {
    if (this.selectedMoneda && this.tipoCambioControl.value && this.totalFinalControl.value) {
      const totalConDescuento = this.totalFinalControl.value - (this.data?.descuento || 0);
      this.totalFinalEnMoneda = totalConDescuento / this.tipoCambioControl.value;
    } else {
      this.totalFinalEnMoneda = 0;
    }
  }

  buscarCliente() {
    this.clienteDescripcionControl.disable();
    this.direccionControl.disable();
    this.emailControl.disable();

    if (!this.rucControl.valid) {
      this.onClienteSearch();
      return;
    }

    const documento = ((this.rucControl.value || "") + "")
      .trim()
      .split("-")[0];
    this.rucControl.setValue(documento);

    this.clienteService
      .onGetClientePorPersonaDocumento(documento, false)
      .subscribe({
        next: (cliente) => {
          if (cliente) {
            this.setCliente(cliente);
            // Si el cliente fue encontrado y los campos están deshabilitados, ir a Dirección
            setTimeout(() => {
              if (this.clienteDescripcionControl.disabled) {
                this.direccionInput?.nativeElement?.focus();
              } else {
                // Si por alguna razón está habilitado, ir a Razón Social
                this.nombreInput?.nativeElement?.focus();
              }
            }, 100);
          } else {
            this.prepararNuevoClienteManual();
            // Ya hace focus en nombreInput dentro del método
          }
        },
        error: (error) => {
          const errorMessage = this.extractErrorMessage(error);
          
          if (errorMessage?.includes("El cliente no es contribuyente de SET")) {
            this.prepararClienteNoContribuyente();
            // Ya hace focus en nombreInput dentro del método
          } else if (errorMessage?.includes("Error al conectar con el servidor central")) {
            this.prepararClienteSinServidorCentral();
            // Ya hace focus en nombreInput dentro del método
          } else {
            // Otros errores: permitir crear factura sin crear persona/cliente
            this.prepararFacturaSinCliente();
            // Ya hace focus en nombreInput dentro del método
          }
        },
      });
  }

  private extractErrorMessage(error: any): string {
    if (error?.message) {
      return error.message;
    }
    if (error?.errors && error.errors.length > 0 && error.errors[0]?.message) {
      return error.errors[0].message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return null;
  }

  prepararClienteNoContribuyente() {
    this.isNuevoCliente = true;
    this.selectedCliente = new Cliente();
    this.selectedCliente.documento = this.rucControl.value;
    this.selectedCliente.tributa = false;
    this.tributaControl.setValue(false);
    this.clienteDescripcionControl.enable();
    this.direccionControl.enable();
    this.emailControl.enable();
    this.clienteDescripcionControl.setValue(null);
    this.direccionControl.setValue(null);
    this.emailControl.setValue(null);
    this.nombreInput?.nativeElement.focus();
  }

  prepararClienteSinServidorCentral() {
    this.isNuevoCliente = false; // No guardar como cliente
    this.selectedCliente = null;
    this.clienteDescripcionControl.enable();
    this.direccionControl.enable();
    this.emailControl.enable();
    this.clienteDescripcionControl.setValue(null);
    this.direccionControl.setValue(null);
    this.emailControl.setValue(null);
    this.tributaControl.setValue(true);
    this.nombreInput?.nativeElement.focus();
  }

  prepararFacturaSinCliente() {
    this.isNuevoCliente = false; // No guardar como cliente
    this.selectedCliente = null;
    this.clienteDescripcionControl.enable();
    this.direccionControl.enable();
    this.emailControl.enable();
    this.clienteDescripcionControl.setValue(null);
    this.direccionControl.setValue(null);
    this.emailControl.setValue(null);
    this.tributaControl.setValue(true);
    this.nombreInput?.nativeElement.focus();
  }

  prepararNuevoClienteManual() {
    this.isNuevoCliente = true;
    this.selectedCliente = new Cliente();
    this.selectedCliente.documento = this.rucControl.value;
    this.selectedCliente.tributa = this.tributaControl.value;
    this.clienteDescripcionControl.enable();
    this.direccionControl.enable();
    this.emailControl.enable();
    this.clienteDescripcionControl.setValue(null);
    this.direccionControl.setValue(null);
    this.emailControl.setValue(null);
    this.nombreInput?.nativeElement.focus();
  }

  setCliente(res: Cliente) {
    if (res == null) return;
    
    this.selectedCliente = new Cliente();
    Object.assign(this.selectedCliente, res);
    this.isNuevoCliente = false;
    this.notificacionService.openSucess("Cliente encontrado");
    this.clienteDescripcionControl.enable();
    this.direccionControl.enable();
    this.emailControl.enable();
    this.clienteDescripcionControl.setValue(res.persona?.nombre);
    this.direccionControl.setValue(res?.persona?.direccion);
    this.emailControl.setValue(res.persona?.email || null);
    this.clienteDescripcionControl.disable();
    // Dirección y email permanecen habilitados para permitir edición
    this.tributaControl.setValue(res?.tributa == false ? false : true);
    // Wait for clienteService response and handle success and error
    //     if (this.selectedCliente?.verificadoSet == false) {
    //       this.clienteService.onConsultaRuc(this.rucControl.value).subscribe({
    //         next: (rucRes) => {
    //           if (rucRes?.ruc != null) {
    //             this.clienteDescripcionControl.setValue(rucRes?.nombre);
    //             this.direccionControl.setValue(rucRes?.direccion);
    //             this.tributaControl.setValue(true);
    //             if (
    //               (this.selectedCliente.nombre != rucRes.nombre &&
    //                 this.selectedCliente.nombre != rucRes?.nombreFantasia) ||
    //               this.selectedCliente.persona.direccion != rucRes.direccion
    //             )
    //               this.dialogoService
    //                 .confirm(
    //                   "Atención!!",
    //                   "Los datos del cliente guardados en el sistema son diferentes a los verificados en la plataforma de SET, le gustaria actualizar?"
    //                 )
    //                 .subscribe((dialogRes) => {
    //                   if (dialogRes) {
    //                     this.selectedCliente.nombre = rucRes.nombre;
    //                     this.selectedCliente.direccion = rucRes.direccion;
    //                     this.selectedCliente.tributa = true;
    //                     this.selectedCliente.verificadoSet = true;
    //                     this.clienteService
    //                       .onSaveCliente(this.selectedCliente.toInput())
    //                       .subscribe();
    //                   }
    //                 });
    //           } else {
    //             console.log("entra en el no tributa");
    //             this.tributaControl.setValue(false);
    //             this.selectedCliente.tributa = false;
    //             this.selectedCliente.verificadoSet = true;
    //             this.selectedCliente.documento = rucRes.ruc;
    //
    //             this.clienteService
    //               .onSaveCliente(this.selectedCliente.toInput())
    //               .subscribe();
    //           }
    //         },
    //         error: (error) => {
    //           this.notificacionService.openSucess("No fue posible consultar SET");
    //         },
    //         complete: () => {},
    //       });
    //     }
  }

  crearNuevoCliente(persona?: Persona) {
    this.prepararNuevoClienteManual();
    if (persona) {
      this.clienteDescripcionControl.setValue(persona.nombre);
      this.direccionControl.setValue(persona.direccion);
      this.emailControl.setValue(persona.email || null);
    }
    // this.clienteService.onConsultaRuc(this.rucControl.value).subscribe({
    //   next: (rucRes) => {
    //     if (rucRes?.nombre != null) {
    //       this.clienteDescripcionControl.setValue(rucRes.nombre);
    //       this.direccionControl.setValue(rucRes?.direccion);
    //       this.selectedCliente = new Cliente;
    //       this.selectedCliente.documento = rucRes.ruc;
    //     } else {
    //       this.dialogoService
    //         .confirm(
    //           "Atención!!",
    //           "Este ruc no esta registrado en la SET. Desea editar el ruc o continuar?",
    //           "Si continua se cambiara a facturación con cédula (sin guión)",
    //           null,
    //           true,
    //           "Editar ruc",
    //           "Continuar"
    //         )
    //         .subscribe((dialogRes) => {
    //           if(!dialogRes){
    //             this.tributaControl.setValue(false);
    //             this.clienteDescripcionControl.enable();
    //             this.direccionControl.enable();
    //             this.nombreInput.nativeElement.focus();
    //             this.selectedCliente = new Cliente;
    //             this.selectedCliente.documento = rucRes.ruc;
    //           } else {
    //             this.nombreInput.nativeElement.select();
    //           }
    //
    //         });
    //     }
    //   },
    //   error: (error) => {
    //     this.clienteDescripcionControl.enable();
    //     this.direccionControl.enable();
    //     this.nombreInput.nativeElement.focus();
    //   },
    //   complete: () => {
    //     if (persona != null) {
    //       //hay persona no hay cliente
    //       if(this.selectedCliente == null) this.selectedCliente = new Cliente();
    //       this.selectedCliente.persona = persona;
    //       this.selectedCliente.tipo = TipoCliente.NORMAL;
    //       this.setCliente(this.selectedCliente);
    //     }
    //   },
    // });
  }

  onGuardarCliente() {
    this.imprimirBtn.onGetFocus();
  }

  onCancelarNuevoCliente() {}

  editItem(item, i) {}

  deleteItem(item, i) {
    this.dataSource.data = updateDataSource(this.dataSource.data, null, i);
    this.calcularTotal();
  }

  onSelectItem(row) {}

  addItem(item, i?) {
    this.matDialog
      .open(EditFacturaLegalItemComponent, {
        data: {
          facturaItem: item,
          moneda: this.selectedMoneda,
          tipoCambio: this.tipoCambioControl.value,
        },
        width: "100%",
      })
      .afterClosed()
      .subscribe((res) => {
        if (res != null) {
          this.dataSource.data = updateDataSource(this.dataSource.data, res, i);
          this.calcularTotal();
        }
      });
  }

  calcularTotal() {
    let total = 0;
    this.dataSource.data.forEach((f) => {
      total += f.cantidad * f.precioUnitario;
    });
    this.totalFinalControl.setValue(total);
    this.calcularTotalEnMoneda();
  }

  onCancelar() {
    this.matDialogRef.close(null);
  }

  onGuardar() {
    // Si es modo filial, preguntar si desea imprimir (pero el guardado siempre ocurre)
    if (this.isServidor) {
      this.dialogoService
        .confirm(
          "Atención",
          "Verificar si hay hoja en la impresora",
          "Desea imprimir después de guardar?"
        )
        .subscribe((deseaImprimir) => {
          this.onSaveFactura(deseaImprimir);
        });
    } else {
      // Modo normal (desde venta)
      this.dialogoService
        .confirm(
          "Atención",
          "Verificar si hay hoja en la impresora",
          "Desea imprimir?"
        )
        .subscribe((res) => {
          if (res) {
            this.onSaveFactura(false);
          }
        });
    }
  }

  onClienteSearch() {
    let data: SearchListtDialogData = {
      titulo: "Buscar Persona",
      query: this.personaSearch,
      tableData: [
        { id: "id", nombre: "Id", width: "10%" },
        { id: "nombre", nombre: "Nombre", width: "70%" },
        { id: "documento", nombre: "Documento/Ruc", width: "20%" },
      ],
      search: true,
      isServidor: this.isServidor,
    };
    this.dialog
      .open(SearchListDialogComponent, {
        data,
        height: "50%",
        width: "50%",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: Persona) => {
        if (res != null) {
          this.onClear();
          this.rucControl.setValue(res.documento);
          this.buscarCliente();
        }
      });
  }

  onClear() {
    this.selectedCliente = null;
    this.clienteDescripcionControl.enable();
    this.direccionControl.enable();
    this.clienteDescripcionControl.setValue(null);
    this.direccionControl.setValue(null);
    this.clienteDescripcionControl.disable();
    this.direccionControl.disable();
    this.rucInput.nativeElement.select();
    this.tributaControl.setValue(true);
    this.emailControl.setValue(null);
    this.emailControl.disable();
  }

  onRucEnter(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    keyboardEvent.preventDefault();
    this.buscarCliente();
  }

  onNombreEnter(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    keyboardEvent.preventDefault();
    // Siempre ir a Dirección después de Razón Social
    setTimeout(() => {
      this.direccionInput?.nativeElement?.focus();
    }, 50);
  }

  onDireccionEnter(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    keyboardEvent.preventDefault();
    setTimeout(() => {
      this.emailInput?.nativeElement?.focus();
    }, 50);
  }

  onEmailEnter(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    keyboardEvent.preventDefault();
    setTimeout(() => {
      this.imprimirBtn?.onGetFocus();
    }, 50);
  }

  onSaveCliente() {
    if (
      this.rucControl.valid &&
      this.clienteDescripcionControl.valid &&
      this.totalFinalControl.valid
    ) {
      this.onGuardar();
    }
  }

  onSaveFactura(deseaImprimir: boolean = false) {
    let factura = new FacturaLegal();
    factura.credito = this.creditoControl.value;
    factura.direccion = this.direccionControl.value;
    factura.email = this.emailControl.value;
    factura.fecha = this.fechaControl.value;
    factura.nombre = this.clienteDescripcionControl.value;
    factura.ruc = this.rucControl.value;
    factura.caja = this.cajaService?.selectedCaja;
    factura.descuento = this.data?.descuento || 0;
    
    // Calcular totales antes de guardar
    this.calcularTotal();
    
    // Asignar totalFinal (con descuento aplicado)
    const totalConDescuento = this.totalFinalControl.value - (this.data?.descuento || 0);
    factura.totalFinal = totalConDescuento;
    
    // Si es modo filial, agregar campos adicionales
    if (this.isServidor) {
      factura.sucursalId = this.selectedSucursal?.id;
      factura.monedaExtranjera = this.selectedMoneda && this.selectedMoneda.denominacion !== 'GUARANI' 
        ? this.selectedMoneda.denominacion 
        : null;
      factura.tipoCambio = this.tipoCambioControl.value;
      factura.timbradoDetalle = this.selectedTimbradoDetalle;
    }
    
    // Preparar datos del cliente para enviar al backend (el backend manejará creación/actualización)
    if (this.selectedCliente?.id != null) {
      // Cliente existente con ID
      factura.cliente = this.selectedCliente;
    } else if (this.clienteDescripcionControl.value && this.rucControl.value) {
      // Cliente nuevo o sin ID - crear objeto temporal con datos del formulario
      // El backend se encargará de crear/actualizar el cliente
      const clienteTemp = new Cliente();
      clienteTemp.documento = this.rucControl.value;
      clienteTemp.nombre = this.clienteDescripcionControl.value;
      clienteTemp.direccion = this.direccionControl.value;
      clienteTemp.tributa = this.tributaControl.value;
      factura.cliente = clienteTemp;
    }
    
    const facturaItemInputList: FacturaLegalItemInput[] = this.dataSource.data.map((f) => f.toInput());
    const facturaInput = factura.toInput();

    // Si es modo filial, usar el nuevo método
    if (this.isServidor) {
      this.onSaveFacturaToFilial(facturaInput, facturaItemInputList, deseaImprimir);
    } else {
      // Modo normal (desde venta)
      // Intento principal: servidor central. Si falla, fallback al servidor local
      this.facturaService
        .onSaveFactura(facturaInput, facturaItemInputList, false)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (res: TimbradoDetalle) => {
            if (res != null) {
              this.handleFacturaSuccess(res);
            } else {
              this.trySaveFacturaLocal(facturaInput, facturaItemInputList);
            }
          },
          error: () => {
            this.trySaveFacturaLocal(facturaInput, facturaItemInputList);
          },
        });
    }
  }
  
  onSaveFacturaToFilial(facturaInput: any, facturaItemInputList: FacturaLegalItemInput[], deseaImprimir: boolean) {
    this.facturaService
      .onSaveFacturaToFilial(
        facturaInput,
        facturaItemInputList,
        this.selectedSucursal.id,
        this.selectedTimbradoDetalle.id,
        this.selectedMoneda?.id,
        this.tipoCambioControl.value
      )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res: any) => {
          if (res && res.facturaId) {
            this.notificacionService.openGuardadoConExito();
            
            // Si el usuario quiere imprimir, esperar replicación y luego imprimir
            if (deseaImprimir) {
              this.esperarReplicacionEImprimir(res.facturaId, this.selectedSucursal.id);
            } else {
              this.matDialogRef.close({
                facturado: true,
                cliente: this.selectedCliente,
              });
            }
          } else {
            this.notificacionService.openAlgoSalioMal("Error al guardar la factura en el servidor filial");
          }
        },
        error: (error) => {
          console.error("Error al guardar factura en filial:", error);
          this.notificacionService.openAlgoSalioMal("Error al guardar la factura en el servidor filial: " + (error.message || "Error desconocido"));
        },
      });
  }
  
  esperarReplicacionEImprimir(facturaId: number, sucursalId: number) {
    // Esperar 1 segundo antes de empezar a buscar
    setTimeout(() => {
      this.facturaService
        .pollFacturaLegal(facturaId, sucursalId, 3, 5000)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (factura: FacturaLegal) => {
            if (factura) {
              // Factura encontrada, imprimir
              this.facturaService.onReimprimirFactura(facturaId, sucursalId);
              this.matDialogRef.close({
                facturado: true,
                cliente: this.selectedCliente,
              });
            } else {
              // No se encontró después de los reintentos
              this.notificacionService.openWarn(
                "La factura se guardó correctamente, pero no se pudo imprimir. " +
                "La factura debería aparecer en la lista en breve."
              );
              this.matDialogRef.close({
                facturado: true,
                cliente: this.selectedCliente,
              });
            }
          },
          error: (error) => {
            console.error("Error al buscar factura para imprimir:", error);
            this.notificacionService.openWarn(
              "La factura se guardó correctamente, pero hubo un error al intentar imprimir. " +
              "Puede reimprimirla desde la lista de facturas."
            );
            this.matDialogRef.close({
              facturado: true,
              cliente: this.selectedCliente,
            });
          },
        });
    }, 1000);
  }

  private trySaveFacturaLocal(facturaInput: any, facturaItemInputList: FacturaLegalItemInput[]) {
    this.notificacionService.openWarn(
      "Servidor central no disponible. Se imprimirá desde el servidor local.",
    );
    this.facturaService
      .onSaveFactura(facturaInput, facturaItemInputList, false)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (resLocal: TimbradoDetalle) => {
          if (resLocal != null) {
            this.handleFacturaSuccess(resLocal);
          }
        },
      });
  }

  private handleFacturaSuccess(res: TimbradoDetalle) {
    this.facturaService.onShowWarningIfTimbradoAboutToExpire(res);
    this.facturaService.onShowWarningIfTimbradoRangoAboutToExpire(res);
    this.matDialogRef.close({
      facturado: true,
      cliente: this.selectedCliente,
    });
  }
}
