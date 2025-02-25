import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CategoriaObservacion } from '../../categoria-observacion/categoria-observacion.model';
import { SubCategoriaObservacion } from '../../sub-categoria-observacion/sub-categoria-observacion.model';
import { MatTableDataSource } from '@angular/material/table';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MainService } from '../../../../main.service';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { CategoriaObservacionService } from '../../categoria-observacion/categoria-observacion.service';
import { MotivoObservacionService } from '../../motivo-observacion/motivo-observacion.service';
import { TabService } from '../../../../layouts/tab/tab.service';
import { MotivoObservacion } from '../../motivo-observacion/motivo-observacion.model';
import { SubCategoriaObservacionService } from '../../sub-categoria-observacion/sub-categoria-observacion.service';
import { Tab } from '../../../../layouts/tab/tab.model';
import { MatStepper } from '@angular/material/stepper';
import { AddMotivoObsDialogComponent } from '../../motivo-observacion/add-motivo-obs-dialog/add-motivo-obs-dialog.component';
import { updateDataSource } from '../../../../commons/core/utils/numbersUtils';
import { AddCategoriaObsDialogComponent } from '../../categoria-observacion/add-categoria-obs-dialog/add-categoria-obs-dialog.component';
import { AddSubcategoriaObsDialogComponent } from '../../sub-categoria-observacion/add-subcategoria-obs-dialog/add-subcategoria-obs-dialog.component';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';

export interface CategoriaObservacionData {
  id: number;
  descripcion: string;
  activo: boolean;
}

export interface SubCategoriaObservacionData {
  id: number;
  descripcion: string;
  activo: boolean;
  categoriaId: number;
}

export interface MotivoObservacionData {
  id: number;
  descripcion: string;
  subcategoriaObservacion: SubCategoriaObservacion;
  activo: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'main-venta-observacion',
  templateUrl: './main-venta-observacion.component.html',
  styleUrls: ['./main-venta-observacion.component.scss']
})
export class MainVentaObservacionComponent implements OnInit, OnDestroy {
  @Input() data;
  @ViewChild('filtroCategoriaObsInput') filtroCategoriaObsInput: ElementRef;
  @ViewChild('filtroSubCategoriaObsInput') filtroSubCategoriaObsInput: ElementRef;
  @ViewChild('filtroMotivoObsInput') filtroMotivoObsInput: ElementRef;
  @ViewChild("stepper", { static: false }) stepper: MatStepper;

  categoriaObs: CategoriaObservacion;
  categoriaObsList: CategoriaObservacion[];
  subCategoriaObsList: SubCategoriaObservacion[];
  motivoObsList: MotivoObservacion[];
  selectedCategoriaObs: CategoriaObservacion = null;
  selectedSubCategoriaObs: SubCategoriaObservacion;
  selectedMotivoObs: MotivoObservacion;
  categoriaObsDataSource = new MatTableDataSource<CategoriaObservacion>([]);
  subCategoriaObsDataSource = new MatTableDataSource<SubCategoriaObservacion>([]);
  motivoObsDataSource = new MatTableDataSource<MotivoObservacion>([]);
  categoriaColumnsToDisplay = ['id', 'descripcion', 'activo', 'accion'];
  subCategoriaColumnsToDisplay = ['id', 'descripcion', 'activo', 'accion'];
  motivoColumnsToDisplay = ['id', 'descripcion', 'activo', 'accion'];
  filtroCategoriaOpen = false;
  filtroCategoriaControl = new FormControl("");
  filtroSubCategoriaControl = new FormControl("");
  filtroSubCategoriaOpen = false;
  filtroMotivoControl = new FormControl("");
  filtroMotivoOpen = false;
  formGroup: FormGroup;
  categoriaObsControl: FormGroup;
  subCategoriaObsControl: FormGroup;
  motivoObsControl: FormGroup;

  constructor(
    private mainService: MainService,
    private matDialog: MatDialog,
    private dialogService: DialogosService,
    private notificationBar: NotificacionSnackbarService,
    private categoriaObsService: CategoriaObservacionService,
    private subCategoriaObsService: SubCategoriaObservacionService,
    private motivoObsService: MotivoObservacionService,
    private tabService: TabService,
  ) {
  }

  ngOnInit(): void {

    this.loadData();

    this.categoriaObsDataSource.filterPredicate = (data: CategoriaObservacion, filter: string) => {
      return data.descripcion.toUpperCase().includes(filter);
    };
    this.subCategoriaObsDataSource.filterPredicate = (data: SubCategoriaObservacion, filter: string) => {
      return data.descripcion.toUpperCase().includes(filter);
    };
    this.motivoObsDataSource.filterPredicate = (data: MotivoObservacion, filter: string) => {
      return data.descripcion.toUpperCase().includes(filter);
    };       
  }

  ngOnDestroy(): void {
  }

