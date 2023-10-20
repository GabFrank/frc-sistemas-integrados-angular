import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ElectronService } from '../../../commons/core/electron/electron.service';
import { MainService } from '../../../main.service';


export interface DialogoNuevasFunciones {
  id: number;
  componente: any;
  version: string;
  titulo: string;
  mensaje: string;
}

@Component({
  selector: 'dialogo-nuevas-funciones',
  templateUrl: './dialogo-nuevas-funciones.component.html',
  styleUrls: ['./dialogo-nuevas-funciones.component.scss']
})
export class DialogoNuevasFuncionesComponent implements OnInit{

  dialogos: string;
  dialogosArray: string[] = [];
  appVersion = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogoNuevasFunciones,
    public matDialogRef: MatDialogRef<DialogoNuevasFunciones>,
    private electronService: ElectronService,
    private mainService: MainService
  ){}

  ngOnInit(): void {

    this.appVersion = this.electronService.getAppVersion();

    this.data.version = this.appVersion;
    
    this.dialogos = localStorage.getItem('dialogosNuevasFunciones');
    if(this.dialogos!= null){
      this.dialogosArray = this.dialogos.split(',').map(s => s.trim());
      if(this.dialogosArray.find(s => s.includes(this.data.version + this.data.componente?.name + "-" + this.mainService.usuarioActual.id)) != null){
        this.matDialogRef.close()
      }
    }

  }

  onClose(){
    this.dialogosArray.push(this.data.version + this.data.componente?.name  + "-" + this.mainService.usuarioActual.id);
    localStorage.setItem('dialogosNuevasFunciones', this.dialogosArray.join(', '));
    this.matDialogRef.close();
  }

}
