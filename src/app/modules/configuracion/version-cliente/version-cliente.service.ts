import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { CONTEXTO_SONDEO, LECTURA_ESTRICTA } from '../../../generics/generic-crud.constantes';
import { VersionMinimaDesktopGQL } from './graphql/versionMinimaDesktop';
import { SetVersionMinimaDesktopGQL } from './graphql/setVersionMinimaDesktop';

/** Versión mínima del desktop que el central admite (`versionMinimaDesktop`). */
@Injectable({
  providedIn: 'root'
})
export class VersionClienteService {

  constructor(
    private versionMinimaDesktopGQL: VersionMinimaDesktopGQL,
    private setVersionMinimaDesktopGQL: SetVersionMinimaDesktopGQL,
    private genericService: GenericCrudService,
  ) {}

  /**
   * La versión mínima, sin spinner ni avisos: el error (de red o del servidor, como el de un central
   * que no conoce la consulta) llega al `error:` de quien llama. null = sin control.
   */
  onGetVersionMinimaEnSegundoPlano(): Observable<string> {
    return this.genericService.onCustomQuery(
      this.versionMinimaDesktopGQL, {}, true, LECTURA_ESTRICTA, true, CONTEXTO_SONDEO
    );
  }

  /** null o vacío apaga el control. Solo ADMIN; el rechazo lo avisa el genérico. */
  onSetVersionMinima(version: string | null): Observable<string> {
    return this.genericService.onSaveCustom(this.setVersionMinimaDesktopGQL, { version }, true, { avisarExito: false });
  }
}
