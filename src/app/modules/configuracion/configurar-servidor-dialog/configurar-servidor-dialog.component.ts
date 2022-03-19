import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { SearchListDialogComponent, SearchListtDialogData } from '../../../shared/components/search-list-dialog/search-list-dialog.component';
import { Sucursal } from '../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../empresarial/sucursal/sucursal.service';

class Data {

}

@Component({
  selector: 'app-configurar-servidor-dialog',
  templateUrl: './configurar-servidor-dialog.component.html',
  styleUrls: ['./configurar-servidor-dialog.component.scss']
})
export class ConfigurarServidorDialogComponent implements OnInit {

  conexionGroup = new FormGroup({})
  sucursalGroup = new FormGroup({})
  sincronizarGroup = new FormGroup({})
  verificadoControl = new FormControl(null, Validators.required)
  sucursalControl = new FormControl(null, Validators.required)
  sincronizadoControl = new FormControl(null, Validators.required)
  sucursales: Sucursal;
  color: ThemePalette = 'primary';
  mode: ProgressSpinnerMode = 'indeterminate';
  value = 0;
  verificando = false;
  verificado = null;


  constructor(
    @Inject(MAT_DIALOG_DATA) private data: Data,
    private dialogRef: MatDialogRef<ConfigurarServidorDialogComponent>,
    private matDialog: MatDialog,
    private sucursalService: SucursalService
  ) { }

  ngOnInit(): void {
    this.conexionGroup.addControl('verificado', this.verificadoControl);
    this.sucursalGroup.addControl('sucursal', this.sucursalControl);
    this.sincronizarGroup.addControl('sincronizado', this.sincronizadoControl);
    this.sucursalControl.disable()
    this.sucursalService.getSucursalesAdmin().subscribe(res => {
      if(res!=null){
        this.sucursales = res;
      }
    })
  }

  onVerificar(){
    this.verificando = true;
    setTimeout(() => {
      this.verificado = true;
      this.verificando = false;
      this.verificadoControl.setValue(true)
    }, 1000);
  }

  onSalir(){

  }

  onSearchSucursal(){

    let data : SearchListtDialogData = {
      titulo: 'Seleccionar sucursal',
      query: null,
      tableData: [{id: 'id', nombre: 'Id', width: '20%'}, {id: 'nombre', nombre: 'Nombre', width: '80%'}],
      inicialData: this.sucursales
    }
    // data.
    this.matDialog.open(SearchListDialogComponent, {
      data,
      height: '100%',
      width: '80%'
    })
  }

}

//verificar conexcion con servidor principal
//buscar sucursal a configurar
//solicitar base de datos
//test
//fin
