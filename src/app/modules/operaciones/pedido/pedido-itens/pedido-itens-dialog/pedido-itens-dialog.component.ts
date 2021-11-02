import { SelectionModel } from '@angular/cdk/collections';
import { CurrencyPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { CurrencyMask } from '../../../../../commons/core/utils/numbersUtils';
import { Moneda } from '../../../../../modules/financiero/moneda/moneda.model';
import { SucursalesGQL } from '../../../../../modules/empresarial/sucursal/graphql/sucursalesQuery';
import { Sucursal } from '../../../../../modules/empresarial/sucursal/sucursal.model';
import { ProductoInfoCompletaByIdGQL } from '../../../../../modules/productos/producto/graphql/productoInfoCompletaPorId';
import {
  ExistenciaCostoPorSucursal,
  Producto,
} from '../../../../../modules/productos/producto/producto.model';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { CargandoDialogComponent } from '../../../../../shared/components/cargando-dialog/cargando-dialog.component';
import { DialogosService } from '../../../../../shared/components/dialogos/dialogos.service';

import { WindowInfoService } from '../../../../../shared/services/window-info.service';
import { PedidoItemEstado } from '../../edit-pedido/pedido-enums';
import { PedidoItem } from '../../edit-pedido/pedido-item.model';
import { PedidoItemSucursal } from '../pedido-item-sucursal/pedido-item-sucursal.model';

export interface PedidoItemDialogData {
  moneda: Moneda;
  pedidoItem: PedidoItem;
}

@Component({
  selector: 'app-pedido-itens-dialog',
  templateUrl: './pedido-itens-dialog.component.html',
  styleUrls: ['./pedido-itens-dialog.component.scss'],
  providers: [CurrencyPipe]
})
export class PedidoItensDialogComponent implements OnInit, AfterViewInit {

  @ViewChild('valorPorCaja', { static: false })
  valorPorCajaInput: ElementRef;

  @ViewChild('descuentoPorUnidad', { static: false })
  descuentoPorUnidadInput: ElementRef;

  @ViewChild('valorPorUnidad', { static: false })
  valorPorUnidadInput: ElementRef;

  formGroup: FormGroup;
  sucursales: Sucursal[];
  selectedSucursales: Sucursal[] = [];
  selectedSucursalesPrecios: Sucursal[];
  pedidoItemSucursales : PedidoItemSucursal[] = [];
  displayedColumnsUltimaCompras = [
    'proveedorNombre',
    'precio',
    'cantidad',
    'fecha',
  ];
  displayedColumnsCodigos = ['codigo', 'cantidad', 'principal', 'caja'];
  today: Date;
  totalPorCaja: number = 0;
  totalPorUnidad: number = 0;
  valorTotalSinDesc: number = 0;
  valorTotalConDesc: number = 0;
  pedidoItem: PedidoItem;
  innerWidth;
  innerHeight;
  selection = new SelectionModel<Sucursal>(
    true
  );
  //mascara en donde vamos a definir el formato de la moneda
  currencyMask = new CurrencyMask;

  constructor(
    public dialogRef: MatDialogRef<PedidoItensDialogComponent>,
    private dialogService: DialogosService,
    private sucursalGQL: SucursalesGQL,
    private getProductoInfoCompleta: ProductoInfoCompletaByIdGQL,
    private notificationSnackBar: NotificacionSnackbarService,
    private windowInfo: WindowInfoService,
    private dialog: MatDialog,
    private currencyPipe : CurrencyPipe,
    @Inject(MAT_DIALOG_DATA) public data: PedidoItemDialogData
  ) {
    this.today = new Date();
    if (data.pedidoItem != null) {
      this.pedidoItem = data.pedidoItem;
      this.pedidoItemSucursales = this.pedidoItem?.pedidoItemSucursales;
      if(this.pedidoItemSucursales){
        this.pedidoItemSucursales.forEach((pis) => {
          this.selectedSucursales.push(pis.sucursal);
        });
      }
    }
    if(data.moneda){
      switch (data.moneda.denominacion) {
        case 'GUARANI':
          this.currencyMask.separator = "separator.0";
          this.currencyMask.thousandSeparator= ","
          break;
      
        default:
          this.currencyMask.separator = "separator.2"
          this.currencyMask.thousandSeparator = ","
          break;
      }
    }
  }

  ngOnInit(): void {
    this.createForm();
    this.innerWidth = `${
      this.windowInfo.innerWidth - this.windowInfo.innerWidth * 0.2
    }px`;
    this.innerHeight = `${
      this.windowInfo.innerHeight - this.windowInfo.innerHeight * 0.2
    }px`;
    this.selectedSucursales = [];
    this.selectedSucursalesPrecios = [];
    this.sucursalGQL.fetch().subscribe((data) => {
      if (!data.errors) {
        this.sucursales = data.data;
        
        this.sucursales.forEach((e) => {
          this.formGroup.addControl(
            `fechaUltimaCompra${this.extraerEspacios(e.nombre)}`,
            new FormControl()
          );
          this.formGroup.addControl(
            `precioUltimaCompra${this.extraerEspacios(e.nombre)}`,
            new FormControl()
          );
          this.formGroup.addControl(
            `sucursalEntrega${this.extraerEspacios(e.nombre)}`,
            new FormControl()
          );
          this.formGroup.addControl(`costoMedio${this.extraerEspacios(e.nombre)}`, new FormControl());
          this.formGroup.addControl(
            `cantidadPorCaja${this.extraerEspacios(e.nombre)}`,
            new FormControl()
          );
          this.formGroup.addControl(
            `cantidadPorUnidad${this.extraerEspacios(e.nombre)}`,
            new FormControl()
          );
          this.formGroup.addControl(`existencia${this.extraerEspacios(e.nombre)}`, new FormControl());
          this.formGroup.addControl(
            `cantidadUltimaCompra${this.extraerEspacios(e.nombre)}`,
            new FormControl()
          );
          this.formGroup.addControl(`precio1${this.extraerEspacios(e.nombre)}`, new FormControl());
          this.formGroup.addControl(`precio2${this.extraerEspacios(e.nombre)}`, new FormControl());
          this.formGroup.addControl(`precio3${this.extraerEspacios(e.nombre)}`, new FormControl());
          this.formGroup.addControl(
            `precio1Prog${this.extraerEspacios(e.nombre)}`,
            new FormControl()
          );
          this.formGroup.addControl(
            `precio2Prog${this.extraerEspacios(e.nombre)}`,
            new FormControl()
          );
          this.formGroup.addControl(
            `precio3Prog${this.extraerEspacios(e.nombre)}`,
            new FormControl()
          );
          this.formGroup.addControl(
            `sucursalEntrega${this.extraerEspacios(e.nombre)}`,
            new FormControl()
          );
        });
        this.cargarSugerenciasSucursales();
        this.cargarDatosdeProducto();
        this.pedidoItem.estado == PedidoItemEstado.ACTIVO ? this.cargarDatosPedidoItem() : null;
      }
    });
  }

  ngAfterViewInit(): void {
    //escuchar los cambios del formulario

    this.formGroup.get('allSucursales').valueChanges.subscribe((data)=>{
      if(data){
        this.formGroup.get('sucursal').disable()
      } else {
        this.formGroup.get('sucursal').enable()
      }
    });

    this.formGroup.get('allSucursalesPrecios').valueChanges.subscribe((data)=>{
      if(data){
        this.formGroup.get('sucursalesPrecios').disable()
      } else {
        this.formGroup.get('sucursalesPrecios').enable()
      }
    });

    this.formGroup.get('sucursal').valueChanges.subscribe((data) => {
      this.selectedSucursales = data;
      if (this.selectedSucursalesPrecios != null) {
        this.selectedSucursalesPrecios = data;
      }
    });

    this.formGroup.get('sucursalesPrecios').valueChanges.subscribe((data) => {
      this.selectedSucursalesPrecios = data;
    });

    // eschucar valor de bonificacion y realizar cambios
    this.formGroup.get('bonificacion').valueChanges.subscribe((data) => {
      if (data) {
        this.formGroup.get('valorPorCaja').setValue(0);
        this.formGroup.get('valorUnitario').setValue(0);
        this.formGroup.get('descuentoPorUnidad').setValue(0);
        this.formGroup.get('valorPorCaja').disable();
        this.formGroup.get('valorUnitario').disable();
        this.formGroup.get('descuentoPorUnidad').disable();
        this.selectedSucursales.forEach((s) => {
          this.formGroup.get(`cantidadPorCaja${this.extraerEspacios(s.nombre)}`).setValue(0);
          this.formGroup.get(`cantidadPorUnidad${this.extraerEspacios(s.nombre)}`).setValue(0);
        });
        this.sumarTotales();
      } else {
        this.formGroup.get('valorPorCaja').enable();
        this.formGroup.get('valorUnitario').enable();
        this.formGroup.get('descuentoPorUnidad').enable();
      }
    });
  }

  createForm(): void {
    this.formGroup = new FormGroup({
      unidadPorCaja: new FormControl(null),
      // cantidadPorCaja: new FormControl(null, Validators.required),
      // cantidadUnitaria: new FormControl(null),
      valorPorCaja: new FormControl(null, Validators.required),
      valorUnitario: new FormControl(null, Validators.required),
      descuentoPorCaja: new FormControl(null),
      descuentoPorUnidad: new FormControl(null),
      bonificacion: new FormControl(null),
      bonificacionDetalle: new FormControl(null),
      vencimiento: new FormControl(null),
      sucursal: new FormControl(null),
      // datos de precio
      precio1: new FormControl(null),
      precio2: new FormControl(null),
      precio3: new FormControl(null),
      programarPrecio: new FormControl(null),
      momentoEntrega: new FormControl(null),
      fechaProgramacionPrecio: new FormControl(null),
      horaProgramacionPrecio: new FormControl(null),
      precio1Prog: new FormControl(null),
      precio2Prog: new FormControl(null),
      precio3Prog: new FormControl(null),
      allSucursalesPrecios: new FormControl(null),
      sucursalesPrecios: new FormControl(null),
      preciosIndividuales: new FormControl(null),
      //datos del producto
      descripcion: new FormControl(null),
      descripcionFactura: new FormControl(null),
      iva: new FormControl(null),
      tipoConservacion: new FormControl(null),
      balanza: new FormControl(null),
      garantia: new FormControl(null),
      stock: new FormControl(null),
      ingrediente: new FormControl(null),
      combo: new FormControl(null),
      promocion: new FormControl(null),
      isVencimiento: new FormControl(null),
      familia: new FormControl(null),
      subFamilia: new FormControl(null),
      //control de sucursales
      allSucursales: new FormControl(null),
      // totales
      totalPorCaja: new FormControl(null),
      totalPorUnidad: new FormControl(null),
      valorTotal: new FormControl(null),
    });
    this.formGroup.get('allSucursales').setValue(false);
    this.formGroup.get('unidadPorCaja').disable();
  }

  onCancelEvent() {
    this.dialogService
      .confirm(
        'Desea cancelar el proceso?',
        'Si cancela todo el proceso sera perdido', null, null, true
      )
      .subscribe((res) => {
        if (res) {
          this.dialogRef.close();
        }
      });
  }

  @HostListener('document:keydown', ['$event']) onKeydownHandler(
    event: KeyboardEvent
  ) {
    switch (event.key) {
      case 'Escape':
        this.onCancelEvent();
        break;
      case 'Enter':
        break;
      default:
        break;
    }
  }

  calcularCantidad(e) {
    // this.notificationSnackBar.showNotification(
    //   'calculando...',
    //   3    );
  }

  todasSucursalesEventChange() {
    if (this.formGroup.get('allSucursales').value) {
      this.selectedSucursales = this.sucursales;
    } else {
      this.selectedSucursales = [];
      this.formGroup.get('sucursal').reset();
    }
  }

  todasSucursalesPreciosEventChange() {
    if (this.formGroup.get('allSucursalesPrecios').value) {
      this.selectedSucursalesPrecios = this.sucursales;
    } else {
      this.selectedSucursalesPrecios = [];
      this.formGroup.get('sucursalesPrecios').reset();
    }
  }

  //metodo para cargar las sugerencias de cantidad de compra
  cargarSugerenciasSucursales() {
    //cargar sucursales del producto
    let sucList: ExistenciaCostoPorSucursal[] = this.pedidoItem?.producto
      ?.sucursales;
    // cargar cuantas unidades viene en una caja del producto
    let unidadPorCaja = this.pedidoItem?.producto?.unidadPorCaja;
    //recorrer todas las sucursales y crear los controladores y cargar las cantidades sugeridas
    sucList?.forEach((e) => {
      let nombre = e.sucursal.nombre;
      let existencia = e.existencia;
      let cantMedia = e.cantMedia;
      let cantidadUltimaCompra = e.cantidadUltimaCompra;
      let cantSugeridaPorCaja = Math.floor(
        existencia > cantMedia ? 0 : (cantMedia - existencia) / unidadPorCaja
      );
      this.formGroup
        .get(`cantidadPorCaja${this.extraerEspacios(nombre)}`)
        .setValue(cantSugeridaPorCaja);
      this.formGroup
        .get(`cantidadPorUnidad${this.extraerEspacios(nombre)}`)
        .setValue(cantSugeridaPorCaja * unidadPorCaja);
      this.formGroup.get(`existencia${this.extraerEspacios(nombre)}`).setValue(existencia);
      this.formGroup
        .get(`cantidadUltimaCompra${this.extraerEspacios(nombre)}`)
        .setValue(cantidadUltimaCompra);
      this.formGroup
        .get(`fechaUltimaCompra${this.extraerEspacios(nombre)}`)
        .setValue(e.fechaUltimaCompra);
      this.formGroup
        .get(`precioUltimaCompra${this.extraerEspacios(nombre)}`)
        .setValue(e.precio);
      this.formGroup.get(`costoMedio${this.extraerEspacios(nombre)}`).setValue(e.costoMedio);
      // inhabilitar los campos
      this.formGroup.get(`existencia${this.extraerEspacios(nombre)}`).disable();
      this.formGroup.get(`cantidadUltimaCompra${this.extraerEspacios(nombre)}`).disable();
      this.formGroup.get(`fechaUltimaCompra${this.extraerEspacios(nombre)}`).disable();
      this.formGroup.get(`precioUltimaCompra${this.extraerEspacios(nombre)}`).disable();
      this.formGroup.get(`costoMedio${this.extraerEspacios(nombre)}`).disable();
    });
  }

  onCantidadPorSucursalChange(tipo, sucNombre) {
    switch (tipo) {
      case 'caja':
        this.formGroup
          .get(`cantidadPorUnidad${sucNombre}`)
          .setValue(
            this.formGroup.get(`cantidadPorCaja${sucNombre}`).value *
              this.pedidoItem?.producto.unidadPorCaja
          );
        break;
      case 'unidad':
        this.formGroup
          .get(`cantidadPorCaja${sucNombre}`)
          .setValue(
            this.formGroup.get(`cantidadPorUnidad${sucNombre}`).value /
              this.pedidoItem?.producto.unidadPorCaja
          );
        break;
      default:
        break;
    }
  }

  cargarDatosPedidoItem() {
    this.formGroup
      .get('valorUnitario')
      .setValue(this.pedidoItem?.precioUnitario);
     this.formGroup
      .get('valorPorCaja')
      .setValue(
        (this.pedidoItem?.precioUnitario *
          this.pedidoItem?.producto?.unidadPorCaja)
      );
    this.formGroup
      .get('descuentoPorUnidad')
      .setValue(this.pedidoItem?.descuentoUnitario);
    this.formGroup.get('bonificacion').setValue(this.pedidoItem?.bonificacion);
    this.formGroup
      .get('bonificacionDetalle')
      .setValue(this.pedidoItem?.bonificacionDetalle);
    this.formGroup.get('vencimiento').setValue(this.pedidoItem?.vencimiento);
    this.pedidoItem?.pedidoItemSucursales.length > 0 ? this.pedidoItem?.pedidoItemSucursales.forEach((pis) => {
      this.selectedSucursales.push(pis.sucursal);
      this.formGroup
        .get(`cantidadPorUnidad${this.extraerEspacios(pis.sucursal.nombre)}`)
        .setValue(pis.cantidad | 0);
      this.formGroup
        .get(`cantidadPorCaja${this.extraerEspacios(pis.sucursal.nombre)}`)
        .setValue((pis.cantidad / this.pedidoItem?.producto?.unidadPorCaja));
      this.formGroup
        .get(`sucursalEntrega${this.extraerEspacios(pis.sucursal.nombre)}`)
        .setValue(pis.sucursalEntrega);
    }) : null;
    this.formGroup.get('sucursal').setValue(this.selectedSucursales)
    this.sumarTotales();
    this.calcularCantidades('caja');
  }

  cargarDatosdeProducto() {
    let pro: Producto = this.pedidoItem?.producto;
    this.formGroup.get('descripcion').setValue(pro.descripcion);
    this.formGroup.get('descripcionFactura').setValue(pro.descripcionFactura);
    this.formGroup.get('iva').setValue(pro.iva);
    this.formGroup.get('unidadPorCaja').setValue(pro.unidadPorCaja);
    this.formGroup.get('balanza').setValue(pro.balanza);
    this.formGroup.get('ingrediente').setValue(pro.ingrediente);
    this.formGroup.get('isVencimiento').setValue(pro.vencimiento);
    this.formGroup.get('stock').setValue(pro.stock);
    this.formGroup.get('familia').setValue(pro.subfamilia.familia.descripcion);
    this.formGroup.get('subFamilia').setValue(pro.subfamilia.descripcion);
  }

  //funcion para calcuar las cantidads unitarias o de caja

  calcularCantidades(tipo) {
    switch (tipo) {
      case 'caja':
        this.formGroup
          .get('valorUnitario')
          .setValue(
            this.formGroup.get('valorPorCaja').value /
              this.formGroup.get('unidadPorCaja').value
          );
        break;

      case 'unidad':
        this.formGroup
          .get('valorPorCaja')
          .setValue(
            this.formGroup.get('valorUnitario').value *
              this.formGroup.get('unidadPorCaja').value
          );
        break;

      default:
        break;
    }
  }

  //funcion que suma las cantidades de cada sucursal y genera los totales
  sumarTotales() {
    this.totalPorCaja = 0;
    this.totalPorUnidad = 0;
    this.selectedSucursales.forEach((e) => {
      this.totalPorCaja =
        this.totalPorCaja +
        this.formGroup.get(`cantidadPorCaja${this.extraerEspacios(e.nombre)}`)?.value;
      this.totalPorUnidad =
        this.totalPorUnidad +
        this.formGroup.get(`cantidadPorUnidad${this.extraerEspacios(e.nombre)}`)?.value;
    });
    this.valorTotalSinDesc =
      this.totalPorUnidad * this.formGroup.get('valorUnitario')?.value;
    this.valorTotalConDesc =
      this.totalPorUnidad * this.formGroup.get('valorUnitario')?.value -
      this.totalPorUnidad * this.formGroup.get('descuentoPorUnidad')?.value;
  }

  editField: string;
  personList: Array<any> = [
    {
      id: 1,
      name: 'Aurelia Vega',
      age: 30,
      companyName: 'Deepends',
      country: 'Spain',
      city: 'Madrid',
    },
    {
      id: 2,
      name: 'Guerra Cortez',
      age: 45,
      companyName: 'Insectus',
      country: 'USA',
      city: 'San Francisco',
    },
    {
      id: 3,
      name: 'Guadalupe House',
      age: 26,
      companyName: 'Isotronic',
      country: 'Germany',
      city: 'Frankfurt am Main',
    },
    {
      id: 4,
      name: 'Aurelia Vega',
      age: 30,
      companyName: 'Deepends',
      country: 'Spain',
      city: 'Madrid',
    },
    {
      id: 5,
      name: 'Elisa Gallagher',
      age: 31,
      companyName: 'Portica',
      country: 'United Kingdom',
      city: 'London',
    },
  ];

  awaitingPersonList: Array<any> = [
    {
      id: 6,
      name: 'George Vega',
      age: 28,
      companyName: 'Classical',
      country: 'Russia',
      city: 'Moscow',
    },
    {
      id: 7,
      name: 'Mike Low',
      age: 22,
      companyName: 'Lou',
      country: 'USA',
      city: 'Los Angeles',
    },
    {
      id: 8,
      name: 'John Derp',
      age: 36,
      companyName: 'Derping',
      country: 'USA',
      city: 'Chicago',
    },
    {
      id: 9,
      name: 'Anastasia John',
      age: 21,
      companyName: 'Ajo',
      country: 'Brazil',
      city: 'Rio',
    },
    {
      id: 10,
      name: 'John Maklowicz',
      age: 36,
      companyName: 'Mako',
      country: 'Poland',
      city: 'Bialystok',
    },
  ];

  updateList(id: number, property: string, event: any) {
    const editField = event.target.textContent;
    this.personList[id][property] = editField;
  }

  remove(id: any) {
    this.awaitingPersonList.push(this.personList[id]);
    this.personList.splice(id, 1);
  }

  add() {
    if (this.awaitingPersonList.length > 0) {
      const person = this.awaitingPersonList[0];
      this.personList.push(person);
      this.awaitingPersonList.splice(0, 1);
    }
  }

  changeValue(id: number, property: string, event: any) {
    this.editField = event.target.textContent;
  }

  onSubmit() {
    let cantidadTotal = 0;
    let isCantidadZero = true;
    if (this.formGroup.valid && this.totalPorUnidad!=0) {
      let pedidoItemSucursales: PedidoItemSucursal[] = [];
      this.selectedSucursales.forEach((s) => {
        if (this.formGroup.get(`cantidadPorUnidad${this.extraerEspacios(s.nombre)}`).value != 0) {
          let pis: PedidoItemSucursal = new PedidoItemSucursal();
          pis.sucursal = s;
          pis.cantidad = this.formGroup.get(
            `cantidadPorUnidad${this.extraerEspacios(s.nombre)}`
          ).value;
          pedidoItemSucursales.push(pis);
          pis.sucursalEntrega = this.formGroup.get(
            `sucursalEntrega${this.extraerEspacios(s.nombre)}`
          ).value;
          if(this.formGroup.get(`sucursalEntrega${this.extraerEspacios(s.nombre)}`).value){
            pis.sucursalEntrega = this.formGroup.get(`sucursalEntrega${this.extraerEspacios(s.nombre)}`).value;
          } else {
            pis.sucursalEntrega = pis.sucursal;
          }

        }
        cantidadTotal =
          cantidadTotal +
          this.formGroup.get(`cantidadPorUnidad${this.extraerEspacios(s.nombre)}`).value;
      });
      if (pedidoItemSucursales.length > 0) {
        let pi = new PedidoItem();
        pi.precioUnitario = this.formGroup.get('valorUnitario').value;
        pi.estado = PedidoItemEstado.ACTIVO;
        pi.pedidoItemSucursales = pedidoItemSucursales;
        pi.producto = this.pedidoItem?.producto;
        pi.cantidad = cantidadTotal;
        pi.valorTotal = this.formGroup.get('valorTotal').value;
        pi.descuentoUnitario = this.formGroup.get('descuentoPorUnidad').value;
        if (this.formGroup.get('bonificacion').value) {
          pi.bonificacion = this.formGroup.get('bonificacion').value;
          pi.bonificacionDetalle = this.formGroup.get(
            'bonificacionDetalle'
          ).value;
          pi.precioUnitario = 0;
          pi.descuentoUnitario = 0;
        }
        let sucCantidades = []
        pi.pedidoItemSucursales.forEach((pi)=>{
          sucCantidades.push(`${pi.sucursal.nombre} : ${pi.cantidad}`)
        })
        this.dialogService
          .confirm('Desea agregar este Producto?', pi.producto.descripcion, null, sucCantidades, true)
          .subscribe((res) => {
            if (res) {
              this.dialogRef.close(pi);
            }
          });
      }
    } else {
      // this.notificationSnackBar.showNotification(
      //   `Ups! Olivdaste cargar algun campos obligatorio`,
      //   null,
      //   3,
      //   'red'
      // );
    }
  }

  extraerEspacios(texto: string): string {
    let textoSinEspacios = texto.replace(/\ /g, "");
    return textoSinEspacios;
  }

  //funcion que verifica si el valor esta dentro del rango de la ultima compra,
  // si no hay ultima compra no se puede establecer un limite superior e inferior
  // esta funcion solo lanza una advertencia
  verificarValor(){
    let valorPorCaja = this.formGroup.get('valorPorCaja').value;
    let valorPorUnidad = this.data.moneda?.id == 1 ? Math.trunc(valorPorCaja / this.pedidoItem?.producto?.unidadPorCaja) : valorPorCaja / this.pedidoItem?.producto?.unidadPorCaja;
    let valorUltimaCompra = this.pedidoItem?.producto?.productoUltimasCompras[0]?.precio;
    if(valorPorUnidad>0 && valorUltimaCompra>0){
      let margen = valorUltimaCompra * 0.2;
      let valorAgregado = valorUltimaCompra + margen;
      let valorDescontado = valorUltimaCompra - margen;
      if(valorPorUnidad > valorAgregado || valorPorUnidad < valorDescontado){
        this.dialogService.confirm('ATENCIÓN!! El valor por unidad difiere en más de 20% de la última compra', `Valor ingresado: ${this.data.moneda?.simbolo} ${valorPorUnidad}`, `Ùltimo precio de compra: ${this.data.moneda?.simbolo} ${valorUltimaCompra}`, null, false).subscribe((res)=>{
          this.valorPorUnidadInput.nativeElement.focus()
          this.valorPorUnidadInput.nativeElement.select()
        })
      }
    }
  }

}
