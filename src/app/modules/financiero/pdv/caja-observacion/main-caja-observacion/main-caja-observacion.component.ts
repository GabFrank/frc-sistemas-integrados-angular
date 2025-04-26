import { Component, ElementRef, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { MatTableDataSource } from '@angular/material/table';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CajaSubCategoriaObservacion } from '../../caja-subcategoria-observacion/caja-subcategoria-observacion.model';
import { CajaCategoriaObservacion } from '../../caja-categoria-observacion/caja-categoria-observacion.model';
import { CajaMotivoObservacion } from '../../caja-motivo-observacion/caja-motivo-observacion.model';
import { MainService } from '../../../../../main.service';
import { DialogosService } from '../../../../../shared/components/dialogos/dialogos.service';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { CajaCategoriaObservacionService } from '../../caja-categoria-observacion/caja-categoria-observacion.service';
import { CajaSubCategoriaObservacionService } from '../../caja-subcategoria-observacion/caja-subcategoria-observacion.service';
import { CajaMotivoObservacionService } from '../../caja-motivo-observacion/caja-motivo-observacion.service';
import { TabService } from '../../../../../layouts/tab/tab.service';
import { Tab } from '../../../../../layouts/tab/tab.model';
import { AddCajaCategoriaObsDialogComponent } from '../../caja-categoria-observacion/add-caja-categoria-obs-dialog/add-caja-categoria-obs-dialog.component';
import { AddCajaSubCategoriaObsDialogComponent } from '../../caja-subcategoria-observacion/add-caja-subcategoria-obs-dialog/add-caja-subcategoria-obs-dialog.component';
import { updateDataSource } from '../../../../../commons/core/utils/numbersUtils';
import { AddCajaMotivoObsDialogComponent } from '../../caja-motivo-observacion/add-caja-motivo-obs-dialog/add-caja-motivo-obs-dialog.component';

export interface CajaCategoriaObservacionData {
  id: number;
  descripcion: string;
  activo: boolean;
}

export interface CajaSubCategoriaObservacionData {
  id: number;
  descripcion: string;
  activo: boolean;
  cajaCategoriaId: number;
}

export interface CajaMotivoObservacionData {
  id: number;
  descripcion: string;
  cajaSubCategoriaObs: CajaSubCategoriaObservacion;
  activo: boolean;
}
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-main-caja-observacion',
  templateUrl: './main-caja-observacion.component.html',
  styleUrls: ['./main-caja-observacion.component.scss']
})
export class MainCajaObservacionComponent implements OnInit, OnDestroy {
  @Input() data;
  @ViewChild('filtroCajaCategoriaObsInput') filtroCajaCategoriaObsInput: ElementRef;
  @ViewChild('filtroCajaSubCategoriaObsInput') filtroCajaSubCategoriaObsInput: ElementRef;
  @ViewChild('filtroCajaMotivoObsInput') filtroCajaMotivoObsInput: ElementRef;
  @ViewChild("stepper", { static: false }) stepper: MatStepper;

  cajaCategoriaObs: CajaCategoriaObservacion;
  cajaCategoriaObsList: CajaCategoriaObservacion[];
  cajaSubCategoriaObsList: CajaSubCategoriaObservacion[] = [];
  cajaMotivoObsList: CajaMotivoObservacion[];
  selectedCajaCategoriaObs: CajaCategoriaObservacion = null;
  selectedCajaSubCategoriaObs: CajaSubCategoriaObservacion;
  selectedCajaMotivoObs: CajaMotivoObservacion;
  cajaCategoriaObsDataSource = new MatTableDataSource<CajaCategoriaObservacion>([]);
  cajaSubCategoriaObsDataSource = new MatTableDataSource<CajaSubCategoriaObservacion>([]);
  cajaMotivoObsDataSource = new MatTableDataSource<CajaMotivoObservacion>([]);
  cajaCategoriaColumnsToDisplay = ['id', 'descripcion', 'activo', 'accion'];
  cajaSubCategoriaColumnsToDisplay = ['id', 'descripcion', 'activo', 'accion'];
  cajaMotivoColumnsToDisplay = ['id', 'descripcion', 'activo', 'accion'];
  filtroCajaCategoriaOpen = false;
  filtroCajaCategoriaControl = new FormControl("");
  filtroCajaSubCategoriaControl = new FormControl("");
  filtroCajaSubCategoriaOpen = false;
  filtroCajaMotivoControl = new FormControl("");
  filtroCajaMotivoOpen = false;
  formGroup: FormGroup;
  cajaCategoriaObsControl: FormGroup;
  cajaSubCategoriaObsControl = new FormControl(null, Validators.required) ;
  cajaMotivoObsControl = new FormControl(null, Validators.required) ;

