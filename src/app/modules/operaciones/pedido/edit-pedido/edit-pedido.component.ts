import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { SelectionModel } from '@angular/cdk/collections';
import { Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer } from '@angular/platform-browser';
import { Apollo } from 'apollo-angular';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabData, TabService } from '../../../../layouts/tab/tab.service';
import { MainService } from '../../../../main.service';
import { MonedasSearchGQL } from '../../../../modules/financiero/moneda/graphql/monedasSearch';
import { Moneda } from '../../../../modules/financiero/moneda/moneda.model';
import { ProveedorByIdGQL } from '../../../../modules/personas/proveedor/graphql/proveedorById';
import { ProveedoresSearchByPersonaGQL } from '../../../../modules/personas/proveedor/graphql/proveedorSearchByPersona';
import { Proveedor } from '../../../../modules/personas/proveedor/proveedor.model';
import { VendedorByIdGQL } from '../../../../modules/personas/vendedor/graphql/vendedorById';
import {
  Vendedor,
  VendedoresSearchByPersonaGQL,
} from '../../../../modules/personas/vendedor/graphql/vendedorSearchByPersona';
import {
  productoExistenciaCostoPorProveedor,
  productosExistenciaCostoSearch,
} from '../../../../modules/productos/producto/graphql/graphql-query';
import { ProductoInfoCompletaByIdGQL } from '../../../../modules/productos/producto/graphql/productoInfoCompletaPorId';
import {
  ExistenciaCostoPorSucursal,
  Producto,
  ProductoUltimasCompra,
} from '../../../../modules/productos/producto/producto.model';
import { SearchProductoDialogComponent } from '../../../../modules/productos/producto/search-producto-dialog/search-producto-dialog.component';
import { CargandoDialogComponent } from '../../../../shared/components/cargando-dialog/cargando-dialog.component';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { WindowInfoService } from '../../../../shared/services/window-info.service';
import { environment } from '../../../../../environments/environment';
import { savePedido } from '../graphql/graphql-query';
import { ListPedidoComponent } from '../list-pedido/list-pedido.component';
import { savePedidoItem } from '../pedido-itens/graphql/graphql-query';
import { PedidoItemService } from '../pedido-itens/pedido-item.service';
import { PedidoItemSucursalInput } from '../pedido-itens/pedido-item-sucursal/pedido-item-sucursal.model';
import { PedidoItensDialogComponent } from '../pedido-itens/pedido-itens-dialog/pedido-itens-dialog.component';
import { PedidoService } from '../pedido.service';
import { FormaPago, PedidoEstado } from './pedido-enums';
import { PedidoItem, PedidoItemInput } from './pedido-item.model';
import { Pedido, PedidoFormModel, PedidoInput } from './pedido.model';
import { savePedidoItemSucursal } from '../pedido-itens/pedido-item-sucursal/graphql/graphql-query';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { MatOptionSelectionChange } from '@angular/material/core';

export interface Transaction {
  item: string;
  cost: number;
}

