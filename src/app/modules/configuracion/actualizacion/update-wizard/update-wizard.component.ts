import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ipAddress, port, version } from '../../../../../environments/conectionConfig';
import { Actualizacion } from '../actualizacion.model';

@UntilDestroy()
@Component({
  selector: 'app-update-wizard',
  templateUrl: './update-wizard.component.html',
  styleUrls: ['./update-wizard.component.scss']
})
export class UpdateWizardComponent implements OnInit {

  versionActual = version;
  selectedActualizacion: Actualizacion
  progress = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) private actualizacion: Actualizacion,
    private http: HttpClient
  ) {
    if (actualizacion != null) {
      this.selectedActualizacion = actualizacion;
    }
  }

  ngOnInit(): void {
  }

  onCancelar() {

  }
  onDescargar() {
    let url = `http://${ipAddress}:${port}/update/download/frc-app-v${this.selectedActualizacion.currentVersion}.exe`
    this.http.get(url, {
      responseType: 'blob',
      reportProgress: true,
      observe: 'events',
      headers: new HttpHeaders({ 'Content-Type': 'application/exe' }) 
    })
      .subscribe((result) => {
        if (result.type === HttpEventType.DownloadProgress) {
          this.progress = Math.round(100 * result.loaded / result.total);
        }
        if (result.type === HttpEventType.Response) {
          this.downloadFile(result.body, );
        }
      })
  }

  downloadFile(data) {
    let blob = new Blob([data], {type: 'application/octet-stream'})
    const url = window.URL.createObjectURL(blob);
    const e = document.createElement('a');
    e.href = url;
    e.download = `frc-app-v${this.selectedActualizacion.currentVersion}.exe`;
    document.body.appendChild(e);
    e.click();
    document.body.removeChild(e);
  }

}
