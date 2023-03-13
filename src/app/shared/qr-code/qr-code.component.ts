import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';


//  ejemp
// frc-1-TRANSFERENCIA-33-EditTransferenciaComponent
export interface QrData {
  sucursalId?;
  tipoEntidad?;
  idOrigen?;
  idCentral?;
  componentToOpen?;
  data?;
  timestamp?;
}

export interface QrCodeDialogData {
  nombre: any;
  codigo: QrData;
  segundos?: number;
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
  countdown = null;
  timer;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: QrCodeDialogData,
    public dialogRef: MatDialogRef<QrCodeComponent>,
  ) {
    this.value = codificarQr(data.codigo)
    this.codigoAlfanumerico = data.codigo.tipoEntidad + '-' + data.codigo.sucursalId + '-' + data.codigo.idOrigen;
    if (data.segundos != null) {
      this.countdown = data.segundos;
      this.timer = setInterval(() => {
        this.countdown--;
        if (this.countdown == 0) {
          clearInterval(this.timer)
          dialogRef.close()
        }
      }, 1000);
    }
  }

  ngOnInit(): void {

  }

  onSalir() {
    clearTimeout(this.timer)
    this.dialogRef.close()
  }

}

//logica de codigos qr
// frc-sucursal-tipoEntidad-id-componentToOpen

export function codificarQr(data: QrData): string {
  return 'frc-' + data?.sucursalId + '-' + data?.tipoEntidad + '-' + data?.idOrigen + '-' + data?.idCentral + '-' + data?.componentToOpen + '-' + data?.data + '-' + data?.timestamp;
}

export function descodificarQr(codigo: string) {
  let arr = codigo.split('-');
  let res: QrData = {
    sucursalId: arr[1],
    tipoEntidad: arr[2],
    idOrigen: arr[3],
    idCentral: arr[4],
    componentToOpen: arr[5],
    data: arr[6],
    timestamp: arr[7]
  }
  return res;
}  
