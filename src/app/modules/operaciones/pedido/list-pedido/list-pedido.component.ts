import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { CustomValidatorsService } from '../../../../commons/core/utils/custom-validators.service';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabData, TabService } from '../../../../layouts/tab/tab.service';
import { SucursalesGQL } from '../../../../modules/empresarial/sucursal/graphql/sucursalesQuery';
import { Sucursal } from '../../../../modules/empresarial/sucursal/sucursal.model';
import { ProveedorByIdGQL } from '../../../../modules/personas/proveedor/graphql/proveedorById';
import { ProveedoresSearchByPersonaGQL } from '../../../../modules/personas/proveedor/graphql/proveedorSearchByPersona';
import { Proveedor } from '../../../../modules/personas/proveedor/proveedor.model';
import { VendedorByIdGQL } from '../../../../modules/personas/vendedor/graphql/vendedorById';
import {
  Vendedor,
  VendedoresSearchByPersonaGQL,
} from '../../../../modules/personas/vendedor/graphql/vendedorSearchByPersona';
import { productoExistenciaCostoPorProveedor, productosExistenciaCostoSearch } from '../../../../modules/productos/producto/graphql/graphql-query';
import { Producto } from '../../../../modules/productos/producto/producto.model';
import { SearchProductoDialogComponent } from '../../../../modules/productos/producto/search-producto-dialog/search-producto-dialog.component';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { CargandoDialogComponent } from '../../../../shared/components/cargando-dialog/cargando-dialog.component';
import { DialogosComponent } from '../../../../shared/components/dialogos/dialogos.component';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { EditPedidoComponent } from '../edit-pedido/edit-pedido.component';
import { PedidoEstado, PedidoItemEstado } from '../edit-pedido/pedido-enums';
import { Pedido } from '../edit-pedido/pedido.model';
import { FilterPedidosGQL } from '../graphql/filterPedidos';
import { filterPedidosQuery } from '../graphql/graphql-query';
import { PedidoItensPorPedidoIdGQL } from '../pedido-itens/graphql/pedidoItensPorPedidoId';
import { PedidoService } from '../pedido.service';

