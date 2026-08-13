import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// Visor de documentos del legajo. Usa un iframe con data-URI (funciona para
// imágenes y PDFs dentro de Electron; window.open() estaba bloqueado).
@Component({
  selector: 'app-documento-viewer-dialog',
  template: `
    <div class="doc-viewer">
      <div class="doc-viewer-bar">
        <span>{{ data?.titulo || 'Documento' }}</span>
        <button mat-icon-button mat-dialog-close><mat-icon>close</mat-icon></button>
      </div>
      <iframe [src]="safeUrl" class="doc-viewer-frame" *ngIf="safeUrl"></iframe>
    </div>
  `,
  styles: [`
    .doc-viewer { display: flex; flex-direction: column; height: 84vh; }
    .doc-viewer-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 4px 4px 4px 12px; font-size: 13px; opacity: 0.9;
    }
    .doc-viewer-frame { flex: 1 1 auto; width: 100%; border: 0; background: #fff; border-radius: 4px; }
  `]
})
export class DocumentoViewerDialogComponent {
  safeUrl: SafeResourceUrl;
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, sanitizer: DomSanitizer) {
    if (data?.src) {
      this.safeUrl = sanitizer.bypassSecurityTrustResourceUrl(data.src);
    }
  }
}
