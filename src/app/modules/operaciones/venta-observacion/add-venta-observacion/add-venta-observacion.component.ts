import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Venta } from '../../venta/venta.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MainService } from '../../../../main.service';
import { SubCategoriaObservacionService } from '../../sub-categoria-observacion/sub-categoria-observacion.service';
import { CategoriaObservacionService } from '../../categoria-observacion/categoria-observacion.service';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { MatTableDataSource } from '@angular/material/table';
import { VentaObservacionInput } from '../venta-observacion-input';
import { VentaObservacion } from '../venta-observacion.model';
import { VentaObservacionService } from '../venta-observacion.service';
import { CategoriaObservacion } from '../../categoria-observacion/categoria-observacion.model';
import { SubCategoriaObservacion } from '../../sub-categoria-observacion/sub-categoria-observacion.model';
import { FrcSearchableSelectComponent } from '../../../../shared/components/frc-searchable-select/frc-searchable-select.component';
import { AddSubcategoriaObsDialogComponent } from '../../sub-categoria-observacion/add-subcategoria-obs-dialog/add-subcategoria-obs-dialog.component';
import { updateDataSource } from '../../../../commons/core/utils/numbersUtils';
import { AddCategoriaObsDialogComponent } from '../../categoria-observacion/add-categoria-obs-dialog/add-categoria-obs-dialog.component';
import { forkJoin } from 'rxjs';
import { MotivoObservacion } from '../../motivo-observacion/motivo-observacion.model';
import { MotivoObservacionService } from '../../motivo-observacion/motivo-observacion.service';
import { AddMotivoObsDialogComponent } from '../../motivo-observacion/add-motivo-obs-dialog/add-motivo-obs-dialog.component';

export interface VentaObservacionData {
  ventaObservacion: VentaObservacion;
  ventaId: number;
  venta?: Venta;
  sucursalId: number;
  usuarioId: number;
  subCategoriaObsId: number;
  motivoObservacionId: number;
}
@UntilDestroy({ checkProperties: true})
@Component({
  selector: 'add-venta-observacion',
  templateUrl: './add-venta-observacion.component.html',
  styleUrls: ['./add-venta-observacion.component.scss']
})

export class AddVentaObservacionComponent implements OnInit{
  @ViewChild("categoriaObsSelect", { read: FrcSearchableSelectComponent})
  categoriaObsSelect: FrcSearchableSelectComponent;
  @ViewChild("subCategoriaObsSelect", { read: FrcSearchableSelectComponent})
  subCategoriaObsSelect: FrcSearchableSelectComponent;
  @ViewChild("motivoObservacionSelect", { read: FrcSearchableSelectComponent})
  motivoObservacionSelect: FrcSearchableSelectComponent;

  addVentaObservacionDataSource = new MatTableDataSource<VentaObservacion>([]);
  subCategoriaObsDataSource = new MatTableDataSource<SubCategoriaObservacion>([]);
  categoriaObsDataSource = new MatTableDataSource<CategoriaObservacion>([]);
  motivoObservacionDataSource = new MatTableDataSource<MotivoObservacion>([]);
  selectedVenta: Venta;
  selectedSubCategoriaObs: SubCategoriaObservacion;
  selectedCategoriaObs: CategoriaObservacion;
  ventaObservacionInput: VentaObservacionInput;
  formGroup: FormGroup;
  categoriaObsList: CategoriaObservacion[];
  subCategoriaObsList: SubCategoriaObservacion[] = [];
  motivoObservacionList: MotivoObservacion[];
  filteredSubCategoriaObsList = [...this.subCategoriaObsList];
  filteredMotivoObsList: MotivoObservacion[] = [];

  idControl = new FormControl(null);
  descripcionControl = new FormControl(null);
  subCategoriaObsControl = new FormControl(null, Validators.required);
  categoriaObsControl = new FormControl(null, Validators.required);
  motivoObservacionControl = new FormControl(null, Validators.required);