  constructor(
    private mainService: MainService,
    private matDialog: MatDialog,
    private dialogService: DialogosService,
    private notificationBar: NotificacionSnackbarService,
    private cajaCategoriaObsService: CajaCategoriaObservacionService,
    private cajaSubCategoriaObsService: CajaSubCategoriaObservacionService,
    private cajaMotivoObsService: CajaMotivoObservacionService,
    private tabService: TabService,
  ) {
  }

  ngOnInit(): void {

    this.loadData();

    this.cajaCategoriaObsDataSource.filterPredicate = (data: CajaCategoriaObservacion, filter: string) => {
      return data.descripcion.toUpperCase().includes(filter);
    };
    this.cajaSubCategoriaObsDataSource.filterPredicate = (data: CajaSubCategoriaObservacion, filter: string) => {
      return data.descripcion.toUpperCase().includes(filter);
    };
    this.cajaMotivoObsDataSource.filterPredicate = (data: CajaMotivoObservacion, filter: string) => {
      return data.descripcion.toUpperCase().includes(filter);
    };       
  }

  ngOnDestroy(): void {
  }

  loadData() {
    this.cajaCategoriaObsService.onGetCajasCategoriasObservaciones().subscribe({
      next: (observaciones: CajaCategoriaObservacion[]) => {
        const datos = observaciones.map(cat => ({ ...cat, expanded: false }));
        this.cajaCategoriaObsDataSource.data = datos;
      },
      error: err => console.error('Error al cargar las observaciones:', err)
    });

    this.cajaSubCategoriaObsService.onGetAllCajaSubCategoriaObs()
      .subscribe({
        next: (subCat: CajaSubCategoriaObservacion[]) => {
          const datos = subCat.map(sub => ({ ...sub, expanded: false }));
          this.cajaSubCategoriaObsDataSource.data = datos;
        }
      });

    this.cajaMotivoObsService.onGetCajaMotivosObservaciones()
      .subscribe({
        next: (motivo: CajaMotivoObservacion[]) => {
          const datos = motivo.map(mot => ({ ...mot, expanded: false }));
          this.cajaMotivoObsDataSource.data = datos;
        }
      });
  }

  getCajaSubCategorias(cajaCategoriaId: number): CajaSubCategoriaObservacion[] {
    if (!cajaCategoriaId) {
      return [];
    } 
    return this.cajaSubCategoriaObsDataSource.filteredData.filter(
      sub => sub.cajaCategoriaObservacion && sub.cajaCategoriaObservacion.id === cajaCategoriaId
    );
  }
  
  getCajaMotivos(cajaSubCategoriaId: number): CajaMotivoObservacion[] {
    if (!cajaSubCategoriaId) {
      return [];
    }
    return this.cajaMotivoObsDataSource.filteredData.filter(
      motivo => motivo.cajaSubCategoriaObservacion && motivo.cajaSubCategoriaObservacion.id === cajaSubCategoriaId
    );
  }  
  
  onSelectCajaCategoria(cajaCat: CajaCategoriaObservacion) {
    this.selectedCajaCategoriaObs = cajaCat;
    this.selectedCajaSubCategoriaObs = null;
    this.selectedCajaMotivoObs = null;
  }

  onSelectCajaSubCategoria(cajaSubCat: CajaSubCategoriaObservacion) {
    this.selectedCajaSubCategoriaObs = cajaSubCat;
    this.cajaSubCategoriaObsControl.setValue(cajaSubCat);
  }

  onSelectCajaMotivo(cajaMot: CajaMotivoObservacion) {
    this.selectedCajaMotivoObs = cajaMot;
  }

  onFinalizar() {
    this.tabService.removeTab(this.data.id - 1);
    this.tabService.addTab(
      new Tab(MainCajaObservacionComponent, "Observación de Cajas", null, MainCajaObservacionComponent)
    );
    console.log('Selección final:', this.selectedCajaCategoriaObs, this.selectedCajaSubCategoriaObs, this.selectedCajaMotivoObs)
    this.notificationBar.notification$.next(
      {
        texto: 'Selección finalizada',
        color: NotificacionColor.success,
        duracion: 2
      }
    )
  }

