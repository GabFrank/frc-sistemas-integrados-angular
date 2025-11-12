import { Timbrado } from '../timbrado.modal';
import { debounceTime } from 'rxjs/operators';
import { TimbradoService } from '../timbrado.service';
import { MainService } from '../../../../main.service';
import { TimbradosGQL } from '../graphql/timbradosQuery';
import { Component, Inject, OnInit } from '@angular/core';
import { TimbradoSearchGQL } from '../graphql/timbradoSearch';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../notificacion-snackbar.service'; 
import { SearchListDialogComponent, SearchListtDialogData } from '../../../../shared/components/search-list-dialog/search-list-dialog.component';

export interface TimbradoDialogData {
  timbrado: Timbrado;
}

@UntilDestroy( { checkProperties: true })
@Component({
  selector: 'app-add-timbrado-dialog',
  templateUrl: './add-timbrado-dialog.component.html',
  styleUrls: ['./add-timbrado-dialog.component.scss']
})
export class AddTimbradoDialogComponent implements OnInit {

  isEditing = false;
  formGroup: FormGroup;
  selectedTimbrado: Timbrado;
  lastValidacionFecha: string = '';
  cscControl = new FormControl(null);
  emailControl = new FormControl(null);
  numeroControl = new FormControl(null);
  ciudadControl = new FormControl(null);
  barrioControl = new FormControl(null);
  activoControl = new FormControl(false);
  telefonoControl = new FormControl(null);
  localidadControl = new FormControl(null);
  direccionControl = new FormControl(null);
  tipoSociedadControl = new FormControl(null);
  departamentoControl = new FormControl(null);
  codigoCiudadControl = new FormControl(null);
  isElectronicoControl = new FormControl(false);
  rucControl = new FormControl(null, Validators.required);
  fechaFinControl = new FormControl(null, Validators.required);
  codActividadEconomicaPrincipalControl = new FormControl(null);
  descActividadEconomicaPrincipalControl = new FormControl(null);
  codActividadEconomicaSecundariaControl = new FormControl(null);
  descActividadEconomicaSecundariaControl = new FormControl(null);
  razonSocialControl = new FormControl(null, Validators.required);
  fechaInicioControl = new FormControl(null, Validators.required);

  constructor(
    private dialog: MatDialog,
    private timbrados: TimbradosGQL,
    private mainService: MainService,
    private timbradoService: TimbradoService,
    private timbradoSearch: TimbradoSearchGQL,
    @Inject(MAT_DIALOG_DATA) private data: TimbradoDialogData,
    private notificacionService: NotificacionSnackbarService,
    private matDialogRef: MatDialogRef<AddTimbradoDialogComponent>
  ) { 
    if (data?.timbrado != null) {
      this.selectedTimbrado = data.timbrado;
    } else {
      this.selectedTimbrado = new Timbrado();
    }
  }

  ngOnInit() : void {
    this.formGroup = new FormGroup({
      ruc: this.rucControl,
      csc: this.cscControl,
      email: this.emailControl,
      numero: this.numeroControl,
      activo: this.activoControl,
      fechaFin: this.fechaFinControl,
      telefono: this.telefonoControl,
      razonSocial: this.razonSocialControl,
      fechaInicio: this.fechaInicioControl,
      tipoSociedad: this.tipoSociedadControl,
      isElectronico: this.isElectronicoControl,
      domicilioFiscalCiudad: this.ciudadControl,
      domicilioFiscalBarrio: this.barrioControl,
      domicilioFiscalLocalidad: this.localidadControl,
      domicilioFiscalDireccion: this.direccionControl,
      domicilioFiscalDepartamento: this.departamentoControl,
      domicilioFiscalCodigoCiudad: this.codigoCiudadControl,
      codActividadEconomicaPrincipal: this.codActividadEconomicaPrincipalControl,
      descActividadEconomicaPrincipal: this.descActividadEconomicaPrincipalControl,
      listCodigoActividadEconomicaSecundaria: this.codActividadEconomicaSecundariaControl,
      listDescripcionActividadEconomicaSecundaria: this.descActividadEconomicaSecundariaControl,
    });

    if (this.selectedTimbrado.id) {
      this.cargarDatos();
    } else {
      this.isEditing = true;
    }

    this.setupConditionalValidations();
  }

