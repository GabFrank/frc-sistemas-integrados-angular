import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CajaObservacion } from '../caja-observacion.model';
import { PdvCaja } from '../../caja/caja.model';
import { FrcSearchableSelectComponent } from '../../../../../shared/components/frc-searchable-select/frc-searchable-select.component';
import { MatTableDataSource } from '@angular/material/table';
import { CajaSubCategoriaObservacion } from '../../caja-subcategoria-observacion/caja-subcategoria-observacion.model';
import { CajaCategoriaObservacion } from '../../caja-categoria-observacion/caja-categoria-observacion.model';
import { CajaMotivoObservacion } from '../../caja-motivo-observacion/caja-motivo-observacion.model';
import { CajaObservacionInput } from '../caja-observacion-input.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MainService } from '../../../../../main.service';
import { CajaObservacionService } from '../caja-observacion.service';
import { CajaCategoriaObservacionService } from '../../caja-categoria-observacion/caja-categoria-observacion.service';
import { CajaSubCategoriaObservacionService } from '../../caja-subcategoria-observacion/caja-subcategoria-observacion.service';
import { CajaMotivoObservacionService } from '../../caja-motivo-observacion/caja-motivo-observacion.service';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { forkJoin } from 'rxjs';

export interface CajaObservacionData {
  cajaObservacion: CajaObservacion;
  cajaId: number;
  caja?: PdvCaja;
  sucursalId: number;
  usuarioId: number;
  cajaSubCategoriaObsId: number;
  cajaMotivoObservacionId: number;
}
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'add-caja-observacion-dialog',
  templateUrl: './add-caja-observacion-dialog.component.html',
  styleUrls: ['./add-caja-observacion-dialog.component.scss']
})
export class AddCajaObservacionComponent implements OnInit{
  @ViewChild("cajaCategoriaObsSelect", { read: FrcSearchableSelectComponent})
  categoriaObsSelect: FrcSearchableSelectComponent;
  @ViewChild("cajaSubCategoriaObsSelect", { read: FrcSearchableSelectComponent})
  cajaSubCategoriaObsSelect: FrcSearchableSelectComponent;
  @ViewChild("cajaMotivoObsSelect", { read: FrcSearchableSelectComponent})
  cajaMotivoObservacionSelect: FrcSearchableSelectComponent;

  addCajaObservacionDataSource = new MatTableDataSource<CajaObservacion>([]);
  cajaSubCategoriaObsDataSource = new MatTableDataSource<CajaSubCategoriaObservacion>([]);
  cajaCategoriaObsDataSource = new MatTableDataSource<CajaCategoriaObservacion>([]);
  cajaMotivoObservacionDataSource = new MatTableDataSource<CajaMotivoObservacion>([]);
  selectedCaja: PdvCaja;
  selectedCajaSubCategoriaObs: CajaSubCategoriaObservacion;
  selectedCajaCategoriaObs: CajaCategoriaObservacion;
  cajaObservacionInput: CajaObservacionInput;
  formGroup: FormGroup;
  cajaCategoriaObsList: CajaCategoriaObservacion[];
  cajaSubCategoriaObsList: CajaSubCategoriaObservacion[] = [];
  cajaMotivoObservacionList: CajaMotivoObservacion[];
  filteredCajaSubCategoriaObsList = [...this.cajaSubCategoriaObsList];
  filteredCajaMotivoObsList: CajaMotivoObservacion[] = [];

  idControl = new FormControl(null);
  descripcionControl = new FormControl(null);
  cajaSubCategoriaObsControl = new FormControl(null, Validators.required);
  cajaCategoriaObsControl = new FormControl(null, Validators.required);
  cajaMotivoObservacionControl = new FormControl(null, Validators.required);

