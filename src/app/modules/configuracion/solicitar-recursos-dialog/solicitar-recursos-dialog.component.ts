import { Component, OnInit } from '@angular/core';
import { ConfiguracionService } from '../configuracion.service';

@Component({
  selector: 'app-solicitar-recursos-dialog',
  templateUrl: './solicitar-recursos-dialog.component.html',
  styleUrls: ['./solicitar-recursos-dialog.component.scss']
})
export class SolicitarRecursosDialogComponent implements OnInit {

  constructor(
    private configuracionService: ConfiguracionService
  ) { }

  ngOnInit(): void {
  }

  onSolicitar(){
    this.configuracionService.solicitarResources().subscribe(res => {
      
    })
  }

}
