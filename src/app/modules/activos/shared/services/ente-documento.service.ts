import { Injectable, inject } from '@angular/core';
import { ConfiguracionService } from '../../../../shared/services/configuracion.service';
import { urlsDeServidor } from '../../../../commons/core/utils/webEndpoints';

@Injectable({ providedIn: 'root' })
export class EnteDocumentoService {
  private config = inject(ConfiguracionService);

  urlDocumentoLocal(fileName: string): string {
    const cfg = this.config.getConfig();
    const ip = cfg?.serverIp || 'localhost';
    const port = cfg?.serverPort || '8082';
    const nombre = encodeURIComponent(fileName);
    return `${urlsDeServidor(ip, port).http}/api/activos/documentos/${nombre}`;
  }

  leerArchivoComoBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  esImagenPorNombre(fileName: string): boolean {
    const lower = (fileName || '').toLowerCase();
    return lower.endsWith('.png')
      || lower.endsWith('.jpg')
      || lower.endsWith('.jpeg')
      || lower.endsWith('.gif')
      || lower.endsWith('.webp');
  }

  esUrlExterna(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://');
  }
}
