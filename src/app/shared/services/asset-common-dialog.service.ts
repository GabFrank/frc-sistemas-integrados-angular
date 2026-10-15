import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { AdicionarPersonaDialogComponent } from '../../modules/personas/persona/adicionar-persona-dialog/adicionar-persona-dialog.component';
import { Persona } from '../../modules/personas/persona/persona.model';
import { Proveedor } from '../../modules/personas/proveedor/proveedor.model';
import { Pais } from '../../modules/general/pais/pais.model';
import { Ciudad } from '../../modules/general/ciudad/ciudad.model';
import { Vehiculo } from '../../modules/activos/vehiculos/vehiculo/models/vehiculo.model';
import { BuscadorService, OpcionesBuscador, TipoBuscador } from './buscador.service';

/** Atajos con callback sobre los presets de BuscadorService, para las pantallas de activos. */
@Injectable({
  providedIn: 'root'
})
export class AssetCommonDialogService {
  private dialog = inject(MatDialog);
  private buscador = inject(BuscadorService);

  buscarPersona(callback: (persona: Persona) => void): void {
    this.buscar('persona', callback, { adicionar: true });
  }

  adicionarPersona(): Observable<Persona | undefined> {
    return this.dialog.open(AdicionarPersonaDialogComponent, {
      width: '700px'
    }).afterClosed();
  }

  buscarMoneda(callback: (moneda: any) => void): void {
    this.buscar('moneda', callback);
  }

  buscarProveedor(callback: (proveedor: Proveedor) => void): void {
    this.buscar('proveedor', callback);
  }

  buscarPais(callback: (pais: Pais) => void): void {
    this.buscar('pais', callback);
  }

  buscarCiudad(callback: (ciudad: Ciudad) => void): void {
    this.buscar('ciudad', callback);
  }

  buscarVehiculo(callback: (vehiculo: Vehiculo) => void): void {
    this.buscar('vehiculo', callback);
  }

  private buscar(tipo: TipoBuscador, callback: (res: any) => void, opciones: OpcionesBuscador = {}): void {
    this.buscador.abrir(tipo, opciones).subscribe(res => {
      if (res) callback(res);
    });
  }
}
