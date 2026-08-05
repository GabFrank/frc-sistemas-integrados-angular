import { Component, Input, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { EstadoRetiro, Retiro } from '../retiro.model';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { RetiroService } from '../retiro.service';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { FormControl, FormGroup } from '@angular/forms';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { PdvCaja } from '../../pdv/caja/caja.model';
import { TabData, TabService } from '../../../../layouts/tab/tab.service';
import { Tab } from '../../../../layouts/tab/tab.model';
import { ListVentaComponent } from '../../../operaciones/venta/list-venta/list-venta.component';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from '../../../../app.component';
import { PageEvent } from '@angular/material/paginator';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { updateDataSource } from '../../../../commons/core/utils/numbersUtils';

@UntilDestroy({checkProperties: true})
@Component({
  selector: 'app-list-retiro',
  templateUrl: './list-retiro.component.html',
  styleUrls: ['./list-retiro.component.scss'],
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition(
        "expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
      ),
    ]),
  ],
})
export class ListRetiroComponent implements OnInit {

  @Input()
  data: Tab;

  dataSource = new MatTableDataSource<Retiro>([])
  selectedRetiro: Retiro;
  expandedRetiro: Retiro;
  isLastPage = true;
  isSearching = false;
  displayedColumns = [
    'id',
    'sucursal',
    'cajaSalida',
    'retiroGs',
    'retiroRs',
    'retiroDs',
    'responsable',
    'creadoEn',
    'usuario',
    'estado',
    'acciones'
  ]
  // Se resuelve en ngOnInit y no en el template: llamar roles.includes(...) desde el
  // HTML lo re-evalua en cada ciclo de change detection.
  esAdmin = false;
  pageIndex = 0;
  pageSize = 15;

  sucursalList: Sucursal[]
  sucOrigenControl = new FormControl()
  idCajaControl = new FormControl()
  idRetiroControl = new FormControl()
  formGroup : FormGroup;
  selectedPageInfo: PageInfo<Retiro>;
  
  constructor(
    private retiroService: RetiroService,
    private sucursalService: SucursalService,
    private tabService: TabService,
    private mainService: MainService,
    private dialogoService: DialogosService,
    private notificacionService: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    this.esAdmin = this.mainService.usuarioActual?.roles?.includes(ROLES.ADMIN) ?? false;

    this.formGroup = new FormGroup({
      idCajaControl: this.idCajaControl,
      idRetiroControl: this.idRetiroControl,
      sucursalControl: this.sucOrigenControl
    })

    this.sucursalService.onGetAllSucursales(true).subscribe((res) => {
      this.sucursalList = res.filter(s => s.id != 0)
      this.sucOrigenControl.setValue(this.sucursalList.find(s => s.id == this.data?.tabData?.data?.sucursal?.id))
      this.idCajaControl.setValue(this.data?.tabData?.data?.caja?.id);
      this.onFiltrar();
    })
  }

  onFiltrar() {
    this.retiroService.onFilterRetiro(this.idRetiroControl.value, this.idCajaControl.value, this.sucOrigenControl.value?.id, null, null, this.pageIndex, this.pageSize).subscribe(res => {      
      if(res!=null){
        this.selectedPageInfo = res;
        this.dataSource.data = this.selectedPageInfo.getContent;
      }
    })
  }


  resetFiltro() {
    this.sucOrigenControl.setValue(null)
    this.idCajaControl.setValue(null)
    this.idRetiroControl.setValue(null)
    this.dataSource.data = []
  }

  onIrACaja(cajaSalida: PdvCaja){
    this.tabService.addTab(new Tab(ListVentaComponent, 'Ventas de la caja ' + cajaSalida.id, new TabData(null, cajaSalida), ListRetiroComponent))
  }

  onCancelarRetiro(retiro: Retiro, index: number) {
    const estabaCancelado = retiro.estado == EstadoRetiro.CANCELADO;
    const mensaje = estabaCancelado
      ? 'Realmente desea habilitar este retiro?'
      : 'Realmente desea cancelar este retiro?';
    this.dialogoService.confirm('Atención!!', mensaje).subscribe((res) => {
      if (res) {
        const sucId = retiro.sucursalId ?? retiro.cajaSalida?.sucursalId;
        this.retiroService.onCancelarRetiro(retiro.id, sucId).subscribe((res1) => {
          if (res1) {
            // El estado se actualiza en memoria, sin refetch, igual que en la
            // lista de ventas.
            retiro.estado = estabaCancelado
              ? EstadoRetiro.CONCLUIDO
              : EstadoRetiro.CANCELADO;
            this.dataSource.data = updateDataSource(this.dataSource.data, retiro, index);
            this.notificacionService.openSucess(
              estabaCancelado ? 'Retiro habilitado con éxito' : 'Retiro cancelado con éxito'
            );
          } else {
            this.notificacionService.openAlgoSalioMal(
              estabaCancelado
                ? 'Ups! No se pudo habilitar el retiro. '
                : 'Ups! No se pudo cancelar el retiro. '
            );
          }
        });
      }
    });
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }

}