  cargarDatos() {
    this.rucControl.setValue(this.selectedTimbrado.ruc);
    this.numeroControl.setValue(this.selectedTimbrado.numero);
    this.activoControl.setValue(this.selectedTimbrado.activo);
    this.razonSocialControl.setValue(this.selectedTimbrado.razonSocial);

    this.fechaInicioControl.setValue(
      this.selectedTimbrado.fechaInicio 
        ? (typeof this.selectedTimbrado.fechaInicio === 'string' 
            ? new Date(this.selectedTimbrado.fechaInicio) 
            : this.selectedTimbrado.fechaInicio)
        : null
    );
    
    this.fechaFinControl.setValue(
      this.selectedTimbrado.fechaFin 
        ? (typeof this.selectedTimbrado.fechaFin === 'string' 
            ? new Date(this.selectedTimbrado.fechaFin) 
            : this.selectedTimbrado.fechaFin)
        : null
    );

    this.cscControl.setValue(this.selectedTimbrado.csc);
    this.emailControl.setValue(this.selectedTimbrado.email);
    this.telefonoControl.setValue(this.selectedTimbrado.telefono);
    this.tipoSociedadControl.setValue(this.selectedTimbrado.tipoSociedad);
    this.isElectronicoControl.setValue(this.selectedTimbrado.isElectronico);
    this.ciudadControl.setValue(this.selectedTimbrado.domicilioFiscalCiudad);
    this.barrioControl.setValue(this.selectedTimbrado.domicilioFiscalBarrio);
    this.localidadControl.setValue(this.selectedTimbrado.domicilioFiscalLocalidad);
    this.direccionControl.setValue(this.selectedTimbrado.domicilioFiscalDireccion);
    this.departamentoControl.setValue(this.selectedTimbrado.domicilioFiscalDepartamento);
    this.codigoCiudadControl.setValue(this.selectedTimbrado.domicilioFiscalCodigoCiudad);
    this.codActividadEconomicaPrincipalControl.setValue(this.selectedTimbrado.codActividadEconomicaPrincipal);
    this.descActividadEconomicaPrincipalControl.setValue(this.selectedTimbrado.descActividadEconomicaPrincipal);
    this.codActividadEconomicaSecundariaControl.setValue(this.selectedTimbrado.listCodigoActividadEconomicaSecundaria);
    this.descActividadEconomicaSecundariaControl.setValue(this.selectedTimbrado.listDescripcionActividadEconomicaSecundaria);

    this.updateDateValidations(this.selectedTimbrado.isElectronico);
    this.formGroup.disable();
  }

  setupConditionalValidations() {
    this.isElectronicoControl.valueChanges.pipe(
      untilDestroyed(this),
      debounceTime(100)
    ).subscribe(isElectronico => {
      this.updateDateValidations(isElectronico);
    });

    this.activoControl.valueChanges.pipe(
      untilDestroyed(this),
      debounceTime(200)
    ).subscribe(activo => {
      this.validateTimbradoActivoUnico(activo);
    });

    this.fechaInicioControl.valueChanges.pipe(
      untilDestroyed(this),
      debounceTime(100)
    ).subscribe(() => {
      this.validateFechaComparacion();
    });

    this.fechaFinControl.valueChanges.pipe(
      untilDestroyed(this),
      debounceTime(100)
    ).subscribe(() => {
      this.validateFechaComparacion();
    });

    this.updateDateValidations(this.isElectronicoControl.value);
  }

  validateFechaComparacion() {
    const fechaInicio = this.fechaInicioControl.value;
    const fechaFin = this.fechaFinControl.value;
    
    const validacionClave = `${fechaInicio || 'null'}|${fechaFin || 'null'}`;
    
    if (validacionClave !== this.lastValidacionFecha && fechaInicio && fechaFin) {
      if (fechaInicio > fechaFin) {
        this.notificacionService.openWarn('La fecha de inicio no puede ser mayor que la fecha fin');
        this.lastValidacionFecha = validacionClave;
      } else {
        this.lastValidacionFecha = '';
      }
    }
    
    this.fechaFinControl.updateValueAndValidity();
    this.fechaInicioControl.updateValueAndValidity();
  }

  updateDateValidations(isElectronico: boolean) {
    if (isElectronico) {

      this.fechaFinControl.setValue(null);
      this.fechaFinControl.clearValidators();
      this.cscControl.setValidators([Validators.required]);
      this.fechaInicioControl.setValidators([Validators.required]);
    } else {

      this.cscControl.clearValidators();
      this.fechaFinControl.setValidators([Validators.required]);
      this.fechaInicioControl.setValidators([Validators.required]);
    }

    this.cscControl.updateValueAndValidity();
    this.fechaFinControl.updateValueAndValidity();
    this.fechaInicioControl.updateValueAndValidity();
  }

  validateTimbradoActivoUnico(activo: boolean) {
    if (activo) {
      const excludeId = this.selectedTimbrado.id || null;
      this.timbradoService.onExisteTimbradoActivo(excludeId)
        .pipe(untilDestroyed(this))
        .subscribe(existeActivo => {
          if (existeActivo && this.activoControl.value === true) {
            this.activoControl.setValue(false);
            this.notificacionService.notification$.next({
              texto: 'Ya existe un timbrado activo. Solo puede haber un timbrado activo a la vez.',
              duracion: 3,
              color: NotificacionColor.danger
            })
          }
        });
    }
  }

  onHabilitarEdicion() {
    this.isEditing = true;
    this.formGroup.enable();
  }

  onCancelar() {
    this.matDialogRef.close(null);
  }
  