@Component({
  selector: 'app-edit-pedido',
  templateUrl: './edit-pedido.component.html',
  styleUrls: ['./edit-pedido.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class EditPedidoComponent implements OnInit {
  @Input() data;

  @ViewChild('autoVendedorInput', {
    static: false,
    read: MatAutocompleteTrigger,
  })
  matVendedorTrigger: MatAutocompleteTrigger;
  @ViewChild('autoVendedorInput', { static: false })
  autoVendedorInput: ElementRef;
  @ViewChild('autoProveedorInput', {
    static: false,
    read: MatAutocompleteTrigger,
  })
  matProveedorTrigger: MatAutocompleteTrigger;
  @ViewChild('autoProveedorInput', { static: false })
  autoProveedorInput: ElementRef;
  @ViewChild('autoMonedaInput', { static: false, read: MatAutocompleteTrigger })
  matMonedaTrigger: MatAutocompleteTrigger;
  @ViewChild('autoMonedaInput', { static: false }) autoMonedaInput: ElementRef;

  pedido = new Pedido();
  timer: any;
  formGroup: FormGroup;
  vendedores: Vendedor[] = [];
  proveedores: Proveedor[] = [];
  monedas: Moneda[];
  selectedVendedor: Vendedor;
  forma: FormaPago;
  selectedProducto: Producto;
  selectedMoneda: Moneda;
  productosDelProveedor: Producto[] = [];
  pedidoItemList: PedidoItem[] = [];
  pedidoItemDataSource = new MatTableDataSource<PedidoItem>();
  displayedColumns = ['id', 'producto'];
  autoGuardar = false;
  isEditable = false;
  displayedColumnsUltimaCompras = [
    'proveedorNombre',
    'precio',
    'cantidad',
    'fecha',
  ];
  displayedColumnsPedido = [
    'select',
    'productoDescripcion',
    'cantidad',
    'precioUnitario',
    'descuentoUnitario',
    'bonificacion',
    'estado',
  ];
  productos: Producto[];
  ultimasComprasProducto: [ExistenciaCostoPorSucursal];
  checked = true;
  innerWidth;
  base64Image;
  sinImagen;
  isRowSelected = false;
  expandedPedidoItem: PedidoItem | null;
  initialSelection = [];
  allowMultiSelect = true;
  selection = new SelectionModel<PedidoItem>(
    this.allowMultiSelect,
    this.initialSelection
  );

  formaPagoOptions: Record<string, string>[] = [
    {
      titulo: 'Efectivo',
      valor: FormaPago.EFECTIVO,
    },
    {
      titulo: 'Cheque',
      valor: FormaPago.CHEQUE,
    },
    {
      titulo: 'Crédito',
      valor: FormaPago.CREDITO,
    },
    {
      titulo: 'Transferencia',
      valor: FormaPago.TRANSFERENCIA,
    },
  ];

  formaDePagoDefault = this.formaPagoOptions[0];

  constructor(
    private vendedorSearchByPersona: VendedoresSearchByPersonaGQL,
    private vendedorById: VendedorByIdGQL,
    private proveedorById: ProveedorByIdGQL,
    private proveedorSearchByPersona: ProveedoresSearchByPersonaGQL,
    private monedaSearch: MonedasSearchGQL,
    private dialog: MatDialog,
    private dialogService: DialogosService,
    private tabService: TabService,
    private windowInfoService: WindowInfoService,
    private domSanitizer: DomSanitizer,
    private getProductoInfoCompleta: ProductoInfoCompletaByIdGQL,
    private notificationSnackBar: NotificacionSnackbarService,
    public mainService: MainService,
    private pedidoService: PedidoService,
    private pedidoItemService: PedidoItemService,
    private apollo : Apollo
  ) {
  }

  ngOnInit(): void {
    this.innerWidth = `${
      this.windowInfoService.innerWidth -
      this.windowInfoService.innerWidth * 0.05
    }px`;
    this.createForm();
    this.monedaSearch
      .fetch({
        texto: '',
      })
      .subscribe((data) => {
        if (data.errors) {
        } else {
          this.monedas = data.data.monedas;
          if (this.monedas.length > 0) {
            this.selectedMoneda = this.monedas?.find((e) => e.id == 1);
            this.formGroup.get('moneda').setValue(this.selectedMoneda.id);
          }
        }
      });
    setTimeout(() => {
      this.autoVendedorInput.nativeElement.focus();
    }, 100);
    if(this.data.tabData!=null){
      this.isEditable = false;
      this.formGroup.disable()
      this.cargarDatosDelPedido();
    } else {
      this.isEditable = true;
      this.activarAutoguardadoDialog();
    }
    
  }

  createForm(): void {
    this.formGroup = new FormGroup({
      vendedor: new FormControl(null),
      proveedor: new FormControl(null, Validators.required),
      fecha: new FormControl(null),
      fechaDeEntrega: new FormControl(null),
      formaPago: new FormControl(null, Validators.required),
      estado: new FormControl(null),
      moneda: new FormControl(null, Validators.required),
      diasCheque: new FormControl(null),
      descuento: new FormControl(null),
      pedidoItens: new FormControl(null, Validators.required),
      valorTotal: new FormControl(null),
      usuario: new FormControl(null),
      producto: new FormControl(null),
      isSoloProductosProveedor: new FormControl(null),
    });

    this.formGroup.get('isSoloProductosProveedor').setValue(false);
    this.formGroup.get('formaPago').setValue(this.formaDePagoDefault.valor)
  }

  activarAutoguardadoDialog(){
    this.dialogService.confirm('Desea activar la función de autoguardar?','Activando la función de autoguardar, cada paso que realices será guardado', null, null, true).subscribe((res)=>{
      if(res){
        this.autoGuardar = true;
        // this.notificationSnackBar.showNotification('Autoguardado activado', null, 3)
        this.activarAutoguardado()
      } else {
        // this.notificationSnackBar.showNotification('Autoguardado desactivado', null, 3)
      }
      this.autoVendedorInput.nativeElement.focus()
    })
  }

  onVendedorSearch(vendedor?: Vendedor): void {
    if (this.timer != null) {
      clearTimeout(this.timer);
    }
    this.formGroup.get('proveedor').reset();
    this.formGroup.get('isSoloProductosProveedor').setValue(false);
    this.productosDelProveedor = [];
    this.productos = [];
    if (vendedor != undefined) {
      this.vendedorById
        .fetch(
          {
            id: vendedor.id,
          },
          {
            fetchPolicy: 'no-cache',
          }
        )
        .subscribe((data) => {
          const vendedor: Vendedor = data.data.vendedor;
          this.selectedVendedor = vendedor;
          this.vendedores.push(vendedor);
          this.formGroup.get('vendedor').setValue(vendedor.id);
        });
    } else {
      if (
        this.formGroup.get('vendedor').value != null ||
        this.formGroup.get('vendedor').value != ''
      ) {
        this.vendedorSearchByPersona
          .fetch(
            {
              texto: this.formGroup.get('vendedor').value,
            },
            {
              fetchPolicy: 'no-cache',
            }
          )
          .subscribe((data) => {
            this.vendedores = data.data.vendedores;
            if (this.vendedores.length == 1) {
              this.timer = setTimeout(() => {
                this.openCargandoDialog();
                this.formGroup.get('vendedor').setValue(this.vendedores[0]?.id);
                this.addProveedores(this.vendedores[0].proveedores);
                this.autoVendedorInput.nativeElement.select();
                this.matVendedorTrigger.closePanel();
                this.formGroup.get('isSoloProductosProveedor').setValue(true);
              }, 1000);
            }
          });
      }
    }
  }

  displayVendedor(value?: number) {
    let res = value ? this.vendedores.find((_) => _.id === value) : undefined;
    this.selectedVendedor = res;
    return res ? res.id + ' - ' + res.persona.nombre : undefined;
  }

  onProveedorSearch(proveedor?: Proveedor): void {
    if (this.selectedVendedor == undefined) {
      if (proveedor != undefined) {
        this.proveedorById
          .fetch(
            {
              id: proveedor.id,
            },
            {
              fetchPolicy: 'no-cache',
            }
          )
          .subscribe((data) => {
            const proveedor: Proveedor = data.data.proveedor;
            this.proveedores.push(proveedor);
            this.formGroup.get('proveedor').setValue(proveedor.id);
          });
      } else {
        if (
          this.formGroup.get('proveedor').value != null ||
          this.formGroup.get('proveedor').value != ''
        ) {
          this.proveedorSearchByPersona
            .fetch(
              {
                texto: this.formGroup.get('proveedor').value,
              },
              {
                fetchPolicy: 'no-cache',
              }
            )
            .subscribe((data) => {
              if (this.proveedores.length == 1) {
                this.timer = setTimeout(() => {
                  this.openCargandoDialog();
                  this.formGroup.get('proveedor').setValue(this.proveedores[0]?.id);
                  this.addVendedores(this.proveedores[0].vendedores);
                  this.autoProveedorInput.nativeElement.select();
                  this.matProveedorTrigger.closePanel();
                }, 1000);
              }            });
        }
      }
    }
  }

  displayProveedor(value?: number) {
    let res = value ? this.proveedores.find((_) => _.id === value) : undefined;
    res?.productos ? this.addProductosProveedor(res.productos) : null;
    return res ? res.id + ' - ' + res.persona.nombre : undefined;
  }

  onMonedaSearch(): void {
    this.monedaSearch
      .fetch(
        {
          texto: this.formGroup.get('moneda').value,
        },
        {
          fetchPolicy: 'no-cache',
        }
      )
      .subscribe((data) => {
        if (data.errors) {
        } else {
          this.monedas = data.data.monedas;
          if (this.monedas.length == 1) {
            setTimeout(() => {
              this.formGroup.get('moneda').setValue(this.monedas[0].id);
              this.autoMonedaInput.nativeElement.select();
              this.matMonedaTrigger.closePanel();
            }, 1000);
          }
        }
      });
  }

  displayMoneda(value?: number) {
    let res = value ? this.monedas?.find((_) => _.id === value) : undefined;
    this.selectedMoneda = res;
    return res ? res.id + ' - ' + res.denominacion : undefined;
  }

  onProveedorAutoClosed() {
    this.autoProveedorInput.nativeElement.select();
  }

  onVendedorAutoClosed() {
    this.autoVendedorInput.nativeElement.select();
  }

  onMonedaAutoClosed() {
    this.autoMonedaInput.nativeElement.select();
  }

  onSubmit() {
    this.onSave('concluido');
  }

  resetForm() {}

  onFormaDePagoSelect(e: MatOptionSelectionChange) {}

  openDialog(e: Event): void {
    let isProveedor = this.formGroup.get('isSoloProductosProveedor').value;
    const dialogRef = this.dialog.open(SearchProductoDialogComponent, {
      data: {
        texto: (e.target as HTMLInputElement).value,
        query:
          this.formGroup.get('isSoloProductosProveedor').value &&
          this.formGroup.get('proveedor').value
            ? productoExistenciaCostoPorProveedor
            : productosExistenciaCostoSearch,
        proveedorId:
          this.formGroup.get('isSoloProductosProveedor').value &&
          this.formGroup.get('proveedor').value
            ? this.proveedores[0]?.id
            : null,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.seleccionarProducto(result);
      setTimeout(() => {
        if (this.selectedProducto != null) {
          this.openPedidoItemDialog(this.selectedProducto, this.selectedMoneda);
        }
      }, 100);
    });
  }

  openDialogAddProductoConfirm(producto: Producto) {
    this.seleccionarProducto(producto)
    this.selectedProducto
      ? this.dialogService
          .confirm(
            'Desea adicionar este producto?',
            `DESCRIPCION: ${this.selectedProducto.descripcion}`, null, null, true
          )
          .subscribe((res) => {
            res
              ? this.openPedidoItemDialog(
                  this.selectedProducto,
                  this.selectedMoneda
                )
              : null;
          })
      : null;
  }

  seleccionarProducto(producto: Producto) {
      setTimeout(() => {
      this.cargarImagen(producto);
      this.selectedProducto = producto;
      producto ? this.ultimasComprasProducto = producto?.productoUltimasCompras: null;
      }, );
    // this.base64Image = this.domSanitizer.bypassSecurityTrustResourceUrl(`data:image/png;base64 , ${producto.imagenPrincipal}`);
  }

  cargarImagen(producto) {
    this.sinImagen = producto?.imagenPrincipal ? false : true;
    this.base64Image = this.domSanitizer.bypassSecurityTrustResourceUrl(
      `data:image/png;base64 , ${producto.imagenPrincipal}`
    );
  }

  onKeydownEvent(e) {
    if (e == 'Enter' || e == 'Tab') {
      if (this.vendedores.length == 0) {
        this.dialogService
          .confirm(
            'Desea crear un nuevo vendedor?',
            `NOMBRE: ${this.formGroup.get('vendedor').value.toUpperCase()}`, null,null,true
          )
          .subscribe((res) => {});
      }
    }
  }

  onCheckEnterEvent() {
    let value = this.formGroup.get('isSoloProductosProveedor').value;
    this.formGroup.get('isSoloProductosProveedor').setValue(!value);
  }

  addProveedores(proveedores: Proveedor[]) {
    this.proveedores = proveedores;
    if (this.proveedores?.length == 1) {
      setTimeout(() => {
        this.formGroup.get('proveedor').setValue(this.proveedores[0]?.id);
        this.autoProveedorInput.nativeElement.select();
        this.matProveedorTrigger.closePanel();
        this.addProductosProveedor(this.proveedores[0]?.productos);
        this.closeCargandoDialog();
      }, 1000);
    } else {
      this.closeCargandoDialog();
    }
  }

  addVendedores(vendedores: Vendedor[]) {
    this.vendedores = vendedores;
    if (this.vendedores?.length == 1) {
      setTimeout(() => {
        this.formGroup.get('vendedor').setValue(this.vendedores[0].id);
        this.autoProveedorInput.nativeElement.select();
        this.matVendedorTrigger.closePanel();
        this.closeCargandoDialog();
      }, 1000);
    } else {
      this.closeCargandoDialog();
    }
  }

  addProductosProveedor(productos: Producto[]) {
    this.productosDelProveedor = productos;
  }

  openPedidoItemDialog(producto: Producto, moneda: Moneda) {
    let dialogRef;
    let pedidoItem = new PedidoItem();
    let ref = this.dialog.open(CargandoDialogComponent);
    this.getProductoInfoCompleta
      .fetch({
        id: producto.id,
      })
      .subscribe((data) => {
        if (!data.errors) {
          this.selectedProducto = data.data.data;
          pedidoItem.producto = this.selectedProducto;
          ref.close();
          dialogRef = this.dialog.open(PedidoItensDialogComponent, {
            data: { pedidoItem, moneda },
            disableClose: true,
          });
          dialogRef.afterClosed().subscribe((proItem) => {
            if(proItem!=null){
              this.seleccionarProducto(proItem.producto)
              this.updatePedidoItemList(proItem, 'add');
            }
            this.selection.clear();
          });
        }
      });
  }

  updatePedidoItemList(pedidoItem: PedidoItem, action){
    switch (action) {
      case 'add':
        this.pedidoItemList.push(pedidoItem);
        this.formGroup.get('vendedor').disable();
        this.formGroup.get('proveedor').disable();
        // this.notificationSnackBar.showNotification('Adicionado con éxito!!', null, 3)
        this.selection.clear()
        break;
      case 'delete':
        let index = this.pedidoItemList.findIndex((pi)=> pi === pedidoItem);
        if(index>-1){
          this.pedidoItemList.splice(index, 1);
          if(this.pedidoItemList.length==0){
            this.formGroup.get('vendedor').enable();
             this.formGroup.get('proveedor').enable();
          }
          // this.notificationSnackBar.showNotification('Eliminado con éxito!!', null, 3)
          this.selection.clear()
        }
        break;
      default:
        break;
    }
    this.pedidoItemDataSource.data = this.pedidoItemList;
    this.formGroup.get('pedidoItens').setValue(this.pedidoItemList)
  }

  editPedidoItem(){
    let pedidoItem = this.selection.selected[0];
    let ref = this.dialog.open(PedidoItensDialogComponent, {
      data: {producto: pedidoItem.producto, moneda: this.selectedMoneda, pedidoItem},
      disableClose: true
    });
    ref.afterClosed().subscribe((proItem: PedidoItem) => {
      this.seleccionarProducto(proItem.producto)
      let index = this.pedidoItemList.findIndex((pi)=> pi.producto.id == proItem.producto.id);
      if(index>-1){
        this.pedidoItemList[index]=proItem;
        this.pedidoItemDataSource.data = this.pedidoItemList;
      }
      this.selection.clear();
      this.selection.select()
    });

  }

  openCargandoDialog() {
    const dialogRef = this.dialog.open(CargandoDialogComponent);
  }

  closeCargandoDialog() {
    const dialogRef = this.dialog.closeAll();
  }

  onUltimaCompraEvent(puc: ProductoUltimasCompra) {
    this.dialogService
      .confirm(
        'Desea ir al pedido?',
        `Ir al pedido ${puc.pedido.id}`,
        'Abriremos una ventana nueva', null, true
      )
      .subscribe((res) => {
        if (res) {
          this.tabService.addTab(
            new Tab(
              ListPedidoComponent,
              `Pedido ${puc.pedido.id}`,
              null,
              EditPedidoComponent
            )
          );
        }
      });
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    if(numSelected==1){
      this.seleccionarProducto(this.selection.selected[0].producto);
    }
    const numRows = this.pedidoItemDataSource.data.length;
    return numSelected == numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if(this.isAllSelected()) {
      this.selection.clear(); 
    } else {
      this.pedidoItemDataSource.data.forEach((row) =>
      this.selection.select(row)
    );
    }
      
  }

  deletePedidoItem(selectedPedidoItens: PedidoItem[]){
    let angular: any;
    if(selectedPedidoItens.length==1){
      let pedidoItem = selectedPedidoItens[0];
      this.dialogService.confirm('Desea eliminar este item?', selectedPedidoItens[0].producto.descripcion, null, null, true).subscribe((res)=>{
        if(res){
          this.updatePedidoItemList(pedidoItem, 'delete');
        }
      })
    } else {
      let itens = []
      selectedPedidoItens.forEach((i)=>{
        itens.push(i.producto.descripcion);
      })
      this.dialogService.confirm('Desea eliminar estos itens?',null, null, itens, true).subscribe((res)=>{
        if(res){
          selectedPedidoItens.forEach((i)=>{
            this.updatePedidoItemList(i, 'delete');
          })
        }
      })
    }
  }

  activarAutoguardado(){
    this.formGroup.statusChanges.subscribe((data)=>{
      if(data == 'VALID'){
        this.onSave('autoguardado');
      }
    });
  }

  cargarDatosDelPedido(){
    this.pedido = this.data.tabData.data;
    let proList = []
    proList.push(this.pedido.proveedor)
    let venList = []
    venList.push(this.pedido.vendedor)
    this.addVendedores(venList)
    this.addProveedores(proList);
    let formaPagoIndex = this.formaPagoOptions.findIndex((fp) => {
      return fp.valor === this.pedido.formaPago.toString()
    });
    this.formaDePagoDefault = this.formaPagoOptions[formaPagoIndex]
    this.formGroup.get('formaPago').setValue(this.formaDePagoDefault.valor)
    this.formGroup.get('isSoloProductosProveedor').setValue(true)
    this.formGroup.get('moneda').setValue(this.pedido?.moneda.id);
    this.formGroup.get('fechaDeEntrega').setValue(this.pedido?.fechaDeEntrega)
    this.formGroup.get('diasCheque').setValue(this.pedido?.diasCheque)
    this.productosDelProveedor = this.pedido?.proveedor.productos;
    this.pedidoItemList = this.pedido?.pedidoItens;
    this.pedidoItemDataSource.data = this.pedidoItemList;
  }

  onSave(tipo){
    let ref = this.dialog.open(CargandoDialogComponent)
    let pedidoForm : PedidoFormModel = this.formGroup.value;
    switch (tipo) {
      case 'autoguardado':
        pedidoForm.estado = PedidoEstado.ABIERTO
        break;
      case 'concluido':
        pedidoForm.estado = PedidoEstado.ACTIVO
        break;
      default:
        break;
    }
    let pedidoInput = new PedidoInput();
    if(this.pedido!=null){
      pedidoInput.id = this.pedido.id;
    } else {
      pedidoInput.id = null;
    }
    pedidoInput.vendedorId = +(this.formGroup.get('vendedor').value);
    pedidoInput.proveedorId = +(this.formGroup.get('proveedor').value);
    pedidoInput.monedaId = +pedidoForm.moneda;
    pedidoInput.descuento = pedidoForm.descuento;
    pedidoInput.estado = pedidoForm.estado;
    pedidoInput.formaPago = pedidoForm.formaPago;
    pedidoInput.fechaDeEntrega = pedidoForm.fechaDeEntrega;
    this.apollo.mutate({
      mutation: savePedido,
      variables: {
        entity: pedidoInput
      }
    }).subscribe((res: any)=>{
      if(!res.errors){
          this.pedido.id = +res.data.data.id;
          this.pedidoItemList.forEach((pi)=>{
          let pedidoItemInput = new PedidoItemInput;
          pedidoItemInput.id = pi.id;
          pedidoItemInput.pedidoId = +res.data.data.id;
          pedidoItemInput.precioUnitario = pi.precioUnitario;
          pedidoItemInput.cantidad = pi.cantidad;
          pedidoItemInput.descuentoUnitario = pi.descuentoUnitario;
          pedidoItemInput.estado = pi.estado;
          pedidoItemInput.productoId = +pi.producto.id;
          pedidoItemInput.vencimiento = pi.vencimiento;
          pedidoItemInput.observacion = pi.observacion;
          pedidoItemInput.bonificacion = pi.bonificacion;
          pedidoItemInput.bonificacionDetalle = pi.bonificacionDetalle;
          pedidoItemInput.usuarioId = environment.usuario;  
          this.apollo.mutate({
            mutation: savePedidoItem,
            variables: {
              entity: pedidoItemInput
            }
          }).subscribe((res: any)=>{
            if(!res.erros){
              pi.id = +res.data.data.id;
              pi.pedidoItemSucursales.forEach((pis)=>{
                let pedidoItemSucursalInput = new PedidoItemSucursalInput();
                pedidoItemSucursalInput.id = pis.id;
                pedidoItemSucursalInput.cantidad = pis.cantidad;
                pedidoItemSucursalInput.pedidoItemId = +res.data.data.id;
                pedidoItemSucursalInput.sucursalId = +pis.sucursal.id;
                pedidoItemSucursalInput.sucursalEntregaId = +pis.sucursalEntrega.id;
                pedidoItemSucursalInput.usuarioId = environment.usuario;
                this.apollo.mutate({
                  mutation: savePedidoItemSucursal,
                  variables: {
                    entity: pedidoItemSucursalInput
                  }
                }).subscribe((res: any)=>{
                  if(!res.erros){
                    pis.id = +res.data.data.id;
                    // this.notificationSnackBar.showNotification('Guardado con éxito');
                  } else {
                    // this.notificationSnackBar.showNotification('Ocurrió un error al guardar algún item de sucursal');
                  }
                })
              })
            } else {
              // this.notificationSnackBar.showNotification('Ocurrió un error al guardar algún item del pedido')
            }
            ref.close()
          })
        });
      } else {
        // this.notificationSnackBar.showNotification('Ocurrió un error al guardar el pedido')
      }
    })
  }
}
