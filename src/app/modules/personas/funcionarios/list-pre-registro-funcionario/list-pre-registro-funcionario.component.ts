import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { updateDataSource } from '../../../../commons/core/utils/numbersUtils';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabService } from '../../../../layouts/tab/tab.service';
import { EditInventarioComponent } from '../../../operaciones/inventario/edit-inventario/edit-inventario.component';
import { FuncionarioWizardComponent } from '../funcionario-wizard/funcionario-wizard.component';
import { FuncionarioService } from '../funcionario.service';
import { PreRegistroFuncionario } from '../pre-registro-funcionario.model';

@UntilDestroy()
@Component({
  selector: 'app-list-pre-registro-funcionario',
  templateUrl: './list-pre-registro-funcionario.component.html',
  styleUrls: ['./list-pre-registro-funcionario.component.scss'],
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
export class ListPreRegistroFuncionarioComponent implements OnInit {

  displayedColumns = ['id', 'nombre', 'apodo', 'sucursal', 'verificado', 'acciones']

  dataSource = new MatTableDataSource<PreRegistroFuncionario>([])
  page = 0;
  isLastPage = false;

  constructor(
    private funcionarioService: FuncionarioService,
    private matDialog: MatDialog,
    private tabService: TabService
  ) { }

  ngOnInit(): void {
    this.cargarDatos()
  }

  cargarDatos() {
    this.funcionarioService.onGetAllPreRegistroFuncionarios(this.page)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.dataSource.data = res;
      })
  }

  onFiltrar() {
    this.cargarDatos()
  }

  onVerFuncionario() {
  }

  onRegistrarFuncionario(item, i) {
    this.matDialog.open(FuncionarioWizardComponent, {
      data: {
        preRegistroFuncionario: item
      },
      width: '50%',
      height: '70%',
      disableClose: true
    }).afterClosed().subscribe(res => {
      if (res != null) {
        this.dataSource.data = updateDataSource(this.dataSource.data, res, i)
      }
    })
  }

  onEliminar() {

  }

  cargarMasDatos() {
    this.page++;
    this.funcionarioService.onGetAllPreRegistroFuncionarios(this.page)
    .pipe(untilDestroyed(this))
    .subscribe(res => {
      if(res.length == 0) this.isLastPage = true;
      this.dataSource.data = this.dataSource.data.concat(res)
    })
  }

}