  loadData() {
    this.categoriaObsService.onGetCategoriasObservaciones().subscribe({
      next: (observaciones: CategoriaObservacion[]) => {
        const datos = observaciones.map(cat => ({ ...cat, expanded: false }));
        this.categoriaObsDataSource.data = datos;
      },
      error: err => console.error('Error al cargar las observaciones:', err)
    });

    this.subCategoriaObsService.onGetAllSubCategoriaObs()
      .subscribe({
        next: (subCat: SubCategoriaObservacion[]) => {
          console.log('Subcategorias obtenidas', subCat);
          const datos = subCat.map(sub => ({ ...sub, expanded: false }));
          this.subCategoriaObsDataSource.data = datos;
        }
      });

    this.motivoObsService.onGetMotivosObservaciones()
      .subscribe({
        next: (motivo: MotivoObservacion[]) => {
          console.log('Motivos obtenidos', motivo);
          const datos = motivo.map(mot => ({ ...mot, expanded: false }));
          this.motivoObsDataSource.data = datos;
        }
      });
  }

  getSubCategorias(categoriaId: number): SubCategoriaObservacion[] {
    if (!categoriaId) {
      return [];
    }
    return this.subCategoriaObsDataSource.filteredData.filter(
      sub => sub.categoriaObservacion && sub.categoriaObservacion.id === categoriaId
    );
  }
  
  getMotivos(subCategoriaId: number): MotivoObservacion[] {
    if (!subCategoriaId) {
      return [];
    }
    return this.motivoObsDataSource.filteredData.filter(
      motivo => motivo.subcategoriaObservacion && motivo.subcategoriaObservacion.id === subCategoriaId
    );
  }  
  
  onSelectCategoria(cat: CategoriaObservacion) {
    this.selectedCategoriaObs = cat;
    this.selectedSubCategoriaObs = null;
    this.selectedMotivoObs = null;
  }

  onSelectSubCategoria(subCat: SubCategoriaObservacion) {
    this.selectedSubCategoriaObs = subCat;
    this.selectedMotivoObs = null;
  }

  onSelectMotivo(mot: MotivoObservacion) {
    this.selectedMotivoObs = mot;
  }

  onFinalizar() {
    this.tabService.removeTab(this.data.id - 1);
    this.tabService.addTab(
      new Tab(MainVentaObservacionComponent, "Observacion de ventas", null, MainVentaObservacionComponent)
    );
    console.log('Seleccion final:', this.selectedCategoriaObs, this.selectedSubCategoriaObs, this.selectedMotivoObs)
    this.notificationBar.notification$.next(
      {
        texto: 'Selección finalizada',
        color: NotificacionColor.success,
        duracion: 2
      }
    )
  }

  abrirFiltroCategoria() {
    this.filtroCategoriaOpen = !this.filtroCategoriaOpen;
    if (!this.filtroCategoriaOpen) {
      this.onSearchCategoriaObs();
    } else {
      setTimeout(() => {
        this.filtroCategoriaObsInput.nativeElement.focus();
      }, 100);
    }
  }

  onSearchCategoriaObs() {
      const filterValue = this.filtroCategoriaControl.value.trim().toUpperCase();
      this.categoriaObsDataSource.filter = filterValue;
    }
  
  onFilterCategoriaObs() {
    this.onSearchCategoriaObs();
  }

  abrirFiltroSubCategoria() {
    this.filtroSubCategoriaOpen = !this.filtroSubCategoriaOpen;
    if (!this.filtroSubCategoriaOpen) {
      this.onSearchSubCategoriaObs();
    } else {
      setTimeout(() => {
        this.filtroSubCategoriaObsInput.nativeElement.focus();
      }, 100);
    }
  }

  onSearchSubCategoriaObs() {
      const filterValue = this.filtroSubCategoriaControl.value.trim().toUpperCase();
      this.subCategoriaObsDataSource.filter = filterValue;
    }
  
  onFilterSubCategoriaObs() {
    this.onSearchSubCategoriaObs();
  }

  abrirFiltroMotivo() {
    this.filtroMotivoOpen = !this.filtroMotivoOpen;
    if (!this.filtroMotivoOpen) {
      this.onSearchMotivoObs();
    } else {
      setTimeout(() => {
        this.filtroMotivoObsInput.nativeElement.focus();
      }, 100);
    }
  }

  onSearchMotivoObs() {
      const filterValue = this.filtroMotivoControl.value.trim().toUpperCase();
      this.motivoObsDataSource.filter = filterValue;
    }
  
  onFilterMotivoObs() {
    this.onSearchMotivoObs();
  }

