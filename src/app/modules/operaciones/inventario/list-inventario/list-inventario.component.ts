import { UntilDestroy } from '@ngneat/until-destroy';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { untilDestroyed } from '@ngneat/until-destroy';
import { updateDataSource } from '../../../../commons/core/utils/numbersUtils';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabService, TabData } from '../../../../layouts/tab/tab.service';
import { MainService } from '../../../../main.service';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { EditInventarioComponent } from '../edit-inventario/edit-inventario.component';
import { Inventario } from '../inventario.model';
import { InventarioService } from '../inventario.service';

@UntilDestroy()
@Component({
  selector: 'app-list-inventario',
  templateUrl: './list-inventario.component.html',
  styleUrls: ['./list-inventario.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ListInventarioComponent implements OnInit {

  titulo = 'Lista de Inventarios'

  dataSource = new MatTableDataSource<Inventario>([])

  selectedInventario: Inventario;
  expandedInventario: Inventario;

  displayedColumns = [
    'id',
    'fechaInicio',
    'fechaFin',
    'tipo',
    'estado',
    'responsable',
    'acciones']


  constructor(
    private tabService: TabService,
    private inventarioService: InventarioService,
    private cargandoService: CargandoDialogService,
    public mainService: MainService
  ) { }

  ngOnInit(): void {
    this.onGetInventarios()
  }

  onGetInventarios() {
    this.inventarioService.onGetInventarioUsuario()
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.dataSource.data = res;
        }
      })
  }

  onRowClick(inventario: Inventario, index) {
    this.expandedInventario = inventario;
    this.cargandoService.openDialog()
    if (inventario?.inventarioProductoList == null) {
      this.inventarioService.onGetInventario(inventario.id)
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          this.cargandoService.closeDialog()
          if (res != null) {
            this.selectedInventario = res;
            this.dataSource.data = updateDataSource(this.dataSource.data, res, index)
          }
        })
    } else {
      this.cargandoService.closeDialog()
    }
  }

  onVer(inventario: Inventario) {
    this.tabService.addTab(new Tab(EditInventarioComponent, 'Inventario ' + inventario.id, new TabData(inventario.id), ListInventarioComponent))
  }

  onDelete(inventario: Inventario, index) {
    this.inventarioService.onDeleteInventario(inventario.id)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.dataSource.data = updateDataSource(this.dataSource.data, null, index)
        }
      })
  }

  onAdd() {
    this.tabService.addTab(new Tab(EditInventarioComponent, 'Nueva Inventario', null, ListInventarioComponent))
  }
  onFilter() { }


}
