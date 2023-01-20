import { TransferenciaTimelineDialogComponent } from '../../../transferencias/transferencia-timeline-dialog/transferencia-timeline-dialog.component';
import { TipoEntidad } from './../../../../generics/tipo-entidad.enum';
import { QrCodeComponent, QrData } from './../../../../shared/qr-code/qr-code.component';
import { CargandoDialogService } from './../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { TransferenciaService } from './../transferencia.service';
import { PdvSearchProductoData, PdvSearchProductoDialogComponent, PdvSearchProductoResponseData } from '../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MatTableDataSource } from '@angular/material/table';
import { MainService } from '../../../../main.service';
import { Presentacion } from '../../../productos/presentacion/presentacion.model';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SeleccionarSucursalDialogComponent } from '../seleccionar-sucursal-dialog/seleccionar-sucursal-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CreateItemDialogComponent } from '../create-item-dialog/create-item-dialog.component';
import { updateDataSource, updateDataSourceInsertFirst, updateDataSourceWithId } from '../../../../commons/core/utils/numbersUtils';
import { EtapaTransferencia, TipoTransferencia, Transferencia, TransferenciaEstado, TransferenciaItem } from '../transferencia.model';
import { Tab } from '../../../../layouts/tab/tab.model';
import { SelectionModel } from '@angular/cdk/collections';
import { ModificarItemDialogComponent } from '../modificar-item-dialog/modificar-item-dialog.component';
import { FormControl, Validators } from '@angular/forms';
import { Producto } from '../../../productos/producto/producto.model';
import { ProductoService } from '../../../productos/producto/producto.service';
import { MatSelect } from '@angular/material/select';



