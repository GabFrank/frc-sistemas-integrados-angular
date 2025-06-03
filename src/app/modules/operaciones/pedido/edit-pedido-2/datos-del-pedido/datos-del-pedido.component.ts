import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { MatDatepicker } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { forkJoin } from 'rxjs';

import { Pedido } from '../../edit-pedido/pedido.model';
import { PedidoEstado } from '../../edit-pedido/pedido-enums';
import { Proveedor } from '../../../../personas/proveedor/proveedor.model';
import { Vendedor } from '../../../../personas/vendedor/vendedor.model';
import { FormaPago } from '../../../../financiero/forma-pago/forma-pago.model';
import { Moneda } from '../../../../financiero/moneda/moneda.model';
import { Sucursal } from '../../../../empresarial/sucursal/sucursal.model';

import { ProveedorService } from '../../../../personas/proveedor/proveedor.service';
import { VendedorService } from '../../../../personas/vendedor/vendedor.service';
import { FormaPagoService } from '../../../../financiero/forma-pago/forma-pago.service';
import { MonedaService } from '../../../../financiero/moneda/moneda.service';
import { SucursalService } from '../../../../empresarial/sucursal/sucursal.service';
import { PedidoService } from '../../pedido.service';
import { MainService } from '../../../../../main.service';

import { FrcSearchableSelectComponent } from '../../../../../shared/components/frc-searchable-select/frc-searchable-select.component';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { AdicionarProveedorDialogComponent } from '../../../../personas/proveedor/adicionar-proveedor-dialog/adicionar-proveedor-dialog.component';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../../shared/components/dialogos/dialogos.service';
import { dateToString } from '../../../../../commons/core/utils/dateUtils';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-datos-del-pedido',
  templateUrl: './datos-del-pedido.component.html',
  styleUrls: ['./datos-del-pedido.component.scss']
})
export class DatosDelPedidoComponent implements OnInit, OnChanges {

  @ViewChild('proveedorInput', { static: false }) proveedorInput: ElementRef;
  @ViewChild('vendedorInput', { static: false }) vendedorInput: ElementRef;
  @ViewChild('sucursalInfluenciaSelect', { static: false, read: MatSelect })
  sucursalInfluenciaSelect: MatSelect;
  @ViewChild('sucursalEntregaSelect', { static: false, read: MatSelect })
  sucursalEntregaSelect: MatSelect;
  @ViewChild('diasCreditoInput', { static: false })
  diasCreditoInput: ElementRef;
  @ViewChild('formaPagoSelect', { read: FrcSearchableSelectComponent })
  formaPagoSelect: FrcSearchableSelectComponent;
  @ViewChild('monedaSelect', { read: FrcSearchableSelectComponent })
  monedaSelect: FrcSearchableSelectComponent;
  @ViewChild('picker') picker: MatDatepicker<Date>;

  @Input() selectedPedido: Pedido | null = null;
  @Output() pedidoChange = new EventEmitter<Pedido>();
  @Output() formValid = new EventEmitter<boolean>();

  // Form groups and controls
  datosFormGroup: FormGroup;
  idControl = new FormControl(null);
  buscarProveedorControl = new FormControl(null, Validators.required);
  buscarVendedorControl = new FormControl(null);
  sucursalInfluenciaControl = new FormControl(null, Validators.required);
  sucursalEntregaControl = new FormControl(null, Validators.required);
  tipoBoletaControl = new FormControl('LEGAL', Validators.required);
  diasCreditoControl = new FormControl(null);
  fechaEntregaControl = new FormControl(null, Validators.required);

  // Selected entities
  selectedProveedor: Proveedor | null = null;
  selectedVendedor: Vendedor | null = null;
  selectedFormaPago: FormaPago | null = null;
  selectedMoneda: Moneda | null = null;

  // Lists
  vendedorList: Vendedor[] = [];
  sucursalList: Sucursal[] = [];
  tipoBoletaList: string[] = ['LEGAL', 'COMUN', 'OTRO'];
  formaPagoList: FormaPago[] = [];
  monedas: Moneda[] = [];
  auxMonedas: Moneda[] = [];
  initialDates: Date[] = [];