@Component({
  selector: 'app-list-pedido',
  templateUrl: './list-pedido.component.html',
  styleUrls: ['./list-pedido.component.css'],
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
export class ListPedidoComponent implements OnInit {
  expandedPedido: Pedido | null;
  @ViewChild('mostrarTodosCheckbox', { static: true }) matCheckBox: MatCheckbox;
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

  @ViewChild('inputProducto', { static: false })
  inputProducto: ElementRef;

  formGroup: FormGroup;
  selectedVendedor: Vendedor;
  sucursales: Sucursal[] = [];
  sucursalInicialValue = -1;
  estadoInicialValue;
  proveedores: Proveedor[];
  vendedores: Vendedor[];
  productos: Producto[];
  timer: any;
  productosDelProveedor: Producto[] = [];
  pedidos: Pedido[];
  dataSourcePedido = new MatTableDataSource<Pedido>();
  rowColor = '';
  fontColor = '';
  isTableCargando = false;
  selectedProducto: Producto;

  displayedColumnsPedidos: any[] = [
    'cod',
    'proveedor',
    'estado',
    'fecha',
    'formaPago',
    'moneda',
    'valorTotal',
    'vendedor',
    'menu',
  ];

  estadosOptions: Record<string, string>[] = [
    {
      titulo: 'Activo',
      valor: PedidoEstado.ACTIVO,
    },
    {
      titulo: 'Abierto',
      valor: PedidoEstado.ABIERTO,
    },
    {
      titulo: 'Concluido',
      valor: PedidoEstado.CONCLUIDO,
    },
    {
      titulo: 'En verificación',
      valor: PedidoEstado.EN_VERIFICACION,
    },
    {
      titulo: 'Esperando Autorización',
      valor: PedidoEstado.EN_VERIFICACION_SOLICITUD_AUTORIZACION,
    },
    {
      titulo: 'Cancelado',
      valor: PedidoEstado.CANCELADO,
    },
  ];

  constructor(
    public service: PedidoService,
    private filterPedidos: FilterPedidosGQL,
    private getSucursales: SucursalesGQL,
    private getProveedores: ProveedoresSearchByPersonaGQL,
    private getVendedores: VendedoresSearchByPersonaGQL,
    private vendedorById: VendedorByIdGQL,
    private proveedorById: ProveedorByIdGQL,
    private dialog: MatDialog,
    private notificacionSnackBar: NotificacionSnackbarService,
    private customValidatorsService: CustomValidatorsService,
    private getPedidoItensProPedido: PedidoItensPorPedidoIdGQL,
    private tabService: TabService,
    private dialogConfirm: DialogosService
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.setSucursal('-1');
    this.estadoInicialValue = this.estadosOptions[0].valor;
    this.setEstado(this.estadosOptions[0].valor);
    this.getSucursales.fetch().subscribe((data) => {
      this.sucursales = !data.errors ? data.data.data : null;
    });
    this.formGroup.valueChanges.subscribe((data) => {
      this.buscarPedidos();
    });

    this.formGroup.get('inicio').valueChanges.subscribe((res) => {
      this.onDateRangeSearch();
    });
    this.formGroup.get('fin').valueChanges.subscribe((res) => {
      this.onDateRangeSearch();
    });
    this.formGroup.get('vendedor').valueChanges.subscribe((res) => {
      this.onVendedorSearch();
      if (res == ' ') {
        this.setVendedor(null);
        this.autoVendedorInput.nativeElement.focus();
      }
    });
    this.formGroup.get('proveedor').valueChanges.subscribe((res) => {
      this.onProveedorSearch();
      if (res == ' ') {
        this.setProveedor(null);
        this.autoProveedorInput.nativeElement.focus();
      }
    });
    this.buscarPedidos();
  }

  onVendedorSearch(): void {
    if (this.timer != null) {
      clearTimeout(this.timer);
    }
    this.productosDelProveedor = [];
    this.productos = [];
    if (
      this.formGroup.get('vendedor').value != null ||
      this.formGroup.get('vendedor').value != ''
    ) {
      this.getVendedores
        .fetch(
          {
            texto: this.getVendedor(),
          },
          {
            fetchPolicy: 'no-cache',
          }
        )
        .subscribe((data) => {
          this.formGroup.get('proveedor').reset();
          this.vendedores = data.data.vendedores;
          if (this.vendedores.length == 1) {
            this.timer = setTimeout(() => {
              this.openCargandoDialog();
              this.formGroup.get('vendedor').setValue(this.vendedores[0]?.id);
              this.addProveedores(this.vendedores[0].proveedores);
              this.autoVendedorInput.nativeElement.select();
              this.matVendedorTrigger.closePanel();
            }, 1000);
          }
        });
    }
  }

  displayVendedor(value?: number) {
    let res = value ? this.vendedores.find((_) => _.id === value) : undefined;
    res?.proveedores ? this.addProveedores(res.proveedores): null;
    this.selectedVendedor = res;
    return res ? res.id + ' - ' + res.nombrePersona : undefined;
  }

  onProveedorSearch(): void {
    if (this.timer != null) {
      clearTimeout(this.timer);
    }
    if (
      this.formGroup.get('proveedor').value != null ||
      this.formGroup.get('proveedor').value != ''
    ) {
      this.getProveedores
        .fetch(
          {
            texto: this.getProveedor(),
          },
          {
            fetchPolicy: 'no-cache',
          }
        )
        .subscribe((data) => {
          this.addProveedores(data.data.data);
          if (this.proveedores.length == 1) {
            this.timer = setTimeout(() => {
              this.openCargandoDialog();
              this.formGroup.get('proveedor').setValue(this.vendedores[0]?.id);
              this.autoProveedorInput.nativeElement.select();
              this.matProveedorTrigger.closePanel();
            }, 1000);
          }
        });
    }
  }

  displayProveedor(value?: number) {
    let res = value ? this.proveedores.find((_) => _.id === value) : undefined;
    res?.productos ? this.addProductosProveedor(res.productos) : null;
    res?.vendedores ? this.addVendedores(this.proveedores[0].vendedores): null;

    return res ? res.id + ' - ' + res.persona.nombre : undefined;
  }

  addProveedores(proveedores: Proveedor[]) {
    this.proveedores = proveedores;
    if (this.proveedores?.length == 1) {
      setTimeout(() => {
        this.formGroup.get('proveedor').setValue(this.proveedores[0].id);
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
        this.autoVendedorInput.nativeElement.select();
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

  createForm() {
    this.formGroup = new FormGroup({
      allPedidos: new FormControl(null),
      allSucursales: new FormControl(null),
      sucursal: new FormControl(null),
      estado: new FormControl(null),
      rango: new FormControl(null),
      inicio: new FormControl(null),
      fin: new FormControl(null),
      vendedor: new FormControl(null),
      proveedor: new FormControl(null),
      producto: new FormControl(null),
    });
  }

  openCargandoDialog() {
    const dialogRef = this.dialog.open(CargandoDialogComponent);
  }

  closeCargandoDialog() {
    const dialogRef = this.dialog.closeAll();
  }

  onProveedorAutoClosed() {
    this.autoProveedorInput.nativeElement.select();
  }

  onVendedorAutoClosed() {
    this.autoVendedorInput.nativeElement.select();
  }

  onDateRangeSearch() {}

  buscarPedidos() {
    if (this.formGroup.valid) {
      this.isTableCargando = true;
      this.filterPedidos
        .fetch({
          estado: this.getEstado() != -1 ? this.getEstado() : null,
          sucursalId: this.getSucursal() != -1 ? this.getSucursal() : null,
          inicio: this.getFechaInicio(),
          fin: this.getFechaFin(),
          vendedorId:
            !isNaN(this.getVendedor()) &&
            this.getVendedor() != '' &&
            this.getVendedor() != ' '
              ? this.getVendedor()
              : null,
          proveedorId:
            !isNaN(this.getProveedor()) &&
            this.getProveedor() != '' &&
            this.getProveedor() != ' '
              ? this.getProveedor()
              : null,
          productoId: this.getProducto()!=null ? this.getProducto().id : null,
        })
        .subscribe((data) => {
          if (!data.errors) {
            this.dataSourcePedido.data = data.data.data;
          } else {
            // this.notificacionSnackBar.showNotification(
            //   'O loco bixooo. Ocurrio algun error'
            // );
          }
        });
      this.isTableCargando = false;
    }
  }

  openDialog(text: String): void {
    let isProveedor = this.getProveedor()!=null;
    const dialogRef = this.dialog.open(SearchProductoDialogComponent, {
      data: {
        texto: this.getProducto(),
        query:
          isProveedor 
            ? productoExistenciaCostoPorProveedor
            : productosExistenciaCostoSearch,
        id:
          isProveedor
            ? this.proveedores[0]?.id
            : null,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.selectedProducto = result;
      this.setProducto(this.selectedProducto);
      setTimeout(() => {
        this.inputProducto.nativeElement?.select()
      }, 100);
      
    });
  }

  onEditClick(pedido: Pedido){
    if(pedido!=null && pedido.estado != PedidoEstado.CONCLUIDO){
      let strArr = [`CÓDIGO: ${pedido.id}`, `PROVEEDOR: ${pedido.proveedor?.persona.nombre}`]
      this.dialogConfirm.confirm('Desea abrir este pedido?', null, null, strArr, true).subscribe((res)=>{
        if(res){
          this.tabService.addTab(new Tab(EditPedidoComponent, `Pedido ${pedido.id}`, new TabData(pedido.id, pedido), ListPedidoComponent))
        }
      })
    } else {
      // this.notificacionSnackBar.showNotification('Éste pedido no se puede editar')
    }
  }

  getFontColor(estado: PedidoEstado): string {
    switch (estado) {
      case PedidoEstado.ACTIVO:
        return 'white';
        break;
      case PedidoEstado.ABIERTO:
        return 'black';
        break;
      case PedidoEstado.CANCELADO:
        return 'white';
      case PedidoEstado.CONCLUIDO:
        return 'black';
        break;
      case PedidoEstado.EN_VERIFICACION:
        return 'white';
        break;
      default:
        return '';
        break;
    }
  }
  getBackColor(estado: PedidoEstado): string {
    switch (estado) {
      case PedidoEstado.ACTIVO:
        return '#27AE60';
        break;
      case PedidoEstado.ABIERTO:
        return '#F4D03F';
        break;
      case PedidoEstado.CANCELADO:
        return '#E74C3C';
        break;
      case PedidoEstado.CONCLUIDO:
        return '#D7DBDD';
        break;
      case PedidoEstado.EN_VERIFICACION:
        return '#3498DB';
        break;
      default:
        return '';
        break;
    }
  }

  onSelectPedido(id: number) {
    if (id != null) {
      this.getPedidoItensProPedido
        .fetch({
          id,
        })
        .subscribe((data) => {
          if (!data.errors) {
            let index: number = this.dataSourcePedido.data.findIndex(
              (p) => (p.id = id)
            );
            if (index != null) {
              this.pedidos = this.dataSourcePedido.data;
              this.pedidos[index].pedidoItens = data.data.data;
              this.dataSourcePedido.data = this.pedidos;
            }
          }
        });
    }
  }

  onNewPedido(){
    this.tabService.addTab(new Tab(EditPedidoComponent, 'Nuevo Pedido', null, ListPedidoComponent));
  }

  getAllPedidos(): any {
    return this.formGroup.get('allPedidos').value;
  }
  getAllSucursales(): any {
    return this.formGroup.get('allSucursales').value;
  }
  getSucursal(): any {
    return this.formGroup.get('sucursal').value;
  }
  getEstado(): any {
    return this.formGroup.get('estado').value;
  }
  getFechaInicio(): any {
    return this.formGroup.get('inicio').value;
  }
  getFechaFin(): any {
    return this.formGroup.get('fin').value;
  }
  getProveedor(): any {
    return this.formGroup.get('proveedor').value;
  }
  getVendedor(): any {
    return this.formGroup.get('vendedor').value;
  }
  getProducto(): any {
    return this.formGroup.get('producto').value;
  }
  setAllPedidos(value): any {
    return this.formGroup.get('allPedidos').setValue(value);
  }
  setAllSucursales(value): any {
    return this.formGroup.get('allSucursales').setValue(value);
  }
  setSucursal(value): any {
    return this.formGroup.get('sucursal').setValue(value);
  }
  setEstado(value): any {
    return this.formGroup.get('estado').setValue(value);
  }
  setFechaInicio(value): any {
    return this.formGroup.get('inicio').setValue(value);
  }
  setFechaFin(value): any {
    return this.formGroup.get('fin').setValue(value);
  }
  setProveedor(value): any {
    return this.formGroup.get('proveedor').setValue(value);
  }
  setVendedor(value): any {
    return this.formGroup.get('vendedor').setValue(value);
  }
  setProveedorId(value): any {
    return this.formGroup.get('proveedorId').setValue(value);
  }
  setVendedorId(value): any {
    return this.formGroup.get('vendedorId').setValue(value);
  }
  setProducto(value): any {
    return this.formGroup.get('producto').setValue(value);
  }
}