@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-edit-transferencia',
  templateUrl: './edit-transferencia.component.html',
  styleUrls: ['./edit-transferencia.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class EditTransferenciaComponent implements OnInit {

  @ViewChild('codigoInput', { static: false }) codigoInput: ElementRef;
  @ViewChild('cantPresentacionInput', { static: false }) cantPresentacionInput: ElementRef;
  @ViewChild('vencimientoInput', { static: false }) vencimientoInput: ElementRef;
  @ViewChild('matSelect', { static: false }) matSelect: MatSelect;

  @Input()
  data: Tab;

  columnsToDisplay = ['producto', 'codigo', 'presentacion', 'cantidad', 'precio', 'vencimiento', 'estado', 'menu']

  selectedSucursalOrigen: Sucursal;

  selectedSucursalDestino: Sucursal;

  selectedTransferencia = new Transferencia;

  selectedProducto = new Producto;

  dataSource = new MatTableDataSource<TransferenciaItem>([])

  expandedElement: TransferenciaItem;

  selectedEtapa: EtapaTransferencia;

  isDialogOpen = false;

  page = 0;
  size = 10;

  isLastPage = false;

  isPreTransferenciaCreacion = false;
  isPreTransferenciaOrigen = false;
  isPreparacionMercaderia = false;
  isPreparacionMercaderiaConcluida = false;
  isTransporteVerificacion = false;
  isTransporteEnCamino = false;
  isTransporteEnDestino = false;
  isRecepcionEnVerificacion = false;
  isRecepcionConcluida = false;
  isAllConfirmedPreparacion = false;
  isAllConfirmedTransporte = false;
  isAllConfirmedRecepcion = false;

  isOrigen = false;
  isDestino = false;
  isPesable = false;
  selection = new SelectionModel<TransferenciaItem>(true, []);

  etapaList;

  puedeEditar = false;

  selectedResponsable;

  codigoControl = new FormControl(null, Validators.required);
  presentacionControl = new FormControl(null, Validators.required);
  cantidadPresentacionControl = new FormControl(1, [Validators.min(0), Validators.pattern('\\d+([.]\\d+)?')]);
  cantidadUnidadControl = new FormControl(1, [Validators.min(0), Validators.pattern('\\d+([.]\\d+)?')]);
  vencimientoControl = new FormControl(null)

  constructor(private matDialog: MatDialog,
    public mainService: MainService,
    private transferenciaService: TransferenciaService,
    private cargandoService: CargandoDialogService,
    private productoService: ProductoService
  ) {

  }

  ngOnInit(): void {
    this.selectedTransferencia = new Transferencia;
    this.dataSource.data = []
    this.etapaList = Object.values(EtapaTransferencia)
    this.selectedTransferencia.usuarioPreTransferencia = this.mainService.usuarioActual;
    this.selectedTransferencia.tipo = TipoTransferencia.MANUAL;
    this.selectedTransferencia.estado = TransferenciaEstado.ABIERTA;
    this.selectedTransferencia.etapa = EtapaTransferencia.PRE_TRANSFERENCIA_CREACION;

    if (this.data?.tabData != null && this.data?.tabData['id']) {
      this.cargarDatos()
    } else {
      setTimeout(() => {
        this.selectSucursales()
        this.verificarEtapa()
      }, 1000);
    }

    this.cantidadUnidadControl.disable()

    this.cantidadPresentacionControl.valueChanges.subscribe(res => {
      if (res != null && this.presentacionControl.valid) {
        this.cantidadUnidadControl.enable()
        this.cantidadUnidadControl.setValue(this.presentacionControl.value?.cantidad * res)
        this.cantidadUnidadControl.disable()
      }
    })

    setTimeout(() => {
      this.codigoInput.nativeElement.focus()
    }, 1000);

  }

  @HostListener("window:keyup", ["$event"])
  keyEvent(event: KeyboardEvent) {
    let key = event.key;
    if (this.isDialogOpen) {
      return null;
    }
    if (this.selectedTransferencia.etapa == EtapaTransferencia.PRE_TRANSFERENCIA_CREACION) {
      switch (key) {
        default:
          break;
      }
    }
  }

  selectSucursales() {
    this.isDialogOpen = true;
    this.matDialog.open(SeleccionarSucursalDialogComponent, {
      width: '80%',
      height: '70%',
      disableClose: false
    }).afterClosed().subscribe(async res => {
      this.isDialogOpen = false;
      if (res != null) {
        this.selectedTransferencia.sucursalOrigen = res['sucursalOrigen']
        this.selectedTransferencia.sucursalDestino = res['sucursalDestino']
      }
    })
  }

  cargarDatos() {
    this.cargandoService.openDialog(false, 'Cargando datos')
    let id = this.data.tabData['id'];
    if (id != null) {
      this.transferenciaService.onGetTransferencia(id)
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          this.cargandoService.closeDialog()
          if (res != null) {
            this.selectedTransferencia = res;
            this.getTransferenciaItemList()
            this.isOrigen = this.selectedTransferencia?.sucursalOrigen?.id == this.mainService?.sucursalActual?.id;
            this.isDestino = this.selectedTransferencia?.sucursalDestino?.id == this.mainService?.sucursalActual?.id;
            this.onVerificarConfirmados()
            this.verificarEtapa()
          }
        })
    }

  }

  getTransferenciaItemList() {
    this.transferenciaService.onGetTransferenciaItensPorTransferenciaId(this.selectedTransferencia.id, this.page, this.size).pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          if (res.length < this.size) {
            this.isLastPage = true;
          }
          if (this.dataSource.data.length == 0) {
            this.dataSource.data = res;
          } else {
            this.dataSource.data = this.dataSource.data.concat(res)
          }
        }
      })
  }

  cargarMasDatos() {
    this.page++;
    this.getTransferenciaItemList()
  }

  onRefresh() {
    this.ngOnInit()
  }

  verificarEtapa() {
    this.setAllEtapasFalse()
    switch (this.selectedTransferencia?.etapa) {
      case EtapaTransferencia.PRE_TRANSFERENCIA_CREACION:
        this.isPreTransferenciaCreacion = true;
        this.selectedResponsable = this.selectedTransferencia?.usuarioPreTransferencia;
        break;
      case EtapaTransferencia.PRE_TRANSFERENCIA_ORIGEN:
        this.isPreTransferenciaOrigen = true;
        this.selectedResponsable = this.selectedTransferencia?.usuarioPreTransferencia;
        break;
      case EtapaTransferencia.PREPARACION_MERCADERIA:
        this.isPreparacionMercaderia = true;
        this.selectedResponsable = this.selectedTransferencia?.usuarioPreparacion;
        break;
      case EtapaTransferencia.PREPARACION_MERCADERIA_CONCLUIDA:
        this.selectedResponsable = this.selectedTransferencia?.usuarioPreparacion;
        this.isPreparacionMercaderiaConcluida = true;
        this.dataSource.data = this.dataSource.data.filter(i => i.motivoRechazoPreparacion == null)
        break;
      case EtapaTransferencia.TRANSPORTE_VERIFICACION:
        this.isTransporteVerificacion = true;
        this.selectedResponsable = this.selectedTransferencia?.usuarioTransporte;
        this.dataSource.data = this.dataSource.data.filter(i => i.motivoRechazoPreparacion == null)
        break;
      case EtapaTransferencia.TRANSPORTE_EN_CAMINO:
        this.selectedResponsable = this.selectedTransferencia?.usuarioTransporte;
        this.isTransporteEnCamino = true;
        this.dataSource.data = this.dataSource.data.filter(i => i.motivoRechazoPreparacion == null && i.motivoRechazoTransporte == null)
        break;
      case EtapaTransferencia.TRANSPORTE_EN_DESTINO:
        this.isTransporteEnDestino = true;
        this.selectedResponsable = this.selectedTransferencia?.usuarioRecepcion;
        break;
      case EtapaTransferencia.RECEPCION_EN_VERIFICACION:
        this.isRecepcionEnVerificacion = true;
        this.selectedResponsable = this.selectedTransferencia?.usuarioRecepcion;
        this.dataSource.data = this.dataSource.data.filter(i => i.motivoRechazoPreparacion == null && i.motivoRechazoTransporte == null)
        break;
      case EtapaTransferencia.RECEPCION_CONCLUIDA:
        this.isRecepcionConcluida = true;
        this.selectedResponsable = this.selectedTransferencia?.usuarioRecepcion;
        break;
      default:
        break;
    }

    if (this.selectedResponsable.id == this.mainService.usuarioActual.id || this.selectedResponsable.id == null) {
      this.puedeEditar = true;
    }
    this.onVerificarConfirmados()
  }

  setAllEtapasFalse() {
    this.isPreTransferenciaCreacion = false;
    this.isPreTransferenciaOrigen = false;
    this.isPreparacionMercaderia = false;
    this.isPreparacionMercaderiaConcluida = false;
    this.isTransporteVerificacion = false;
    this.isTransporteEnCamino = false;
    this.isTransporteEnDestino = false;
    this.isRecepcionEnVerificacion = false;
    this.isRecepcionConcluida = false;
  }



  onAddItem(texto?) {
    this.isDialogOpen = true;
    let data: PdvSearchProductoData = {
      texto: texto,
      cantidad: 1,
      mostrarOpciones: false,
      mostrarStock: true,
      conservarUltimaBusqueda: true
    }
    this.matDialog.open(PdvSearchProductoDialogComponent, {
      data: data,
      height: '80%',
    }).afterClosed().subscribe(res => {
      this.isDialogOpen = false;
      let response: PdvSearchProductoResponseData = res;
      // if (response.presentacion != null) {
      //   this.createItem(response.presentacion, null, response.cantidad)
      // }
      this.selectedProducto = response.producto;
      this.presentacionControl.setValue(response.presentacion)
      this.cantidadPresentacionControl.setValue(1)
      this.cantPresentacionInput.nativeElement.select()
      this.codigoControl.setValue(response.presentacion?.codigoPrincipal?.codigo)
    })
  }

  createItem(presentacion: Presentacion, item?, cantidad?) {
    this.isDialogOpen = true;
    this.matDialog.open(CreateItemDialogComponent, {
      data: {
        item,
        presentacion,
        transferencia: this.selectedTransferencia,
        cantidad
      },
      width: '40%',
      disableClose: true
    }).afterClosed().subscribe(async res => {
      this.isDialogOpen = false;
      if (res != null) {
        if (this.selectedTransferencia?.id == null) {
          this.onSaveTransferencia().then(() => {
            this.onSaveTransferenciaItem(res['item'])
          })
        } else {
          this.onSaveTransferenciaItem(res['item'])
        }
      }
    })
  }

  onSaveTransferencia(): Promise<any> {
    this.cargandoService.openDialog()
    return new Promise((resolve, reject) => {
      this.transferenciaService.onSaveTransferencia(this.selectedTransferencia.toInput())
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          this.cargandoService.closeDialog()
          if (res != null) {
            this.selectedTransferencia = res;
            resolve(res)
          } else {
            reject()
          }
        })
    })
  }

  onSaveTransferenciaItem(item: TransferenciaItem) {
    let auxItem = new TransferenciaItem;
    let isNew = item?.id == null;
    Object.assign(auxItem, item)
    auxItem.transferencia = this.selectedTransferencia;
    this.cargandoService.openDialog()
    this.transferenciaService.onSaveTransferenciaItem(auxItem.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.cargandoService.closeDialog()
        if (res != null) {
          if (!isNew) {
            this.dataSource.data = updateDataSourceWithId(this.dataSource.data, res, res?.id);
          } else {
            this.isLastPage = false;
            this.page = 0;
            this.dataSource.data = updateDataSourceInsertFirst(this.dataSource.data, res);
            let lenght = this.dataSource.data.length;
            if (lenght > this.size) {
              let diff = lenght - this.size;
              let aux = this.dataSource.data;
              aux.splice(4, diff)
              this.dataSource.data = aux;
            }
          }
        }
      })
  }

  onDeleteItem(item: TransferenciaItem, index) {
    this.transferenciaService.onDeleteTransferenciaItem(item.id).subscribe(res => {
      if (res) {
        this.dataSource.data = updateDataSource(this.dataSource.data, null, index);
      }
    })
  }

  onEditItem(item: TransferenciaItem) {
    this.createItem(null, item)
  }

  onFinalizar() {
    this.transferenciaService.onFinalizar(this.selectedTransferencia)
      .pipe()
      .subscribe(res => {
        if (res) {
          this.selectedTransferencia.estado = TransferenciaEstado.EN_ORIGEN;
          this.selectedTransferencia.etapa = EtapaTransferencia.PRE_TRANSFERENCIA_ORIGEN;
          this.verificarEtapa()
        }
      })
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }

  onSelectRow(row) {
    this.selection.toggle(row);
    console.log(row)
  }

  onEditClick(row) {

  }

  onConfirm(item: TransferenciaItem) {
    let newItem = new TransferenciaItem;
    item = Object.assign(newItem, item)
    if (this.selectedTransferencia?.etapa == EtapaTransferencia.PREPARACION_MERCADERIA) {
      item.cantidadPreparacion = item.cantidadPreTransferencia;
      item.presentacionPreparacion = item.presentacionPreTransferencia;
      item.vencimientoPreparacion = item?.vencimientoPreTransferencia;
    } else if (this.selectedTransferencia?.etapa == EtapaTransferencia.TRANSPORTE_VERIFICACION) {
      item.cantidadTransporte = item.cantidadPreparacion;
      item.presentacionTransporte = item.presentacionPreparacion;
      item.vencimientoTransporte = item?.vencimientoPreparacion;
    } else if (this.selectedTransferencia?.etapa == EtapaTransferencia.RECEPCION_EN_VERIFICACION) {
      item.cantidadRecepcion = item.cantidadTransporte;
      item.presentacionRecepcion = item.presentacionTransporte;
      item.vencimientoRecepcion = item?.vencimientoTransporte;
    }
    this.transferenciaService.onSaveTransferenciaItem(item.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.dataSource.data = updateDataSourceWithId(this.dataSource.data, item, item.id)
        }
        this.onVerificarConfirmados()
      })
  }


  onDesconfirm(item: TransferenciaItem) {
    let newItem = new TransferenciaItem;
    item = Object.assign(newItem, item)
    if (this.selectedTransferencia?.etapa == EtapaTransferencia.PREPARACION_MERCADERIA) {
      item.cantidadPreparacion = null
      item.presentacionPreparacion = null
      item.vencimientoPreparacion = null
    } else if (this.selectedTransferencia?.etapa == EtapaTransferencia.TRANSPORTE_VERIFICACION) {
      item.cantidadTransporte = null
      item.presentacionTransporte = null
      item.vencimientoTransporte = null
    } else if (this.selectedTransferencia?.etapa == EtapaTransferencia.RECEPCION_EN_VERIFICACION) {
      item.cantidadRecepcion = null
      item.presentacionRecepcion = null
      item.vencimientoRecepcion = null
    }
    this.transferenciaService.onSaveTransferenciaItem(item.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.dataSource.data = updateDataSourceWithId(this.dataSource.data, res, res.id)
        }
        this.onVerificarConfirmados()
      })
  }

  onVerificarConfirmados() {
    let okPreparacion = true;
    let okTransporte = true;
    let okRecepcion = true;
    this.dataSource.data.find(i => {
      if (this.selectedTransferencia.etapa == EtapaTransferencia.PREPARACION_MERCADERIA && i.cantidadPreparacion == null && i.vencimientoPreparacion == null && i.motivoRechazoPreparacion == null) {
        okPreparacion = false;
      } else if (this.selectedTransferencia.etapa == EtapaTransferencia.TRANSPORTE_VERIFICACION && i.cantidadTransporte == null && i.vencimientoTransporte == null && i.motivoRechazoTransporte == null) {
        okTransporte = false;
      } else if (this.selectedTransferencia.etapa == EtapaTransferencia.RECEPCION_EN_VERIFICACION && i.cantidadRecepcion == null && i.vencimientoRecepcion == null && i.motivoRechazoRecepcion == null) {
        okRecepcion = false;
      }
    })
    this.isAllConfirmedPreparacion = okPreparacion;
    this.isAllConfirmedTransporte = okTransporte;
    this.isAllConfirmedRecepcion = okRecepcion;
  }

  onModificarCantidad(item) {
    this.onModificarItem(item, true, false, false)
  }
  onModificarVencimiento(item) {
    this.onModificarItem(item, false, true, false)

  }
  onRechazar(item) {
    this.onModificarItem(item, false, false, true)
  }

  onModificarItem(item, cantidad?: boolean, vencimiento?: boolean, rechazar?: boolean) {
    this.isDialogOpen = true;
    this.matDialog.open(ModificarItemDialogComponent, {
      data: {
        item,
        isCantidad: cantidad,
        isVencimiento: vencimiento,
        isRechazar: rechazar,
        etapa: this.selectedTransferencia?.etapa
      },
      width: '500px'
    }).afterClosed().subscribe(res => {
      this.isDialogOpen = false;
      if (res?.item != null) {
        this.transferenciaService.onSaveTransferenciaItem(res['item'].toInput())
          .pipe(untilDestroyed(this))
          .subscribe(res2 => {
            if (res2 != null) {
              this.dataSource.data = updateDataSourceWithId(this.dataSource.data, res2, res2.id)
            }
            this.onVerificarConfirmados()
          })
      }
    })
  }

  onAvanzarEtapa(etapa) {
    console.log(etapa)
    this.transferenciaService.onAvanzarEtapa(this.selectedTransferencia, etapa)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.selectedTransferencia.etapa = etapa;
          this.verificarEtapa()
          if (etapa == EtapaTransferencia.PRE_TRANSFERENCIA_ORIGEN) {
            this.selectedTransferencia.estado = TransferenciaEstado.EN_ORIGEN;
          } else if (etapa == EtapaTransferencia.TRANSPORTE_EN_CAMINO) {
            this.selectedTransferencia.estado = TransferenciaEstado.EN_TRANSITO;
          } else if (etapa == EtapaTransferencia.RECEPCION_EN_VERIFICACION) {
            this.selectedTransferencia.estado = TransferenciaEstado.EN_DESTINO;
          }
        }
      })
  }

  onSelectEstado(etapa: EtapaTransferencia) {
  }

  onSelectEtapa(e) {

  }

  onSolicitarModificarItem(item) { }
  onSolicitarRechazarItem(item) { }

  onQrClick() {
    let codigo: QrData = {
      'sucursalId': this.mainService.sucursalActual.id,
      'tipoEntidad': TipoEntidad.TRANSFERENCIA,
      'idOrigen': this.selectedTransferencia.id,
      'idCentral': this.selectedTransferencia.id,
      'componentToOpen': 'EditTransferenciaComponent'
    }
    this.isDialogOpen = true;
    this.matDialog.open(QrCodeComponent, {
      data: {
        codigo: codigo,
        nombre: 'Transferencia'
      }
    }).afterClosed().subscribe(res => {
      this.isDialogOpen = false;
    })
  }

  onOpenTimeLine() {
    this.isDialogOpen = true;
    this.matDialog.open(TransferenciaTimelineDialogComponent, {
      data: this.selectedTransferencia,
      width: '70vw'
    }).afterClosed().subscribe(res => {
      this.isDialogOpen = false;
    })
  }

  onSearchPorCodigo() {
    if (this.codigoControl.valid) {
      let text = this.codigoControl.value;
      this.isPesable = false;
      let peso;
      let codigo;
      if (text.length == 13 && text.substring(0, 2) == '20') {
        this.isPesable = true;
        codigo = text.substring(2, 7)
        peso = +text.substring(7, 12) / 1000
        text = codigo
        this.cantidadUnidadControl.enable();
        this.cantidadPresentacionControl.setValue(peso);
        this.cantidadUnidadControl.setValue(peso);
        this.cantidadPresentacionControl.disable();
        this.cantidadUnidadControl.disable();
        this.presentacionControl.disable();
      } else {
        this.cantidadPresentacionControl.enable();
        this.presentacionControl.enable();
      }
      this.productoService.onGetProductoPorCodigo(text).subscribe(res => {
        if (res != null) {
          this.selectedProducto = res;
          if (this.selectedProducto?.presentaciones?.length == 1) {
            this.presentacionControl.setValue(this.selectedProducto.presentaciones[0])
            if (!this.isPesable) {
              this.cantidadPresentacionControl.setValue(1)
              this.cantidadUnidadControl.setValue(this.presentacionControl.value?.cantidad)
            }
            if (this.selectedProducto.balanza) {
              this.vencimientoInput.nativeElement.select()
            } else {
              this.cantPresentacionInput.nativeElement.select()
            }
          } else if (this.selectedProducto?.presentaciones?.length > 1) {
            this.presentacionControl.setValue(this.selectedProducto.presentaciones[0])
            this.matSelect.focus()
            this.matSelect.open()
          } else {

          }
        } else {
          this.onAddItem(this.codigoControl.value)
        }
      })
    } else {
      this.onAddItem()
    }
  }
  onPresentacionSelect() {
    this.cantPresentacionInput.nativeElement.select()
    this.matSelect.close()
  }
  onCantidadPresentacionEnter() {
    this.vencimientoInput.nativeElement.select()
  }
  onCantidadUnidadEnter() {

  }

  onVencimientoEnter() {
    if (this.selectedTransferencia?.id != null) {
      this.cantidadPresentacionControl.enable();
      this.presentacionControl.enable();
      if (this.selectedProducto != null && this.presentacionControl.valid && this.cantidadPresentacionControl.valid && (this.vencimientoControl.value == null || this.vencimientoControl.value >= new Date())) {
        let item = new TransferenciaItem;
        item.activo = true;
        item.cantidadPreTransferencia = this.cantidadPresentacionControl.value;
        item.vencimientoPreTransferencia = this.vencimientoControl.value;
        item.transferencia = this.selectedTransferencia;
        item.presentacionPreTransferencia = this.presentacionControl.value;
        item.poseeVencimiento = this.vencimientoControl.value != null;
        this.onSaveTransferenciaItem(item);
        this.onClear();
      }
    } else {
      this.onSaveTransferencia().then(res => {
        this.cantidadPresentacionControl.enable();
        this.presentacionControl.enable();
        if (this.selectedProducto != null && this.presentacionControl.valid && this.cantidadPresentacionControl.valid && (this.vencimientoControl.value == null || this.vencimientoControl.value >= new Date())) {
          let item = new TransferenciaItem;
          item.activo = true;
          item.cantidadPreTransferencia = this.cantidadPresentacionControl.value;
          item.vencimientoPreTransferencia = this.vencimientoControl.value;
          item.transferencia = this.selectedTransferencia;
          item.presentacionPreTransferencia = this.presentacionControl.value;
          item.poseeVencimiento = this.vencimientoControl.value != null;
          this.onSaveTransferenciaItem(item);
          this.onClear();
        }
      })
    }

  }

  onCodigoFocus() {
    this.codigoInput.nativeElement.select()
  }

  onClear() {
    this.selectedProducto = null;
    this.presentacionControl.setValue(null);
    this.isPesable = false;
    this.cantidadPresentacionControl.setValue(1);
    this.cantidadUnidadControl.setValue(1);
    this.vencimientoControl.setValue(null);
    this.codigoControl.setValue(null);
    this.codigoInput.nativeElement.select();
  }

  nuevaTransferencia(){
    this.onClear()
    this.selectedTransferencia
  }
}