  // Flags
  isEditing = true;
  isLoading = false;

  constructor(
    private proveedorService: ProveedorService,
    private vendedorService: VendedorService,
    private formaPagoService: FormaPagoService,
    private monedaService: MonedaService,
    private sucursalService: SucursalService,
    private pedidoService: PedidoService,
    private mainService: MainService,
    private dialog: MatDialog,
    private notificacionService: NotificacionSnackbarService,
    private dialogoService: DialogosService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadInitialData();
    this.setupFormValidation();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedPedido']) {
      if (changes['selectedPedido'].currentValue && this.sucursalList && this.monedas && this.formaPagoList) {
        this.cargarDatosPedido();
      }
    }
  }

  initializeForm(): void {
    this.datosFormGroup = new FormGroup({
      proveedor: this.buscarProveedorControl,
      vendedor: this.buscarVendedorControl,
      sucursalInfluencia: this.sucursalInfluenciaControl,
      sucursalEntrega: this.sucursalEntregaControl,
      tipoBoleta: this.tipoBoletaControl,
      diasCredito: this.diasCreditoControl,
      fechaEntrega: this.fechaEntregaControl
    });
  }

  setupFormValidation(): void {
    this.datosFormGroup.statusChanges.subscribe(status => {
      const isFormaPagoValid = this.selectedFormaPago != null;
      const isMonedaValid = this.selectedMoneda != null;
      const areFechasValid = this.initialDates && this.initialDates.length > 0;
      
      const isValid = status === 'VALID' && isFormaPagoValid && isMonedaValid && areFechasValid;
      this.formValid.emit(isValid);
    });
  }

  loadInitialData(): void {
    this.isLoading = true;
    
    forkJoin({
      sucursales: this.sucursalService.onGetAllSucursales().pipe(untilDestroyed(this)),
      monedas: this.monedaService.onGetAll().pipe(untilDestroyed(this)),
      formasPago: this.formaPagoService.onGetAllFormaPago().pipe(untilDestroyed(this))
    }).subscribe({
      next: ({ sucursales, monedas, formasPago }) => {
        this.sucursalList = sucursales.filter(s => s.deposito === true);
        this.monedas = monedas;
        this.auxMonedas = monedas;
        this.formaPagoList = formasPago;
        
        // Load pedido data if it already exists
        if (this.selectedPedido) {
          this.cargarDatosPedido();
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading initial data:', error);
        this.notificacionService.openAlgoSalioMal('AL CARGAR DATOS INICIALES');
        this.isLoading = false;
      }
    });
  }

  cargarDatosPedido(): void {
    if (!this.selectedPedido) {
      return;
    }

    this.idControl.setValue(this.selectedPedido.id);

    // Load proveedor
    if (this.selectedPedido.proveedor) {
      this.onSelectProveedor(this.selectedPedido.proveedor);
    }

    // Load vendedor  
    if (this.selectedPedido.vendedor) {
      this.vendedorList = [this.selectedPedido.vendedor];
      this.onSelectVendedor(this.selectedPedido.vendedor);
    }

    // Load sucursales de influencia
    if (this.selectedPedido.sucursalInfluenciaList?.length > 0) {
      const sucursalInfluenciaList = this.selectedPedido.sucursalInfluenciaList.map(
        sucursalInfluencia => sucursalInfluencia.sucursal
      );
      this.sucursalInfluenciaControl.setValue(
        this.sucursalList.filter(s => 
          sucursalInfluenciaList.map(s2 => s2.id).includes(s.id)
        )
      );
    }

    // Load sucursales de entrega
    if (this.selectedPedido.sucursalEntregaList?.length > 0) {
      const sucursalEntregaList = this.selectedPedido.sucursalEntregaList.map(
        sucursalEntrega => sucursalEntrega.sucursal
      );
      this.sucursalEntregaControl.setValue(
        this.sucursalList.filter(s => 
          sucursalEntregaList.map(s2 => s2.id).includes(s.id)
        )
      );
    }

    // Load fechas de entrega
    if (this.selectedPedido.fechaEntregaList?.length > 0) {
      const fechaEntregaList = this.selectedPedido.fechaEntregaList.map(
        fechaEntrega => new Date(fechaEntrega.fechaEntrega)
      );
      this.initialDates = fechaEntregaList;
      this.fechaEntregaControl.setValue(fechaEntregaList);
    }

    // Load other fields
    this.tipoBoletaControl.setValue(this.selectedPedido.tipoBoleta);
    this.diasCreditoControl.setValue(this.selectedPedido.plazoCredito);

    // Load forma de pago
    if (this.selectedPedido.formaPago) {
      this.handleFormaPagoSelectionChange(
        this.formaPagoList.find(forma => forma.id === this.selectedPedido.formaPago.id)
      );
    }

    // Load moneda
    if (this.selectedPedido.moneda) {
      this.handleMonedaSelectionChange(
        this.monedas.find(moneda => moneda.id === this.selectedPedido.moneda.id)
      );
    }

    // Set editing state based on pedido estado
    this.isEditing = this.selectedPedido.estado === PedidoEstado.ABIERTO;
    this.cambiarEstado(!this.isEditing);
  }

  onBuscarProveedor(): void {
    if (this.buscarProveedorControl.valid) {
      const texto: string = this.buscarProveedorControl.value;
      if (!isNaN(+texto)) {
        // Search by ID
        this.proveedorService.onGetPorId(+texto)
          .pipe(untilDestroyed(this))
          .subscribe((res) => {
            if (res) {
              this.onSelectProveedor(res);
            } else {
              this.onSearchProveedorPorTexto();
            }
          });
      } else if (this.selectedProveedor && texto.includes(this.selectedProveedor.persona.nombre)) {
        this.vendedorInput?.nativeElement.focus();
      } else {
        this.onSearchProveedorPorTexto();
      }
    } else {
      this.onSearchProveedorPorTexto();
    }
  }

  onSearchProveedorPorTexto(): void {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'Id' },
      { id: 'nombre', nombre: 'Nombre', nested: true, nestedId: 'persona' },
      { id: 'documento', nombre: 'RUC/CI', nested: true, nestedId: 'persona' }
    ];

    const data: SearchListtDialogData = {
      query: this.proveedorService.proveedorSearch,
      tableData: tableData,
      titulo: 'BUSCAR PROVEEDOR',
      search: true,
      texto: this.buscarProveedorControl.value,
      inicialSearch: this.buscarProveedorControl.valid,
      isAdicionar: true
    };

    this.dialog.open(SearchListDialogComponent, {
      data: data,
      width: '60%',
      height: '80%'
    }).afterClosed().subscribe((res: Proveedor) => {
      if (res) {
        if (res['adicionar'] === true) {
          this.dialog.open(AdicionarProveedorDialogComponent, {
            width: '600px'
          }).afterClosed().subscribe((proveedorRes) => {
            if (proveedorRes?.id) {
              this.onSelectProveedor(proveedorRes);
            }
          });
        } else if (res?.id) {
          this.onSelectProveedor(res);
        }
      }
    });
  }

  onSelectProveedor(proveedor: Proveedor): void {
    if (proveedor) {
      this.selectedProveedor = proveedor;
      this.vendedorList = proveedor?.vendedores || [];
      this.buscarProveedorControl.setValue(
        `${this.selectedProveedor.id} - ${this.selectedProveedor.persona.nombre}`
      );
      
      this.diasCreditoControl.setValue(this.selectedProveedor.chequeDias);
      
      if (proveedor.credito) {
        this.selectedFormaPago = this.formaPagoList.find(fp => fp.descripcion === 'CHEQUE');
      }
      
      this.vendedorInput?.nativeElement.focus();
      this.emitPedidoChange();
    } else {
      this.selectedProveedor = null;
      this.vendedorList = [];
      this.buscarProveedorControl.setValue(null, { emitEvent: false });
      this.vendedorInput?.nativeElement.focus();
    }
  }

  onClearProveedor(): void {
    this.onSelectProveedor(null);
  }

  onBuscarVendedor(): void {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'Id' },
      { id: 'nombre', nombre: 'Nombre', nested: true, nestedId: 'persona' },
      { id: 'documento', nombre: 'RUC/CI', nested: true, nestedId: 'persona' }
    ];

    const data: SearchListtDialogData = {
      query: this.vendedorService.vendedorSearch,
      tableData: tableData,
      titulo: 'BUSCAR VENDEDOR',
      search: false,
      texto: this.buscarVendedorControl.value,
      inicialSearch: false,
      inicialData: this.vendedorList,
      isAdicionar: false
    };

    this.dialog.open(SearchListDialogComponent, {
      data: data,
      width: '60%',
      height: '80%'
    }).afterClosed().subscribe((res: Vendedor) => {
      if (res?.id) {
        this.onSelectVendedor(res);
      }
    });
  }

  onSelectVendedor(vendedor: Vendedor, focus = true): void {
    if (vendedor) {
      this.selectedVendedor = vendedor;
      this.buscarVendedorControl.setValue(
        `${this.selectedVendedor.id} - ${this.selectedVendedor.persona.nombre}`
      );
      if (focus) {
        this.sucursalInfluenciaSelect?.focus();
      }
      this.emitPedidoChange();
    } else {
      this.selectedVendedor = null;
      this.buscarVendedorControl.setValue(null, { emitEvent: false });
      if (focus) {
        this.vendedorInput?.nativeElement.focus();
      }
    }
  }

  onClearVendedor(): void {
    this.onSelectVendedor(null);
  }

  handleFormaPagoSelectionChange(value: FormaPago): void {
    this.selectedFormaPago = value;
    
    if (this.selectedFormaPago?.descripcion.includes('TARJETA')) {
      this.monedas = this.auxMonedas.filter(m => m.denominacion.includes('GUARANI'));
    } else if (this.selectedFormaPago?.descripcion.includes('PIX')) {
      this.monedas = this.auxMonedas.filter(m => m.denominacion.includes('REAL'));
    } else {
      this.monedas = this.auxMonedas;
    }
    
    this.emitPedidoChange();
  }

  handleMonedaSelectionChange(value: Moneda): void {
    this.selectedMoneda = value;
    this.emitPedidoChange();
  }

  handleDatesChanged(dates: Date[]): void {
    this.fechaEntregaControl.setValue(dates);
    this.emitPedidoChange();
  }

  onSetSucEntrega(): void {
    if (this.sucursalInfluenciaControl.value && this.sucursalInfluenciaControl.value.length === 1) {
      this.sucursalEntregaControl.setValue(this.sucursalInfluenciaControl.value);
    }
  }

  onSucursalInfluenciaChange(): void {
    this.onSetSucEntrega();
    this.emitPedidoChange();
  }

  onSucursalEntregaChange(): void {
    this.emitPedidoChange();
  }

  onTipoBoletaChange(): void {
    this.emitPedidoChange();
  }

  onDiasCreditoChange(): void {
    this.emitPedidoChange();
  }

  cambiarEstado(deshabilitar: boolean): void {
    if (deshabilitar) {
      this.buscarProveedorControl.disable();
      this.buscarVendedorControl.disable();
      this.sucursalInfluenciaControl.disable();
      this.sucursalEntregaControl.disable();
      this.tipoBoletaControl.disable();
      this.diasCreditoControl.disable();
      this.fechaEntregaControl.disable();
      
      this.isEditing = false;
    } else {
      this.buscarProveedorControl.enable();
      this.buscarVendedorControl.enable();
      this.sucursalInfluenciaControl.enable();
      this.sucursalEntregaControl.enable();
      this.tipoBoletaControl.enable();
      this.diasCreditoControl.enable();
      this.fechaEntregaControl.enable();
      
      this.isEditing = true;
    }
  }

  onEditar(): void {
    this.cambiarEstado(false);
  }

  onEliminar(): void {
    if (!this.selectedPedido?.id) {
      this.notificacionService.openWarn('NO HAY PEDIDO PARA ELIMINAR');
      return;
    }

    this.dialogoService.confirm(
      'CONFIRMAR ELIMINACIÓN',
      `¿Está seguro que desea eliminar el pedido #${this.selectedPedido.id}?`,
      'Esta acción no se puede deshacer',
      null,
      true,
      'ELIMINAR',
      'CANCELAR'
    ).subscribe(confirmed => {
      if (confirmed) {
        this.notificacionService.openWarn('FUNCIÓN DE ELIMINAR PEDIDO NO IMPLEMENTADA AÚN');
        // TODO: Implement delete functionality when available
        // this.pedidoService.onDeletePedido(this.selectedPedido.id)
        //   .pipe(untilDestroyed(this))
        //   .subscribe({
        //     next: () => {
        //       this.notificacionService.openSucess('PEDIDO ELIMINADO CORRECTAMENTE');
        //       // Reset form or navigate back
        //       this.selectedPedido = null;
        //       this.datosFormGroup.reset();
        //       this.selectedProveedor = null;
        //       this.selectedVendedor = null;
        //       this.selectedFormaPago = null;
        //       this.selectedMoneda = null;
        //       this.initialDates = [];
        //     },
        //     error: (error) => {
        //       console.error('Error deleting pedido:', error);
        //       this.notificacionService.openAlgoSalioMal('AL ELIMINAR PEDIDO');
        //     }
        //   });
      }
    });
  }

  emitPedidoChange(): void {
    if (!this.selectedPedido) {
      this.selectedPedido = new Pedido();
      this.selectedPedido.estado = PedidoEstado.ABIERTO;
      this.selectedPedido.usuario = this.mainService.usuarioActual;
    }

    this.selectedPedido.proveedor = this.selectedProveedor;
    this.selectedPedido.vendedor = this.selectedVendedor;
    this.selectedPedido.formaPago = this.selectedFormaPago;
    this.selectedPedido.moneda = this.selectedMoneda;
    this.selectedPedido.tipoBoleta = this.tipoBoletaControl.value;
    this.selectedPedido.plazoCredito = this.diasCreditoControl.value;

    this.pedidoChange.emit(this.selectedPedido);
  }

  async onGuardar(): Promise<Pedido> {
    return new Promise((resolve, reject) => {
      if (!this.isFormValid()) {
        this.notificacionService.openWarn('COMPLETE TODOS LOS CAMPOS REQUERIDOS');
        reject('Formulario inválido');
        return;
      }

      this.emitPedidoChange();
      let pedidoaux = new Pedido();
      Object.assign(pedidoaux, this.selectedPedido); //this is to avoid error .toInput() is not a function
      this.pedidoService.onSaveFull(
        pedidoaux.toInput(),
        this.fechaEntregaControl.value?.map((entity: Date) => dateToString(entity)),
        this.sucursalEntregaControl.value?.map((entity: Sucursal) => entity.id),
        this.sucursalInfluenciaControl.value?.map((entity: Sucursal) => entity.id),
        this.mainService.usuarioActual.id
      ).pipe(untilDestroyed(this)).subscribe({
        next: (pedidoRes) => {
          if (pedidoRes) {
            this.selectedPedido.id = pedidoRes.id;
            this.selectedPedido.creadoEn = pedidoRes.creadoEn;
            this.idControl.setValue(this.selectedPedido.id);
            this.cambiarEstado(true);
            this.notificacionService.openSucess('PEDIDO GUARDADO CORRECTAMENTE');
            resolve(pedidoRes);
          } else {
            reject('Error al guardar');
          }
        },
        error: (error) => {
          console.error('Error saving pedido:', error);
          this.notificacionService.openAlgoSalioMal('AL GUARDAR PEDIDO');
          reject(error);
        }
      });
    });
  }

  isFormValid(): boolean {
    const isBasicFormValid = this.datosFormGroup.valid;
    const isFormaPagoValid = this.selectedFormaPago != null;
    const isMonedaValid = this.selectedMoneda != null;
    const areFechasValid = this.initialDates && this.initialDates.length > 0;
    
    return isBasicFormValid && isFormaPagoValid && isMonedaValid && areFechasValid;
  }
} 