  onGuardar() {
    if (this.formGroup.invalid) {
      return;
    }
    
    this.selectedTimbrado.fechaFin = this.fechaFinControl.value;
    this.selectedTimbrado.usuario = this.mainService.usuarioActual;
    this.selectedTimbrado.ruc = this.rucControl.value?.toUpperCase();
    this.selectedTimbrado.activo = this.activoControl.value ?? false;
    this.selectedTimbrado.csc = this.cscControl.value?.toUpperCase();
    this.selectedTimbrado.fechaInicio = this.fechaInicioControl.value;
    this.selectedTimbrado.email = this.emailControl.value?.toUpperCase();
    this.selectedTimbrado.numero = this.numeroControl.value?.toUpperCase();
    this.selectedTimbrado.telefono = this.telefonoControl.value?.toUpperCase();
    this.selectedTimbrado.isElectronico = this.isElectronicoControl.value ?? false;
    this.selectedTimbrado.razonSocial = this.razonSocialControl.value?.toUpperCase();
    this.selectedTimbrado.tipoSociedad = this.tipoSociedadControl.value?.toUpperCase();
    this.selectedTimbrado.domicilioFiscalCiudad = this.ciudadControl.value?.toUpperCase();
    this.selectedTimbrado.domicilioFiscalBarrio = this.barrioControl.value?.toUpperCase();
    this.selectedTimbrado.domicilioFiscalDireccion = this.direccionControl.value?.toUpperCase();
    this.selectedTimbrado.domicilioFiscalLocalidad = this.localidadControl.value?.toUpperCase();
    this.selectedTimbrado.domicilioFiscalDepartamento = this.departamentoControl.value?.toUpperCase();
    this.selectedTimbrado.domicilioFiscalCodigoCiudad = this.codigoCiudadControl.value?.toUpperCase();
    this.selectedTimbrado.codActividadEconomicaPrincipal = this.codActividadEconomicaPrincipalControl.value?.toUpperCase();
    this.selectedTimbrado.descActividadEconomicaPrincipal = this.descActividadEconomicaPrincipalControl.value?.toUpperCase();
    this.selectedTimbrado.listCodigoActividadEconomicaSecundaria = this.codActividadEconomicaSecundariaControl.value?.toUpperCase();
    this.selectedTimbrado.listDescripcionActividadEconomicaSecundaria = this.descActividadEconomicaSecundariaControl.value?.toUpperCase();

    let aux = new Timbrado();
    Object.assign(aux, this.selectedTimbrado);
    
    const inputData = aux.toInput();
    
    this.timbradoService.onSaveTimbrado(inputData)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
        
          this.notificacionService.openSucess('Guardado exitosamente');
          this.matDialogRef.close(res);
        }
      });
  }

  onRazonSocialSearch() {
    let data: SearchListtDialogData = {
      titulo: "Buscar Razón Social",
      query: this.timbradoSearch,     
      tableData: [
        { id: "id", nombre: "Id", width: "10%"},
        { id: "razonSocial", nombre: "Razón Social", width: "70%"},
        { id: "ruc", nombre: "RUC", width: "20%"}
      ],
      search: true,              
      isServidor: true,
      inicialSearch: true,
      queryData: { texto: "" },    
      paginator: false               
    };
    this.dialog.open(SearchListDialogComponent, {
      data: data,
      width: "50%",
      height: "50%"
    }).afterClosed()
    .pipe(untilDestroyed(this))
    .subscribe((res: any) => {
      if (res != null) {
        this.rucControl.setValue(res.ruc);
        this.emailControl.setValue(res.email);
        this.telefonoControl.setValue(res.telefono);
        this.razonSocialControl.setValue(res.razonSocial);
        this.tipoSociedadControl.setValue(res.tipoSociedad);
        this.ciudadControl.setValue(res.domicilioFiscalCiudad);
        this.barrioControl.setValue(res.domicilioFiscalBarrio);
        this.localidadControl.setValue(res.domicilioFiscalLocalidad);
        this.direccionControl.setValue(res.domicilioFiscalDireccion);
        this.codigoCiudadControl.setValue(res.domicilioFiscalCodigoCiudad);
        this.departamentoControl.setValue(res.domicilioFiscalDepartamento);
        this.codActividadEconomicaPrincipalControl.setValue(res.codActividadEconomicaPrincipal);
        this.descActividadEconomicaPrincipalControl.setValue(res.descActividadEconomicaPrincipal);
        this.codActividadEconomicaSecundariaControl.setValue(res.listCodigoActividadEconomicaSecundaria);
        this.descActividadEconomicaSecundariaControl.setValue(res.listDescripcionActividadEconomicaSecundaria);
        
        this.descActividadEconomicaSecundariaControl.markAsTouched();
        this.codActividadEconomicaSecundariaControl.markAsTouched();
        this.descActividadEconomicaPrincipalControl.markAsTouched();
        this.codActividadEconomicaPrincipalControl.markAsTouched();
        this.codigoCiudadControl.markAsTouched();
        this.departamentoControl.markAsTouched();
        this.tipoSociedadControl.markAsTouched();
        this.razonSocialControl.markAsTouched();
        this.direccionControl.markAsTouched();
        this.localidadControl.markAsTouched();
        this.telefonoControl.markAsTouched();
        this.barrioControl.markAsTouched();
        this.ciudadControl.markAsTouched();
        this.emailControl.markAsTouched();
        this.rucControl.markAsTouched();
      }
    })
  }

}
