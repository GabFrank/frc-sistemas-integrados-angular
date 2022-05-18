import { MainService } from './../../../../main.service';
import { TabData, TabService } from './../../../../layouts/tab/tab.service';
import { CargandoDialogService } from './../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TransferenciaService } from './../transferencia.service';
import { MatTableDataSource } from '@angular/material/table';
import { Component, OnInit } from '@angular/core';
import { Transferencia } from '../transferencia.model';
import { updateDataSource } from '../../../../commons/core/utils/numbersUtils';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Tab } from '../../../../layouts/tab/tab.model';
import { EditTransferenciaComponent } from '../edit-transferencia/edit-transferencia.component';

@UntilDestroy()
@Component({
  selector: 'app-list-transferencia',
  templateUrl: './list-transferencia.component.html',
  styleUrls: ['./list-transferencia.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ListTransferenciaComponent implements OnInit {
  
  titulo = 'Lista de Transferencias'

  dataSource = new MatTableDataSource<Transferencia>([])

  selectedTransferencia: Transferencia;
  expandedTransferencia: Transferencia;

  displayedColumns = [
    'id',
    'origen',
    'destino',
    'estado',
    'etapa',
    'fecha',
    'tipo',
    'acciones']


  constructor(
    private transferenciaService: TransferenciaService, 
    private cargandoService: CargandoDialogService, 
    private tabService: TabService, 
    public mainService: MainService
    ) { }

  ngOnInit(): void {
    this.onGetTransferencias()
  }

  onGetTransferencias(){
    let hoy = new Date()
    let unaSemanaAtras = new Date()
    unaSemanaAtras.setDate(hoy.getDate()-29)
    this.transferenciaService.onGetTrasferenciasPorFecha(unaSemanaAtras, hoy)
    .pipe(untilDestroyed(this))
    .subscribe(res => {
      if(res!=null){
        this.dataSource.data = res;
        console.log(res)
      }
    })
  }

  onRowClick(transferencia: Transferencia, index){
    this.expandedTransferencia = transferencia;
    this.cargandoService.openDialog()
    if(transferencia?.transferenciaItemList==null){
      this.transferenciaService.onGetTransferencia(transferencia.id)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.cargandoService.closeDialog()
        if(res!=null){
          this.selectedTransferencia = res;
          console.log(res)
          this.dataSource.data = updateDataSource(this.dataSource.data, res, index)
        }
      })
    } else {
      this.cargandoService.closeDialog()
    }
  }

  onEdit(transferencia: Transferencia, index){
    this.tabService.addTab(new Tab(EditTransferenciaComponent, 'Transferencia '+transferencia.id, new TabData(transferencia.id), ListTransferenciaComponent))
  }

  onDelete(transferencia: Transferencia, index){
    this.transferenciaService.onDeleteTransferencia(transferencia.id)
    .pipe(untilDestroyed(this))
    .subscribe(res => {
      if(res){
        this.dataSource.data = updateDataSource(this.dataSource.data, null, index)
      }
    })
  }
  
  onAdd(){
    this.tabService.addTab(new Tab(EditTransferenciaComponent, 'Nueva Transferencia', null, ListTransferenciaComponent))
  }
  onFilter(){}
}
