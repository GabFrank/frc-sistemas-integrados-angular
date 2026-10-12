import { formatDate } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, Input, LOCALE_ID, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { Tab } from '../../../../../layouts/tab/tab.model';
import { Jornada } from '../../models/jornada.model';
import { Marcacion } from '../../models/marcacion.model';

/** Una marcación de la jornada, con lo que se sabe de dónde se hizo. */
export interface PuntoMarcacion {
  etiqueta: string;
  color: string;
  icono: string;
  hora: string;
  sucursal: string;
  distancia: number | null;
  precision: number | null;
  lat: number | null;
  lng: number | null;
}

/** `sucursal.localizacion` guarda «lat,lng» como texto; cualquier otra cosa no se dibuja. */
export function coordenadasDeLocalizacion(localizacion: string | null | undefined): [number, number] | null {
  const partes = String(localizacion ?? '').split(',');
  if (partes.length !== 2 || partes[0].trim() === '' || partes[1].trim() === '') return null;
  const lat = Number(partes[0].trim());
  const lng = Number(partes[1].trim());
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

export function tieneUbicacion(m: Marcacion | null | undefined): boolean {
  return m?.latitud != null && m?.longitud != null && !(Number(m.latitud) === 0 && Number(m.longitud) === 0);
}

/**
 * Muestra en un mapa dónde se hizo cada marcación de una jornada. Las capas (OpenStreetMap, satelital y Google
 * Maps) son las mismas del mapa de vehículos; acá no hay websocket ni búsqueda: solo se lee lo que ya trae la jornada.
 */
@Component({
  selector: 'ubicacion-marcacion',
  templateUrl: './ubicacion-marcacion.component.html',
  styleUrls: ['./ubicacion-marcacion.component.scss']
})
export class UbicacionMarcacionComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() data: Tab;
  @ViewChild('mapContainer') mapContainer: ElementRef<HTMLDivElement>;

  jornada: Jornada;
  puntos: PuntoMarcacion[] = [];
  hayUbicacion = false;

  private map: L.Map | undefined;
  private markers = new Map<PuntoMarcacion, L.Marker>();
  private initRetryCount = 0;
  private destruido = false;

  constructor(@Inject(LOCALE_ID) private locale: string) { }

  ngOnInit(): void {
    this.jornada = this.data?.tabData?.data;
    this.puntos = this.armarPuntos(this.jornada);
    this.hayUbicacion = this.puntos.some(p => p.lat != null);
  }

  ngAfterViewInit(): void {
    if (!this.hayUbicacion) return;
    setTimeout(() => this.initMap(), 300);
  }

  ngOnDestroy(): void {
    this.destruido = true;
    if (this.map) {
      this.map.remove();
    }
  }

  onCentrar(punto: PuntoMarcacion): void {
    if (!this.map || punto.lat == null) return;
    this.map.setView([punto.lat, punto.lng], 18);
    this.markers.get(punto)?.openPopup();
  }

  private armarPuntos(jornada: Jornada): PuntoMarcacion[] {
    if (!jornada) return [];
    const definiciones: { m: Marcacion, etiqueta: string, color: string, icono: string, esSalida: boolean }[] = [
      { m: jornada.marcacionEntrada, etiqueta: 'Entrada', color: '#4CAF50', icono: 'login', esSalida: false },
      { m: jornada.marcacionSalidaAlmuerzo, etiqueta: 'Salida almuerzo', color: '#FF9800', icono: 'restaurant', esSalida: true },
      { m: jornada.marcacionEntradaAlmuerzo, etiqueta: 'Retorno almuerzo', color: '#2196F3', icono: 'keyboard_return', esSalida: false },
      { m: jornada.marcacionSalida, etiqueta: 'Salida', color: '#f44336', icono: 'logout', esSalida: true }
    ];
    return definiciones.filter(d => d.m != null).map(d => {
      const fecha = d.esSalida ? (d.m.fechaSalida || d.m.fechaEntrada) : d.m.fechaEntrada;
      const con = tieneUbicacion(d.m);
      return {
        etiqueta: d.etiqueta,
        color: d.color,
        icono: d.icono,
        hora: this.formatear(fecha),
        sucursal: (d.m.sucursalEntrada?.nombre || d.m.sucursalSalida?.nombre || '').toUpperCase(),
        distancia: d.m.distanciaSucursalMetros ?? null,
        precision: d.m.precisionGps != null ? Math.round(d.m.precisionGps) : null,
        lat: con ? Number(d.m.latitud) : null,
        lng: con ? Number(d.m.longitud) : null
      };
    });
  }

  private formatear(fecha: string): string {
    if (!fecha) return '--:--';
    try {
      return formatDate(fecha, 'dd/MM/yyyy HH:mm', this.locale);
    } catch {
      return String(fecha);
    }
  }

  private initMap(): void {
    if (this.destruido) return;
    const mapElement = this.mapContainer?.nativeElement;
    const rect = mapElement?.getBoundingClientRect();

    if (!mapElement || rect.height === 0 || rect.width === 0) {
      if (this.initRetryCount < 10) {
        this.initRetryCount++;
        setTimeout(() => this.initMap(), 500);
      }
      return;
    }

    try {
      this.map = L.map(mapElement, {
        center: [-24.064024386388734, -54.3079173796453],
        zoom: 14
      });

      const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19
      });

      const esriReference = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxZoom: 19,
        pane: 'overlayPane'
      });

      const esriTransportation = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxZoom: 19,
        pane: 'overlayPane'
      });

      const satelliteHybrid = L.layerGroup([esriSatellite, esriReference, esriTransportation]);

      const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      });

      const googleMaps = L.tileLayer('http://mt0.google.com/vt/lyrs=m&hl=es&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google Maps',
        maxZoom: 19
      });

      googleMaps.addTo(this.map);

      const baseMaps = {
        "OpenStreetMap": osmStandard,
        "Satelital + Nombres": satelliteHybrid,
        "Google Maps": googleMaps
      };

      L.control.layers(baseMaps).addTo(this.map);

      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);

      this.dibujar();

    } catch (error) {
      console.error('Error inicializando mapa:', error);
    }
  }

  private dibujar(): void {
    if (!this.map) return;
    const bounds = L.latLngBounds([]);

    this.sucursalesDeLaJornada().forEach(({ nombre, coords }) => {
      L.marker(coords, { icon: this.icono('#607D8B', 'store') })
        .addTo(this.map!)
        .bindPopup(`<div style="color: black; text-align: center; font-size: 16px; line-height: 1.4;"><strong>Sucursal</strong><br>${this.escapar(nombre)}</div>`)
        .bindTooltip(`Sucursal ${nombre}`, { direction: 'top' });
      bounds.extend(coords);
    });

    this.puntos.filter(p => p.lat != null).forEach(p => {
      const posicion: [number, number] = [p.lat, p.lng];
      if (p.precision) {
        // El círculo es el margen de error que informó el teléfono: la persona estaba en algún punto adentro.
        L.circle(posicion, { radius: p.precision, color: p.color, weight: 1, fillOpacity: 0.12 }).addTo(this.map!);
      }
      const marker = L.marker(posicion, { icon: this.icono(p.color, p.icono) })
        .addTo(this.map!)
        .bindPopup(this.popup(p), { minWidth: 260, maxWidth: 360 })
        .bindTooltip(`<span style="font-size: 14px;">${p.etiqueta} - ${p.hora}</span>`, { direction: 'top' });
      this.markers.set(p, marker);
      bounds.extend(posicion);
    });

    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [60, 60], maxZoom: 18 });
    }
  }

  /** Sucursales con coordenadas cargadas, sin repetir: sirven de referencia para ver la separación. */
  private sucursalesDeLaJornada(): { nombre: string, coords: [number, number] }[] {
    const vistas = new Map<string, { nombre: string, coords: [number, number] }>();
    [this.jornada?.marcacionEntrada?.sucursalEntrada, this.jornada?.marcacionSalida?.sucursalSalida].forEach(suc => {
      const coords = coordenadasDeLocalizacion(suc?.localizacion);
      if (suc && coords && !vistas.has(String(suc.id))) {
        vistas.set(String(suc.id), { nombre: (suc.nombre || '').toUpperCase(), coords });
      }
    });
    return Array.from(vistas.values());
  }

  private icono(color: string, icono: string): L.DivIcon {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style='background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);'>
              <i class="material-icons" style="color: white; font-size: 18px;">${icono}</i>
             </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  }

  private popup(p: PuntoMarcacion): string {
    const fila = 'margin: 8px 0; font-size: 15px; line-height: 1.35;';
    const sucursal = p.sucursal ? `<p style="${fila}"><strong>Sucursal:</strong> ${this.escapar(p.sucursal)}</p>` : '';
    return `
      <div style="color: black; text-align: center; min-width: 260px;">
        <h4 style="margin: 0 0 6px 0; font-weight: bold; font-size: 22px; color: ${p.color};">${p.etiqueta}</h4>
        <p style="margin: 6px 0; font-size: 16px; color: #444;">${p.hora}</p>
        <hr style="margin: 10px 0; border: none; border-top: 1px solid #ddd;">
        ${sucursal}
        <p style="${fila}"><strong>Distancia a la sucursal:</strong> ${p.distancia != null ? p.distancia + ' m' : 'sin dato'}</p>
        <p style="${fila}"><strong>Precisión GPS:</strong> ${p.precision != null ? '± ' + p.precision + ' m' : 'sin dato'}</p>
        <p style="margin: 8px 0 0 0; font-size: 13px; color: #666;">${p.lat}, ${p.lng}</p>
      </div>
    `;
  }

  private escapar(texto: string): string {
    return String(texto ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
}