  onAddCategoriaObs() {
    this.matDialog
      .open(AddCategoriaObsDialogComponent, {
        width: "550px",
        height: "250px",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          let newCat: CategoriaObservacion = res.data ? res.data : res;
          this.categoriaObsDataSource.data = [...this.categoriaObsDataSource.data, newCat];
        }
      });
  }

  onAddSubCategoriaObs() {
    this.matDialog
      .open(AddSubcategoriaObsDialogComponent, {
        width: "550px",
        height: "250px",
        data: { categoriaPreselected: this.selectedCategoriaObs }
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: any) => {
        if (res != null) {
          let newSubcat: SubCategoriaObservacion = res.data ? res.data : res;

          this.subCategoriaObsDataSource.data = [...this.subCategoriaObsDataSource.data, newSubcat];
          if (!newSubcat.categoriaObservacion && this.selectedCategoriaObs) {
            newSubcat.categoriaObservacion = this.selectedCategoriaObs;
          }
          this.subCategoriaObsList = [...this.subCategoriaObsList, newSubcat];

          this.subCategoriaObsControl.setValue(newSubcat);
          this.subCategoriaObsDataSource.data = updateDataSource(this.subCategoriaObsDataSource.data, newSubcat);
        }
      });
  }
  
  onAddMotivoObs() {
    this.matDialog
      .open(AddMotivoObsDialogComponent, {
        width: "550px",
        height: "250px",
        data: { subcategoriaPreselected: this.selectedSubCategoriaObs }
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          let newMot: MotivoObservacion = res.data ? res.data : res;

          this.motivoObsDataSource.data = [...this.motivoObsDataSource.data, newMot];
          if (!newMot.subcategoriaObservacion && this.selectedSubCategoriaObs) {
            newMot.subcategoriaObservacion = this.selectedSubCategoriaObs;
          }

          this.motivoObsList = [...this.motivoObsList, newMot];
          this.motivoObsDataSource.data = [...this.motivoObsDataSource.data, newMot];

          this.motivoObsControl.setValue(newMot);
        }
      });
  }
    
  onEditCategoriaObs(categoria: CategoriaObservacion, index: number) {
    this.matDialog
      .open(AddCategoriaObsDialogComponent, {
        data: { categoriaObs: categoria },
        width: "550px",
        height: "250px",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.categoriaObsDataSource.data = this.categoriaObsDataSource.data.map(item =>
            item.id === res.id ? res : item
          );
          this.onSelectCategoria(res);
        }
      });
  }

  onDeleteCategoriaObs(cat: CategoriaObservacion, i) {
    this.dialogService.confirm('Atención!!', 'Realmente desea eliminar esta categoría?')
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.categoriaObsService.onDeleteCategoriaObservacion(cat.id)
            .pipe(untilDestroyed(this))
            .subscribe(deleteResponse => {
              if (deleteResponse) {
                this.categoriaObsDataSource.data = this.categoriaObsDataSource.data.filter(
                  item => item.id !== cat.id
                );
                this.notificationBar.notification$.next({
                  texto: 'Categoría eliminada exitosamente',
                  color: NotificacionColor.success,
                  duracion: 2
                });
              }
            });
        }
      });
  }

  onEditSubCategoriaObs(subcategoria: SubCategoriaObservacion, index: number) {
    this.matDialog
      .open(AddSubcategoriaObsDialogComponent, {
        data: { subcategoriaObservacion: subcategoria },
        width: "550px",
        height: "250px",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.subCategoriaObsDataSource.data = this.subCategoriaObsDataSource.data.map(item =>
            item.id === res.id ? res : item
          );
          this.onSelectSubCategoria(res);
        }
      });
  }

  onDeleteSubCategoriaObs(sub: SubCategoriaObservacion, i) {
    this.dialogService.confirm('Atención!!', 'Realmente desea eliminar esta subcategoría?')
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.subCategoriaObsService.onDeleteSubCategoriaObservacion(sub.id)
            .pipe(untilDestroyed(this))
            .subscribe(deleteResponse => {
              if (deleteResponse) {
                this.subCategoriaObsDataSource.data = this.subCategoriaObsDataSource.data.filter(
                  item => item.id !== sub.id
                );
                this.notificationBar.notification$.next({
                  texto: 'Subcategoría eliminada exitosamente',
                  color: NotificacionColor.success,
                  duracion: 2
                });
              }
            });
        }
      });
  }

  onEditMotivoObs(motivo: MotivoObservacion, index: number) {
    this.matDialog
      .open(AddMotivoObsDialogComponent, {
        data: { motivoObservacion: motivo },
        width: "550px",
        height: "250px",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.motivoObsDataSource.data = this.motivoObsDataSource.data.map(item =>
            item.id === res.id ? res : item
          );
          this.onSelectMotivo(res);
        }
      });
  }

  onDeleteMotivoObs(mot: MotivoObservacion, i) {
    this.dialogService.confirm('Atención!!', 'Realmente desea eliminar este motivo?')
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.motivoObsService.onDeleteMotivoObservacion(mot.id)
            .pipe(untilDestroyed(this))
            .subscribe(deleteResponse => {
              if (deleteResponse) {
                this.motivoObsDataSource.data = this.motivoObsDataSource.data.filter(
                  item => item.id !== mot.id
                );
                this.notificationBar.notification$.next({
                  texto: 'Motivo eliminado exitosamente',
                  color: NotificacionColor.success,
                  duracion: 2
                });
              }
            });
        }
      });
  }
    
}
