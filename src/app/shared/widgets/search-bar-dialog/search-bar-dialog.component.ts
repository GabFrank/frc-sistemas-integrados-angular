import { SearchBarService, SearchData, SearchDataResult } from './search-bar.service';
import { FormControl } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MainService } from '../../../main.service';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';

@Component({
  selector: 'app-search-bar-dialog',
  templateUrl: './search-bar-dialog.component.html',
  styleUrls: ['./search-bar-dialog.component.scss']
})
export class SearchBarDialogComponent implements OnInit {

  buscarControl = new FormControl('')
  searchDataList: SearchDataResult;

  constructor(
    private searchBarService: SearchBarService,
    private matDialogRef: MatDialogRef<SearchBarDialogComponent>,
    private mainService: MainService,
    private notificacionService: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
  }

  async onBuscar() {
    console.log('buscando')
    this.searchDataList = await this.searchBarService.onSearch(this.buscarControl.value)
  }

  onClick(item: SearchData) {
    console.log(item);
    console.log(this.mainService.usuarioActual.roles);
    
    if (item?.role == null) {
      this.searchBarService.openTab(item)
      this.matDialogRef.close()
    } else if (this.mainService.usuarioActual.roles.includes(item?.role)) {
      this.searchBarService.openTab(item)
      this.matDialogRef.close()
    } else {
      this.notificacionService.openWarn('Ups! No tienes el permiso para acceder.')
    }

  }

}