  isCancelar = true;
  isGuardar = true;
  isEditar = false;
  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: VentaObservacionData,
    public mainService: MainService,
    private matDialog: MatDialog,
    private dialogRef: MatDialogRef<AddVentaObservacionComponent>,
    private ventaObservacionService: VentaObservacionService,
    private categoriaObsService: CategoriaObservacionService,
    private subCategoriaObsService: SubCategoriaObservacionService,
    private motivoObservacionService: MotivoObservacionService,
    private notificationBar: NotificacionSnackbarService,
  ) { }

  ngOnInit(): void {
    if (this.data?.venta) {
      this.selectedVenta = this.data.venta;
    }

    forkJoin({
      categorias: this.categoriaObsService.onGetCategoriasObservaciones(),
      subcategorias: this.subCategoriaObsService.onGetAllSubCategoriaObs(),
      motivos: this.motivoObservacionService.onGetMotivosObservaciones()
    }).subscribe(({ categorias, subcategorias, motivos }) => {
      this.categoriaObsList = (categorias || []).filter(cat => cat.activo === true);
      this.subCategoriaObsList = (subcategorias || []).filter(sub => sub.activo === true);
      this.motivoObservacionList = (motivos || []).filter(mot => mot.activo === true);
      
      if (this.data?.ventaObservacion?.motivoObservacion) {
        const categoriaSeleccionada = this.data.ventaObservacion.motivoObservacion.subcategoriaObservacion?.categoriaObservacion;
        if (categoriaSeleccionada) {
          this.categoriaObsControl.setValue(categoriaSeleccionada);
          this.handleCategoriaSelectionChange(categoriaSeleccionada);
        }
          
        if (this.data?.ventaObservacion?.motivoObservacion?.subcategoriaObservacion) {
          this.subCategoriaObsControl.setValue(this.data.ventaObservacion.motivoObservacion.subcategoriaObservacion);
          this.handleSubCategoriaSelectionChange(this.data.ventaObservacion.motivoObservacion.subcategoriaObservacion);
        }
        this.motivoObservacionControl.setValue(this.data.ventaObservacion.motivoObservacion);
      } else if (this.categoriaObsList && this.categoriaObsList.length > 0) {
        this.categoriaObsControl.setValue(this.categoriaObsList[0]);
        this.handleCategoriaSelectionChange(this.categoriaObsList[0]);
      }
    });
    
    this.createForm();
    this.loadData();
  }
  
  createForm() {
    this.formGroup = new FormGroup({
      id: this.idControl,
      descripcion: this.descripcionControl,
      subCategoriaObs: this.subCategoriaObsControl,
      categoriaObs: this.categoriaObsControl,
      motivoObs: this.motivoObservacionControl,
    });
  }

  loadData() {
    if (this.data?.ventaObservacion != null) {
      this.idControl.setValue(this.data.ventaObservacion.id);
      this.descripcionControl.setValue(this.data.ventaObservacion.descripcion);
      this.categoriaObsControl.setValue(this.data.ventaObservacion.motivoObservacion.subcategoriaObservacion.categoriaObservacion)
      this.subCategoriaObsControl.setValue(this.data.ventaObservacion.motivoObservacion.subcategoriaObservacion?.id); 
      this.motivoObservacionControl.setValue(this.data.ventaObservacion.motivoObservacion?.id);
    }
  }

  onCancelar() {
    this.dialogRef.close();
  }

  onEditar() {

  }

  onGuardar() {
    this.onSave();
  }

  onSave() {
    if (this.formGroup.invalid) {
      this.notificationBar.notification$.next({
        texto: 'Debe seleccionar una subcategoría y un motivo',
        color: NotificacionColor.danger,
        duracion: 2,
      });
    }
    this.ventaObservacionInput = new VentaObservacionInput();
    if (this.data?.ventaObservacion) {
      this.ventaObservacionInput.id = this.data.ventaObservacion.id;
    }
    if (this.data?.motivoObservacionId) {
      this.ventaObservacionInput.motivoObservacionId = this.data.motivoObservacionId;
    } else {
      this.ventaObservacionInput.motivoObservacionId = this.motivoObservacionControl.value?.id
      || this.subCategoriaObsControl.value;
    }
    if (this.data?.venta) {
      this.ventaObservacionInput.ventaId = this.data.venta.id;
    }
    if (this.data?.venta?.sucursalId) {
      this.ventaObservacionInput.sucursalId = this.data.venta.sucursalId;
    } 
    this.ventaObservacionInput.usuarioId = this.mainService.usuarioActual?.id;
    this.ventaObservacionInput.descripcion = this.descripcionControl.value?.toUpperCase();
    
      this.ventaObservacionService.onSaveVentaObservacion(this.ventaObservacionInput)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.dialogRef.close(res);
          this.notificationBar.notification$.next({
            texto: 'Guardado con éxito',
            color: NotificacionColor.success,
            duracion: 2,
          });
        }
      }, (error) => {
        console.error('Error al guardar:', error);
      });
  }

  handleSubCategoriaSelectionChange(value: any) {
    if (value) {
      this.subCategoriaObsControl.setValue(value);
      
      this.filteredMotivoObsList = this.motivoObservacionList.filter(m =>
        m?.subcategoriaObservacion &&
        m.subcategoriaObservacion.id.toString() === value.id.toString() &&
        m.activo === true
      );

      if (this.filteredMotivoObsList.length > 0) {
        this.motivoObservacionControl.setValue(this.filteredMotivoObsList[0]);
      } else {
        this.motivoObservacionControl.setValue(null);
      }
    } else {
      this.filteredMotivoObsList = [];
      this.motivoObservacionControl.setValue(null);
    }
  }
  
  handleCategoriaSelectionChange(selectedCategoria: any, newSelectedSubcategoria?: SubCategoriaObservacion) {
    if (!selectedCategoria) {
      this.filteredSubCategoriaObsList = this.subCategoriaObsList.filter(sub => sub.activo === true);
      this.subCategoriaObsControl.setValue(null);
      return;
    }

    this.selectedCategoriaObs = selectedCategoria;
    
    this.filteredSubCategoriaObsList = this.subCategoriaObsList.filter(subCat =>
      subCat?.categoriaObservacion &&
      subCat.categoriaObservacion.id.toString() === selectedCategoria.id.toString() &&
      subCat.activo === true
    );
    
    if (newSelectedSubcategoria) {
      const found = this.filteredSubCategoriaObsList.find(sub =>
        sub.id.toString() === newSelectedSubcategoria.id.toString()
      );
      if (found) {
        this.subCategoriaObsControl.setValue(found);
        return;
      }
    }
    
    if (this.filteredSubCategoriaObsList.length > 0) {
      this.subCategoriaObsControl.setValue(this.filteredSubCategoriaObsList[0]);
      this.handleSubCategoriaSelectionChange(this.filteredSubCategoriaObsList[0]);
    } else {
      this.subCategoriaObsControl.setValue(null);
    }
    this.filteredMotivoObsList = [];
    this.motivoObservacionControl.setValue(null);
  }

  handleMotivoSelectionChange(value: any) {
    if (value) {
      this.motivoObservacionControl.setValue(value);
    }
  }

}