  abrirFiltroCajaCategoria() {
    this.filtroCajaCategoriaOpen = !this.filtroCajaCategoriaOpen;
    if (!this.filtroCajaCategoriaOpen) {
      this.onSearchCajaCategoriaObs();
    } else {
      setTimeout(() => {
        this.filtroCajaCategoriaObsInput.nativeElement.focus();
      }, 100);
    }
  }

  onSearchCajaCategoriaObs() {
      const filterValue = this.filtroCajaCategoriaControl.value.trim().toUpperCase();
      this.cajaCategoriaObsDataSource.filter = filterValue;
    }
  
  onFilterCajaCategoriaObs() {
    this.onSearchCajaCategoriaObs();
  }

  abrirFiltroCajaSubCategoria() {
    this.filtroCajaSubCategoriaOpen = !this.filtroCajaSubCategoriaOpen;
    if (!this.filtroCajaSubCategoriaOpen) {
      this.onSearchCajaSubCategoriaObs();
    } else {
      setTimeout(() => {
        this.filtroCajaSubCategoriaObsInput.nativeElement.focus();
      }, 100);
    }
  }

  onSearchCajaSubCategoriaObs() {
      const filterValue = this.filtroCajaSubCategoriaControl.value.trim().toUpperCase();
      this.cajaSubCategoriaObsDataSource.filter = filterValue;
    }
  
  onFilterCajaSubCategoriaObs() {
    this.onSearchCajaSubCategoriaObs();
  }

  abrirFiltroCajaMotivo() {
    this.filtroCajaMotivoOpen = !this.filtroCajaMotivoOpen;
    if (!this.filtroCajaMotivoOpen) {
      this.onSearchCajaMotivoObs();
    } else {
      setTimeout(() => {
        this.filtroCajaMotivoObsInput.nativeElement.focus();
      }, 100);
    }
  }

  onSearchCajaMotivoObs() {
      const filterValue = this.filtroCajaMotivoControl.value.trim().toUpperCase();
      this.cajaMotivoObsDataSource.filter = filterValue;
    }
  
  onFilterCajaMotivoObs() {
    this.onSearchCajaMotivoObs();
  }

