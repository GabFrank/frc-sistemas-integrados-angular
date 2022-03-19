import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { updateDataSource } from '../../../../commons/core/utils/numbersUtils';
import { WindowInfoService } from '../../../../shared/services/window-info.service';
import { PersonaDetalleDialogoComponent } from '../../persona/persona-detalle-dialogo/persona-detalle-dialogo.component';
import { PersonaService } from '../../persona/persona.service';
import { AdicionarFuncionarioDialogComponent } from '../adicionar-funcionario-dialog/adicionar-funcionario-dialog.component';
import { Funcionario } from '../funcionario.model';
import { FuncionarioService } from '../funcionario.service';


import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-funcioario',
  templateUrl: './list-funcioario.component.html',
  styleUrls: ['./list-funcioario.component.css'],
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
export class ListFuncioarioComponent implements OnInit {

  headerHeight;
  tableHeight;
  containerHeight;
  dataSource = new MatTableDataSource<Funcionario>(null);
  expandedFuncionario: Funcionario;
  displayedColumns: string[] = ['id', 'nombre', 'sucursal', 'cargo', 'supervisadoPor', 'telefono', 'nickname', 'acciones'];
  constructor(
    public service: FuncionarioService,
    public windowInfoService: WindowInfoService,
    private matDialog: MatDialog
  ) {
    this.headerHeight = windowInfoService.innerTabHeight * 0.2;
    this.tableHeight = windowInfoService.innerTabHeight * 0.8;
    this.containerHeight = windowInfoService.innerTabHeight;
    console.log(this.headerHeight, this.tableHeight, this.containerHeight)
   }

  ngOnInit(): void {
    console.log(this.windowInfoService.innerHeight*0.9)
    this.service.onGetAllFuncionarios().pipe(untilDestroyed(this)).subscribe(res => {
      console.log(res)
      this.dataSource.data = res;
    })
  }

  rowSelectedEvent(e){
  }

  onFiltrar(){

  }

  onAddFuncionario(funcionario?: Funcionario, index?){
    this.matDialog.open(AdicionarFuncionarioDialogComponent, {
      data: {
        funcionario
      },
      disableClose: true,
      width: '40%',
      autoFocus: true,
      restoreFocus: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if(res!=null){
        if(funcionario==null){
          this.dataSource.data = updateDataSource(this.dataSource.data, res);
        } else {
          this.dataSource.data = updateDataSource(this.dataSource.data, res, index);
        }
      }
    })
  }

}
