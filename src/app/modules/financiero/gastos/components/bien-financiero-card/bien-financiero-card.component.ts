import { Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SolicitudGastoData } from '../../models/solicitud-gasto-data.model';

@Component({
  selector: 'app-bien-financiero-card',
  templateUrl: './bien-financiero-card.component.html',
  styleUrls: ['./bien-financiero-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BienFinancieroCardComponent implements OnChanges {
  @Input() data: SolicitudGastoData = {};
  @Input() notificacionVencimiento: string | null = null;
  
  precisionDisplay = '1.0-0';
  iconoDisplay: string = 'category';
  colorDisplay: string = '#9e9e9e';
  porcentajeDisplay: number = 0;
  montoCuotaDisplay: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.actualizarPropiedades();
    }
  }

  private actualizarPropiedades(): void {
    this.iconoDisplay = this.getIconoTipoBien();
    this.colorDisplay = this.getColorEstadoCuota();
    this.porcentajeDisplay = this.data?.porcentajePagado || 0;
    this.montoCuotaDisplay = this.data?.montoSugerido || 0;
  }

  private getIconoTipoBien(): string {
    const tipo = (this.data?.tipoBien || '').toUpperCase();
    if (tipo === 'MUEBLE') return 'chair';
    if (tipo === 'INMUEBLE') return 'domain';
    if (tipo === 'VEHICULO') return 'directions_car';
    return 'category';
  }

  private getColorEstadoCuota(): string {
    const estado = this.data?.estadoCuota || '';
    switch (estado) {
      case 'PAGADO': return '#66bb6a';
      case 'AL DIA': return '#42a5f5';
      case 'POR VENCER': return '#ffa726';
      case 'VENCIDO': return '#ef5350';
      default: return '#9e9e9e';
    }
  }
}