  isCancelar = true;
  isGuardar = true;
  isEditar = false;
  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CajaObservacionData,
    public mainService: MainService,
    private matDialog: MatDialog,
    private dialogRef: MatDialogRef<AddCajaObservacionComponent>,
    private cajaObservacionService: CajaObservacionService,
    private cajaCategoriaObsService: CajaCategoriaObservacionService,
    private cajaSubCategoriaObsService: CajaSubCategoriaObservacionService,
    private cajaMotivoObsService: CajaMotivoObservacionService,
    private notificationBar: NotificacionSnackbarService,
  ) { }

  ngOnInit(): void {
    console.log('Datos recibidos:', this.data);

    if (this.data?.caja) {
      this.selectedCaja = this.data.caja;
    }

    forkJoin({
      cajaCategorias: this.cajaCategoriaObsService.onGetCajasCategoriasObservaciones(),
      cajaSubCategorias: this.cajaSubCategoriaObsService.onGetAllCajaSubCategoriaObs(),
      cajaMotivos: this.cajaMotivoObsService.onGetCajaMotivosObservaciones()
    }).subscribe(({ cajaCategorias, cajaSubCategorias, cajaMotivos }) => {
      this.cajaCategoriaObsList = cajaCategorias;
      this.cajaSubCategoriaObsList = cajaSubCategorias || [];
      this.cajaMotivoObservacionList = cajaMotivos || [];
      
      if (this.data?.cajaObservacion?.cajaMotivoObservacion) {
        const categoriaSeleccionada = this.data.cajaObservacion.cajaMotivoObservacion.cajaSubCategoriaObservacion?.cajaCategoriaObservacion;
        if (categoriaSeleccionada) {
          this.cajaCategoriaObsControl.setValue(categoriaSeleccionada);
          this.handleCajaCategoriaSelectionChange(categoriaSeleccionada);
        }
          
        if (this.data?.cajaObservacion?.cajaMotivoObservacion?.cajaSubCategoriaObservacion) {
          this.cajaSubCategoriaObsControl.setValue(this.data.cajaObservacion.cajaMotivoObservacion.cajaSubCategoriaObservacion);
          this.handleCajaSubCategoriaSelectionChange(this.data.cajaObservacion.cajaMotivoObservacion.cajaSubCategoriaObservacion);
        }
        this.cajaMotivoObservacionControl.setValue(this.data.cajaObservacion.cajaMotivoObservacion);
      } else if (this.cajaCategoriaObsList && this.cajaCategoriaObsList.length > 0) {
        this.cajaCategoriaObsControl.setValue(this.cajaCategoriaObsList[0]);
        this.handleCajaCategoriaSelectionChange(this.cajaCategoriaObsList[0]);
      }
    });
    
    this.createForm();
    this.loadData();
  }
  
  createForm() {
    this.formGroup = new FormGroup({
      id: this.idControl,
      descripcion: this.descripcionControl,
      cajaSubCategoriaObs: this.cajaSubCategoriaObsControl,
      categoriaObs: this.cajaCategoriaObsControl,
      cajaMotivoObs: this.cajaMotivoObservacionControl,
    });
  }

  loadData() {
    if (this.data?.cajaObservacion != null) {
      this.idControl.setValue(this.data.cajaObservacion.id);
      this.descripcionControl.setValue(this.data.cajaObservacion.descripcion);
      this.cajaCategoriaObsControl.setValue(this.data.cajaObservacion.cajaMotivoObservacion.cajaSubCategoriaObservacion.cajaCategoriaObservacion)
      this.cajaSubCategoriaObsControl.setValue(this.data.cajaObservacion.cajaMotivoObservacion.cajaSubCategoriaObservacion?.id); 
      this.cajaMotivoObservacionControl.setValue(this.data.cajaObservacion.cajaMotivoObservacion?.id);
    }
  }

  onCancelar() {
    this.descripcionControl.reset();
  }

  onEditar() {

  }

  onGuardar() {
    this.onSave();
  }

  onSave() {
    if (this.formGroup.invalid) {
      this.notificationBar.notification$.next({
        texto: 'Debe seleccionar una subcategoría y un cajaMotivo',
        color: NotificacionColor.danger,
        duracion: 2,
      });
    }
    this.cajaObservacionInput = new CajaObservacionInput();
    if (this.data?.cajaObservacion) {
      this.cajaObservacionInput.id = this.data.cajaObservacion.id;
    }
    if (this.data?.cajaMotivoObservacionId) {
      this.cajaObservacionInput.cajaMotivoObservacionId = this.data.cajaMotivoObservacionId;
    } else {
      this.cajaObservacionInput.cajaMotivoObservacionId = this.cajaMotivoObservacionControl.value?.id
      || this.cajaSubCategoriaObsControl.value;
    }
    if (this.data?.caja) {
      this.cajaObservacionInput.cajaId = this.data.caja.id;
      this.cajaObservacionInput.sucursalId = this.data.caja.sucursalId || this.data.caja.sucursal?.id;
    } else {
      this.cajaObservacionInput.cajaId = this.data?.cajaId;
      this.cajaObservacionInput.sucursalId = this.data?.sucursalId;
    }
    
     
    if (this.data?.usuarioId) {
      this.cajaObservacionInput.usuarioId = this.mainService.usuarioActual?.id
    }
    this.cajaObservacionInput.descripcion = this.descripcionControl.value?.toUpperCase();
    console.log(this.cajaObservacionInput);
    
      this.cajaObservacionService.onSaveCajaObservacion(this.cajaObservacionInput)
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

  handleCajaSubCategoriaSelectionChange(value: any) {
    if (value) {
      this.cajaSubCategoriaObsControl.setValue(value);
      
      this.filteredCajaMotivoObsList = this.cajaMotivoObservacionList.filter(m =>
        m?.cajaSubCategoriaObservacion &&
        m.cajaSubCategoriaObservacion.id.toString() === value.id.toString()
      );

      if (this.filteredCajaSubCategoriaObsList.length > 0) {
        this.cajaMotivoObservacionControl.setValue(this.filteredCajaMotivoObsList[0]);
      } else {
        this.cajaMotivoObservacionControl.setValue(null);
      }
    } else {
      this.filteredCajaMotivoObsList = [];
      this.cajaMotivoObservacionControl.setValue(null);
    }
  }
  
  handleCajaCategoriaSelectionChange(selectedCajaCategoria: any, newSelectedSubcategoria?: CajaSubCategoriaObservacion) {
    if (!selectedCajaCategoria) {
      this.filteredCajaSubCategoriaObsList = [...this.cajaSubCategoriaObsList];
      this.cajaSubCategoriaObsControl.setValue(null);
      return;
    }

    this.selectedCajaCategoriaObs = selectedCajaCategoria;
    
    this.filteredCajaSubCategoriaObsList = this.cajaSubCategoriaObsList.filter(subCat =>
      subCat?.cajaCategoriaObservacion &&
      subCat.cajaCategoriaObservacion.id.toString() === selectedCajaCategoria.id.toString()
    );
    
    if (newSelectedSubcategoria) {
      const found = this.filteredCajaSubCategoriaObsList.find(sub =>
        sub.id.toString() === newSelectedSubcategoria.id.toString()
      );
      if (found) {
        this.cajaSubCategoriaObsControl.setValue(found);
        return;
      }
    }
    
    if (this.filteredCajaSubCategoriaObsList.length > 0) {
      this.cajaSubCategoriaObsControl.setValue(this.filteredCajaSubCategoriaObsList[0]);
    } else {
      this.cajaSubCategoriaObsControl.setValue(null);
    }
    this.filteredCajaMotivoObsList = [];
    this.cajaMotivoObservacionControl.setValue(null);
  }

  handleCajaMotivoSelectionChange(value: any) {
    if (value) {
      this.cajaMotivoObservacionControl.setValue(value);
    }
  }

}
