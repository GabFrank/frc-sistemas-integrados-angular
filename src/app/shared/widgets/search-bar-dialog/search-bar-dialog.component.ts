import { SearchBarService, SearchData, SearchDataResult } from './search-bar.service';
import { FormControl } from '@angular/forms';
import { Component, Injector, OnInit } from '@angular/core';
import { MainService } from '../../../main.service';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { MatDialogRef } from '@angular/material/dialog';
import { ROLES } from '../../../modules/personas/roles/roles.enum';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BuscadorTextoService } from '../../services/buscador-texto.service';
import { filter, switchMap, tap } from 'rxjs/operators';
import { switchMapSinCortar } from '../../../commons/core/utils/rxjsUtils';

@UntilDestroy()
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
    private notificacionService: NotificacionSnackbarService,
    private buscadorTextoService: BuscadorTextoService
  ) {}

  ngOnInit(): void {
    this.mainService = this.injector.get(MainService);

    this.buscadorTextoService
      .observarTexto(this.buscarControl, () => false)
      .pipe(
        tap(() => this.actualizarMenu()),
        filter(() => !!this.buscarControl.value?.trim()),
        // Si una búsqueda falla, el buscador sigue escuchando lo que se tipea (#390).
        switchMapSinCortar(() =>
          this.searchBarService.onSearch(this.buscarControl.value ?? '')
        ),
        untilDestroyed(this)
      )
      .subscribe((result) => {
        this.searchDataList = {
          componentes: this.componentesPermitidos(this.buscarControl.value ?? ''),
          productos: result.productos ?? [],
        };
      });

    this.buscarControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((texto) => {
        if (!texto?.trim()) {
          this.searchDataList = { componentes: [], productos: [] };
        } else {
          this.actualizarMenu();
        }
      });
  }

  private actualizarMenu(): void {
    const texto = this.buscarControl.value ?? '';
    const componentes = this.componentesPermitidos(texto);
    this.searchDataList = {
      componentes,
      productos: this.searchDataList?.productos ?? [],
    };
  }

  // No ofrecer lo que el usuario no puede abrir
  private componentesPermitidos(texto: string): SearchData[] {
    return this.searchBarService
      .filtrarComponentes(texto)
      .filter((item) => this.hasPermissionToAccess(item));
  }

  hasPermissionToAccess(item: SearchData): boolean {
    // Las pantallas del menu ya llegan filtradas por visibilidad, y el menu vuelve a validar
    // el rol al abrirlas.
    if (item.action) {
      return true;
    }

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