  onAddCajaCategoriaObs() {
    this.matDialog
      .open(AddCajaCategoriaObsDialogComponent, {
        width: "550px",
        height: "250px",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          let newCat: CajaCategoriaObservacion = res.data ? res.data : res;
          this.cajaCategoriaObsDataSource.data = [...this.cajaCategoriaObsDataSource.data, newCat];
        }
      });
  }

  onAddCajaSubCategoriaObs() {
    this.matDialog
      .open(AddCajaSubCategoriaObsDialogComponent, {
        width: "550px",
        height: "250px",
        data: { cajaCategoriaPreselected: this.selectedCajaCategoriaObs }
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: any) => {
        if (res != null) {
          let newSubcat: CajaSubCategoriaObservacion = res.data ? res.data : res;

          if (!newSubcat.cajaCategoriaObservacion && this.selectedCajaCategoriaObs) {
            newSubcat.cajaCategoriaObservacion = this.selectedCajaCategoriaObs;
          }
          this.cajaSubCategoriaObsList = [...(this.cajaSubCategoriaObsList || []), newSubcat];

          this.cajaSubCategoriaObsDataSource.data = [...this.cajaSubCategoriaObsDataSource.data, newSubcat];
          this.cajaSubCategoriaObsControl.setValue(newSubcat);
          this.selectedCajaSubCategoriaObs = newSubcat; 
        }
      });
  }
  
  onAddCajaMotivoObs() {
    this.matDialog
      .open(AddCajaMotivoObsDialogComponent, {
        width: "550px",
        height: "250px",
        data: { cajaSubCategoriaPreselected: this.selectedCajaSubCategoriaObs }
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          let newMot: CajaMotivoObservacion = res.data ? res.data : res;

          if (!newMot.cajaSubCategoriaObservacion && this.selectedCajaSubCategoriaObs) {
            newMot.cajaSubCategoriaObservacion = this.selectedCajaSubCategoriaObs;
          }

          this.cajaMotivoObsList = [...(this.cajaMotivoObsList || []), newMot];
          this.cajaMotivoObsDataSource.data = [...this.cajaMotivoObsDataSource.data, newMot];

          this.cajaMotivoObsControl.setValue(newMot);
          this.selectedCajaMotivoObs = newMot;
        }
      });
  }
    
  onEditCajaCategoriaObs(cajaCategoria: CajaCategoriaObservacion, index: number) {
    this.matDialog
      .open(AddCajaCategoriaObsDialogComponent, {
        data: { cajaCategoriaObs: cajaCategoria },
        width: "550px",
        height: "250px",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.cajaCategoriaObsDataSource.data = this.cajaCategoriaObsDataSource.data.map(item =>
            item.id === res.id ? res : item
          );
          this.onSelectCajaCategoria(res);
        }
      });
  }

  onDeleteCajaCategoriaObs(cajaCat: CajaCategoriaObservacion, i) {
    this.dialogService.confirm('¡Atención!', '¿Realmente desea eliminar esta caja categoría?')
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.cajaCategoriaObsService.onDeleteCategoriaObservacion(cajaCat.id)
            .pipe(untilDestroyed(this))
            .subscribe(deleteResponse => {
              if (deleteResponse) {
                this.cajaCategoriaObsDataSource.data = this.cajaCategoriaObsDataSource.data.filter(
                  item => item.id !== cajaCat.id
                );
                this.notificationBar.notification$.next({
                  texto: 'Caja categoría eliminada exitosamente',
                  color: NotificacionColor.success,
                  duracion: 2
                });
              }
            });
        }
      });
  }

  onEditCajaSubCategoriaObs(cajaSubcategoria: CajaSubCategoriaObservacion, index: number) {
    this.matDialog
      .open(AddCajaSubCategoriaObsDialogComponent, {
        data: { cajaSubCategoriaObservacion: cajaSubcategoria },
        width: "550px",
        height: "250px",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.cajaSubCategoriaObsDataSource.data = this.cajaSubCategoriaObsDataSource.data.map(item =>
            item.id === res.id ? res : item
          );
          this.onSelectCajaSubCategoria(res);
        }
      });
  }

  onDeleteCajaSubCategoriaObs(cajaSub: CajaSubCategoriaObservacion, i) {
    this.dialogService.confirm('¡Atención!', '¿Realmente desea eliminar esta caja subcategoría?')
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.cajaSubCategoriaObsService.onDeleteCajaSubCategoriaObservacion(cajaSub.id)
            .pipe(untilDestroyed(this))
            .subscribe(deleteResponse => {
              if (deleteResponse) {
                this.cajaSubCategoriaObsDataSource.data = this.cajaSubCategoriaObsDataSource.data.filter(
                  item => item.id !== cajaSub.id
                );
                this.notificationBar.notification$.next({
                  texto: 'Caja subcategoría eliminada exitosamente',
                  color: NotificacionColor.success,
                  duracion: 2
                });
              }
            });
        }
      });
  }

  onEditCajaMotivoObs(cajaMotivo: CajaMotivoObservacion, index: number) {
    this.matDialog
      .open(AddCajaMotivoObsDialogComponent, {
        data: { cajaMotivoObservacion: cajaMotivo },
        width: "550px",
        height: "250px",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.cajaMotivoObsDataSource.data = this.cajaMotivoObsDataSource.data.map(item =>
            item.id === res.id ? res : item
          );
          this.onSelectCajaMotivo(res);
        }
      });
  }

  onDeleteCajaMotivoObs(cajaMot: CajaMotivoObservacion, i) {
    this.dialogService.confirm('¡Atención!', '¿Realmente desea eliminar este caja motivo?')
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.cajaMotivoObsService.onDeleteCajaMotivoObservacion(cajaMot.id)
            .pipe(untilDestroyed(this))
            .subscribe(deleteResponse => {
              if (deleteResponse) {
                this.cajaMotivoObsDataSource.data = this.cajaMotivoObsDataSource.data.filter(
                  item => item.id !== cajaMot.id
                );
                this.notificationBar.notification$.next({
                  texto: 'Caja motivo eliminado exitosamente',
                  color: NotificacionColor.success,
                  duracion: 2
                });
              }
            });
        }
      });
  }
}