import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';


//  ejemp
// frc-1-TRANSFERENCIA-33-EditTransferenciaComponent
export interface QrData {
  sucursalId;
  tipoEntidad;
  id;
  componentToOpen;
}

export interface QrCodeDialogData {
  nombre: any;
  codigo: QrData;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { QrcodeComponent } from '@techiediaries/ngx-qrcode';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-qr-code',
  templateUrl: './qr-code.component.html',
  styleUrls: ['./qr-code.component.scss']
})
export class QrCodeComponent implements OnInit {


  value = '';
  isQrShow = true;
  isImageLoaded = false;
  isWaiting = false;
  codigoAlfanumerico: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: QrCodeDialogData,
    public dialogRef: MatDialogRef<QrCodeComponent>, 
  ) { 
    this.value = codificarQr(data.codigo)
    this.codigoAlfanumerico = data.codigo.tipoEntidad+'-'+data.codigo.sucursalId+'-'+data.codigo.id;
  }

  ngOnInit(): void {

  }

  onSalir(){
    this.dialogRef.close()
  }

  // onRefresh(){
  //   // let ref = this.storage.ref(`productos/${this.data.codigo}`).getDownloadURL().subscribe(res => {
  //     let ref = this.storage.ref(`productos/${this.data.codigo}`).getDownloadURL().pipe(untilDestroyed(this)).subscribe(res => {
  //       this.isWaiting = true;
  //       this.isQrShow = false;
  //       if(res!=null){
  //       let xhr = new XMLHttpRequest();
  //       xhr.responseType = 'blob';
  //       xhr.onload = (event) => {
  //         if(xhr.response!=null){
  //           this.dialogRef.close(xhr.response)
  //         } else {
  //           this.isQrShow = true;
  //           this.isWaiting = false;
  //         }
  //       }
  //       xhr.open('GET', res);
  //       xhr.send()
        
  //     }
  //   })
  // }

}

//logica de codigos qr
// frc-sucursal-tipoEntidad-id-componentToOpen

export function codificarQr(data: QrData): string{
  return 'frc-'+data.sucursalId+'-'+data.tipoEntidad+'-'+data.id+'-'+data.componentToOpen;
}

export function descodificarQr(codigo: string){
  let arr = codigo.split('-');
  let res: QrData = {
    sucursalId: arr[1],
    tipoEntidad: arr[2],
    id: arr[3],
    componentToOpen: arr[4]
  }
  return res;
}
