import { CargandoDialogService } from './../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { TransferenciaService } from './../transferencia.service';
import { PdvSearchProductoData, PdvSearchProductoDialogComponent, PdvSearchProductoResponseData } from '../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PresentacionService } from '../../../productos/presentacion/presentacion.service';
import { MatTableDataSource } from '@angular/material/table';
import { MainService } from '../../../../main.service';
import { Presentacion } from '../../../productos/presentacion/presentacion.model';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SeleccionarSucursalDialogComponent } from '../seleccionar-sucursal-dialog/seleccionar-sucursal-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Component, Input, OnInit } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CreateItemDialogComponent } from '../create-item-dialog/create-item-dialog.component';
import { updateDataSource, updateDataSourceWithId } from '../../../../commons/core/utils/numbersUtils';
import { TipoTransferencia, Transferencia, TransferenciaEstado, TransferenciaItem } from '../transferencia.model';
import { toObjectInput } from '../../../../commons/core/utils/objectUtils';
import { Tab } from '../../../../layouts/tab/tab.model';



@UntilDestroy()
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

  @Input()
  data: Tab;

  columnsToDisplay = ['producto', 'codigo', 'presentacion', 'cantidad', 'costo', 'precio', 'vencimiento', 'menu']

  selectedSucursalOrigen: Sucursal;

  selectedSucursalDestino: Sucursal;

  selectedTransferencia = new Transferencia;

  dataSource = new MatTableDataSource<TransferenciaItem>([])

  expandedElement: TransferenciaItem;

  autosaveControl = new FormControl(true)

  constructor(private matDialog: MatDialog, 
    public mainService: MainService, 
    private presentacionService: PresentacionService,
    private transferenciaService: TransferenciaService,
    private cargandoService: CargandoDialogService) { }

  ngOnInit(): void {
    this.selectedTransferencia.usuario = this.mainService.usuarioActual;
    this.selectedTransferencia.tipo = TipoTransferencia.MANUAL;
    this.selectedTransferencia.estado = TransferenciaEstado.ABIERTA;
    
    if(this.data.tabData!=null){
      this.cargarDatos()
    } else {
      setTimeout(() => {
        this.matDialog.open(SeleccionarSucursalDialogComponent, {
          width: '80%',
          height: '70%',
          disableClose: false
        }).afterClosed().subscribe(async res => {
          if (res != null) {
            this.selectedTransferencia.sucursalOrigen = res['sucursalOrigen']
            this.selectedTransferencia.sucursalDestino = res['sucursalDestino']
          }
        })
      }, 1000);
    }
  }

  cargarDatos(){
    let id = this.data.tabData['id'];
    if(id!=null){
      this.transferenciaService.onGetTransferencia(id)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if(res!=null){
          this.selectedTransferencia = res;
          console.log(this.selectedTransferencia.transferenciaItemList)
          this.dataSource.data = this.selectedTransferencia?.transferenciaItemList;
        }
      })
    }
    
  }

  onAddItem() {
    let data: PdvSearchProductoData = {
      texto: null,
      cantidad: 1,
      mostrarOpciones: false,
      mostrarStock: true
    }
    this.matDialog.open(PdvSearchProductoDialogComponent, {
      data: data,
      height: '80%',
    }).afterClosed().subscribe(res => {
      let response: PdvSearchProductoResponseData = res;
      if(response.presentacion!=null){
        this.createItem(response.presentacion)
      }
    })
  }

  createItem(presentacion: Presentacion, item?){
    this.matDialog.open(CreateItemDialogComponent, {
      data: {
        item,
        presentacion
      },
      width: '40%',
      disableClose: true
    }).afterClosed().subscribe(async res => {
      if(res!=null){
        if(this.selectedTransferencia?.id == null){
          this.onSaveTransferencia().then(()=>{
            this.onSaveTransferenciaItem(res['item'])            
          })
        } else {
          this.onSaveTransferenciaItem(res['item'])            
        }
      }
    })
  }

  onSaveTransferencia(): Promise<any>{
    this.cargandoService.openDialog()
    return new Promise((resolve, reject)=>{
      this.transferenciaService.onSaveTransferencia(this.selectedTransferencia.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.cargandoService.closeDialog()
        if(res!=null){
          this.selectedTransferencia = res;
          resolve(res)
        } else {
          reject()
        }
      })
    })
  }

  onSaveTransferenciaItem(item: TransferenciaItem){
    let auxItem = new TransferenciaItem;
    Object.assign(auxItem, item)
    auxItem.transferencia = this.selectedTransferencia;
    this.cargandoService.openDialog()
    this.transferenciaService.onSaveTransferenciaItem(auxItem.toInput())
    .pipe(untilDestroyed(this))
    .subscribe(res => {
      this.cargandoService.closeDialog()
      if(res!=null){
        this.dataSource.data = updateDataSourceWithId(this.dataSource.data, res, res?.id)
      }
    })
  }

  onDeleteItem(item: TransferenciaItem){
    this.transferenciaService.onDeleteTransferenciaItem(item.id)
  }

  onEditItem(item: TransferenciaItem){
    this.createItem(null, item)
  }

  onFinalizar() { 
    this.transferenciaService.onFinalizar(this.selectedTransferencia)
    .pipe()
    .subscribe(res => {
      if(res){
        this.selectedTransferencia.estado = TransferenciaEstado.EN_DESTINO;
      }
    })
  }


}
