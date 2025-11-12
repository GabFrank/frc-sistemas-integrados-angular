import { SearchBarService, SearchData, SearchDataResult } from './search-bar.service';
import { FormControl } from '@angular/forms';
import { Component, Injector, OnInit } from '@angular/core';
import { MainService } from '../../../main.service';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { MatDialogRef } from '@angular/material/dialog';
import { ROLES } from '../../../modules/personas/roles/roles.enum';

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

  hasPermissionToAccess(item: SearchData): boolean {
    const userRoles = this.mainService.usuarioActual?.roles || [];
    
    // Si el usuario es ADMIN, puede acceder a todo
    if (userRoles.includes(ROLES.ADMIN)) {
      return true;
    }
    
    if (item.visibilityRoles && item.visibilityRoles.length > 0) {
      return userRoles.some(role => item.visibilityRoles.includes(role));
    }
    
    // Mantener compatibilidad con la propiedad role legacy
    if (item.role) {
      return userRoles.includes(item.role);
    }
    
    // Si no tiene roles especificados, denegar acceso por defecto (seguridad)
    return false;
  }

  onClick(item: SearchData) {
    if (this.hasPermissionToAccess(item)) {
      this.searchBarService.openTab(item)
      this.matDialogRef.close()
    } else {
      this.notificacionService.openWarn('Ups! No tienes el permiso para acceder.')
    }
  }

}
