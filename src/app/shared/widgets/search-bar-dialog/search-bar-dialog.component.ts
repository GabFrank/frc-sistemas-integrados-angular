import { SearchBarService, SearchData, SearchDataResult } from './search-bar.service';
import { FormControl } from '@angular/forms';
import { Component, Injector, OnInit } from '@angular/core';
import { MainService } from '../../../main.service';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-search-bar-dialog',
  templateUrl: './search-bar-dialog.component.html',
  styleUrls: ['./search-bar-dialog.component.scss']
})
export class SearchBarDialogComponent implements OnInit {

  buscarControl = new FormControl('')
  searchDataList: SearchDataResult;
  private mainService: MainService;

  constructor(
    private searchBarService: SearchBarService,
    private matDialogRef: MatDialogRef<SearchBarDialogComponent>,
    private injector: Injector,
    private notificacionService: NotificacionSnackbarService
  ) {
    setTimeout(() => this.mainService = injector.get(MainService));
  }

  ngOnInit(): void {
  }

  async onBuscar() {
    this.searchDataList = await this.searchBarService.onSearch(this.buscarControl.value)
  }

  onClick(item: SearchData) {


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
