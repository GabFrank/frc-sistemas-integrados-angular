import { MainService } from './../../../../main.service';
import { TabData, TabService } from './../../../../layouts/tab/tab.service';
import { CargandoDialogService } from './../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TransferenciaService } from './../transferencia.service';
import { MatTableDataSource } from '@angular/material/table';
import { Component, OnInit } from '@angular/core';
import { EtapaTransferencia, Transferencia, TransferenciaEstado } from '../transferencia.model';
import { updateDataSource } from '../../../../commons/core/utils/numbersUtils';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Tab } from '../../../../layouts/tab/tab.model';
import { EditTransferenciaComponent } from '../edit-transferencia/edit-transferencia.component';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { FormControl, FormGroup } from '@angular/forms';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { enumToArray } from '../../../../commons/core/utils/enumUtils';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';

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

  idControl = new FormControl()
  sucOrigenControl = new FormControl()
  sucDestinoControl = new FormControl()
  estadoControl = new FormControl()
  etapaControl = new FormControl()
  fechaInicioControl = new FormControl()
  fechaFinControl = new FormControl()
  fechaFormGroup: FormGroup;
  sucursalList: Sucursal[]
  estadoList = Object.values(TransferenciaEstado)
  etapaList = Object.values(EtapaTransferencia)
  today = new Date()

  displayedColumns = [
    'id',
    'origen',
    'destino',
    'estado',
    'etapa',
    'fecha',
    'tipo',
    'acciones'
  ]

  constructor(
    private transferenciaService: TransferenciaService,
    private cargandoService: CargandoDialogService,
    private tabService: TabService,
    public mainService: MainService,
    private sucursalService: SucursalService
  ) { }

  ngOnInit(): void {
    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinControl
    })
    this.onGetTransferencias()
    this.sucursalService.onGetAllSucursales().subscribe(res => {
      this.sucursalList = res.filter(s => s.id != 0)
    })
  }

  onGetTransferencias() {
    let unaSemanaAtras = new Date()
    unaSemanaAtras.setDate(this.today.getDate() - 7)
    this.fechaInicioControl.setValue(unaSemanaAtras);
    this.fechaFinControl.setValue(this.today);
    this.onFilter()
  }

  onFilter() {
    if (this.fechaFinControl.value == null) this.fechaFinControl.setValue(this.today)
    let unaSemanaAtras = new Date()
    unaSemanaAtras.setDate(this.fechaFinControl.value.getDate() - 7)
    if (this.fechaInicioControl.value == null) this.fechaInicioControl.setValue(unaSemanaAtras);
    if (this.idControl.value == null) {
      this.transferenciaService.onGetTransferenciasWithFilters(
        this.sucOrigenControl.value?.id,
        this.sucDestinoControl.value?.id,
        this.estadoControl.value,
        null,
        this.etapaControl.value,
        null,
        null,
        dateToString(this.fechaInicioControl.value),
        dateToString(this.fechaFinControl.value))
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          if (res != null) {
            this.dataSource.data = res;
          }
        })
    } else {
      this.transferenciaService.onGetTransferencia(this.idControl.value).subscribe(res => {
        if (res != null) {
          this.dataSource.data = [res]
        }
      })
    }

  }

  onResetFiltro() {
    this.idControl.setValue(null)
    this.sucOrigenControl.setValue(null)
    this.sucDestinoControl.setValue(null)
    this.estadoControl.setValue(null)
    this.etapaControl.setValue(null)
    let unaSemanaAtras = new Date()
    unaSemanaAtras.setDate(this.today.getDate() - 7)
    this.fechaInicioControl.setValue(unaSemanaAtras);
    this.fechaFinControl.setValue(this.today);
  }

  onRowClick(transferencia: Transferencia, index) {
    this.expandedTransferencia = transferencia;
    this.cargandoService.openDialog()
    if (transferencia?.transferenciaItemList == null) {
      this.transferenciaService.onGetTransferencia(transferencia.id)
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          this.cargandoService.closeDialog()
          if (res != null) {
            this.selectedTransferencia = res;
            console.log(res)
            this.dataSource.data = updateDataSource(this.dataSource.data, res, index)
          }
        })
    } else {
      this.cargandoService.closeDialog()
    }
  }

  onEdit(transferencia: Transferencia, index) {
    this.tabService.addTab(new Tab(EditTransferenciaComponent, 'Transferencia ' + transferencia.id, new TabData(transferencia.id), ListTransferenciaComponent))
  }

  onDelete(transferencia: Transferencia, index) {
    this.transferenciaService.onDeleteTransferencia(transferencia.id)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.dataSource.data = updateDataSource(this.dataSource.data, null, index)
        }
      })
  }

  onAdd() {
    this.tabService.addTab(new Tab(EditTransferenciaComponent, 'Nueva Transferencia', null, ListTransferenciaComponent))
  }

}
