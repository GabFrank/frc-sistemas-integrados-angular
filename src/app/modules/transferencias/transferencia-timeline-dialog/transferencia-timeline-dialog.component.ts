import { MatDialogRef } from '@angular/material/dialog';
import { EtapaTransferencia } from '../../operaciones/transferencia/transferencia.model';
import { TimelineData } from '../../../shared/timeline/timeline.component';
import { TransferenciaComponent } from '../../operaciones/transferencia/transferencia.component';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { Transferencia } from '../../operaciones/transferencia/transferencia.model';

export interface TransferenciaTimelineData {
  transferencia: Transferencia;
}

@Component({
  selector: 'app-transferencia-timeline-dialog',
  templateUrl: './transferencia-timeline-dialog.component.html',
  styleUrls: ['./transferencia-timeline-dialog.component.scss']
})
export class TransferenciaTimelineDialogComponent implements OnInit {

  timelineData: TimelineData[];

  finalizado = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private transferencia: Transferencia,
    private matDialogRef: MatDialogRef<TransferenciaTimelineDialogComponent>
  ) {
  }

  ngOnInit(): void {
    this.timelineData = [
      {
        texto: 'Creación',
        fecha: this.transferencia?.creadoEn,
        usuario: this.transferencia?.usuarioPreTransferencia,
        terminado: this.transferencia?.usuarioPreparacion != null
      },
      {
        texto: 'Preparación',
        fecha: this.transferencia?.creadoEn,
        usuario: this.transferencia?.usuarioPreparacion,
        terminado: this.transferencia?.usuarioTransporte != null
      },
      {
        texto: 'Transporte',
        fecha: this.transferencia?.creadoEn,
        usuario: this.transferencia?.usuarioTransporte,
        terminado: this.transferencia?.usuarioRecepcion != null
      },
      {
        texto: 'Recepción',
        fecha: this.transferencia?.creadoEn,
        usuario: this.transferencia?.usuarioRecepcion,
        terminado: this.transferencia?.usuarioRecepcion != null
      }
    ]

  this.finalizado = this.transferencia.etapa == EtapaTransferencia.RECEPCION_CONCLUIDA   

  }

  onVerEtapa(item: TimelineData){
    this.matDialogRef.close(item.texto)
  }

}
