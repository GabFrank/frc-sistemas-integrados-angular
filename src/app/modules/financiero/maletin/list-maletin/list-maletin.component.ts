import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { updateDataSource } from '../../../../commons/core/utils/numbersUtils';
import { WindowInfoService } from '../../../../shared/services/window-info.service';
import { AdicionarMaletinDialogComponent } from '../adicionar-maletin-dialog/adicionar-maletin-dialog.component';
import { Maletin } from '../maletin.model';
import { MaletinService } from '../maletin.service';


import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-maletin',
  templateUrl: './list-maletin.component.html',
  styleUrls: ['./list-maletin.component.scss'],
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
export class ListMaletinComponent implements OnInit {

  headerHeight;
  tableHeight;
  containerHeight;
  displayedColumns: string[] = ['id', 'descripcion', 'activo', 'creadoEn', 'usuario', 'acciones'];
  expandedMaletin: Maletin;
  selectedMaletin: Maletin;

  dataSource = new MatTableDataSource<Maletin>(null);

  constructor(
    private maletinService: MaletinService,
    public windowInfoService: WindowInfoService,
    private matDialog: MatDialog
  ) { 
    this.headerHeight = windowInfoService.innerTabHeight * 0.2;
    this.tableHeight = windowInfoService.innerTabHeight * 0.8;
    this.containerHeight = windowInfoService.innerTabHeight;
  }

  ngOnInit(): void {
    this.maletinService.onGetAll().subscribe(res => {
      if(res!=null){
        this.dataSource.data = res;
      }
    }).unsubscribe()
  }

  rowSelectedEvent(e){
  }

  onFiltrar(){

  }

  onAdd(maletin?: Maletin, index?){
    this.matDialog.open(AdicionarMaletinDialogComponent, {
      data: {
        maletin
      },
      disableClose: true,
      width: '50%',
      autoFocus: true,
      restoreFocus: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if(res!=null){
        if(maletin==null){
          this.dataSource.data = updateDataSource(this.dataSource.data, res);
        } else {
          this.dataSource.data = updateDataSource(this.dataSource.data, res, index);
        }
      }
    })
  }
}
