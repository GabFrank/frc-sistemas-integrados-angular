import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { WindowInfoService } from '../../../shared/services/window-info.service';
import { Maletin } from './maletin.model';
import { MaletinService } from './maletin.service';

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-maletin',
  templateUrl: './maletin.component.html',
  styleUrls: ['./maletin.component.scss']
})
export class MaletinComponent implements OnInit {

  headerHeight;
  tableHeight;
  containerHeight;
  displayedColumns: string[] = ['id', 'descripcion', 'activo', 'creadoEn', 'usuario'];
  expandedMaletin: Maletin;
  selectedMaletin: Maletin;

  maletinDataSource = new MatTableDataSource<Maletin>(null);

  constructor(
    private maletinService: MaletinService,
    public windowInfoService: WindowInfoService,
  ) { 
    this.headerHeight = windowInfoService.innerTabHeight * 0.2;
    this.tableHeight = windowInfoService.innerTabHeight * 0.8;
    this.containerHeight = windowInfoService.innerTabHeight;
  }

  ngOnInit(): void {
    this.maletinService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if(res!=null){
        console.log(res)
        this.maletinDataSource.data = res;
      }
    })
  }

  rowSelectedEvent(e){
  }

  onFiltrar(){

  }

  onAdd(maletin?: Maletin, index?){
    // this.matDialog.open(AdicionarFuncionarioDialogComponent, {
    //   data: {
    //     funcionario
    //   },
    //   disableClose: true,
    //   width: '40%',
    //   autoFocus: true,
    //   restoreFocus: true
    // }).afterClosed().subscribe(res => {
    //   if(res!=null){
    //     if(funcionario==null){
    //       this.dataSource.data = updateDataSource(this.dataSource.data, res);
    //     } else {
    //       this.dataSource.data = updateDataSource(this.dataSource.data, res, index);
    //     }
    //   }
    // })
  }

}
