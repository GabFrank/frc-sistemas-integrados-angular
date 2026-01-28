import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { GpsService } from '../vehiculo/gps.service';
import { Gps } from '../vehiculo/models/gps.model';
import { VehiculoService } from '../vehiculo/vehiculo.service';
import { Vehiculo } from '../vehiculo/models/vehiculo.model';
import * as L from 'leaflet';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'list-mapas',
  templateUrl: './list-mapas.component.html',
  styleUrls: ['./list-mapas.component.scss']
})
export class ListMapasComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('mapContainer', { static: false }) mapContainerRef!: ElementRef<HTMLDivElement>;

  private gpsService = inject(GpsService);
  private vehiculoService = inject(VehiculoService);

  private map: L.Map | undefined;
  private markers: Map<number, L.Marker> = new Map();
  private pollSubscription: Subscription | undefined;
  private initRetryCount = 0;

  vehiculos: Vehiculo[] = [];
  selectedVehiculoControl = new FormControl<Vehiculo | null>(null);

  private carIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style='background-color: #f44336; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);'>
            <i class="material-icons" style="color: white; font-size: 18px;">directions_car</i>
           </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  constructor() { }

  ngOnInit(): void {
    this.cargarVehiculos();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
    }, 300);
  }

  ngOnDestroy(): void {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
    }
    if (this.map) {
      this.map.remove();
    }
  }

  private cargarVehiculos(): void {
    this.vehiculoService.onFiltrar('', 0, 100)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.vehiculos = res;
      });
  }

  private initMap(): void {
    const mapElement = document.getElementById('map');

    if (!mapElement) {
      if (this.initRetryCount < 10) {
        this.initRetryCount++;
        setTimeout(() => this.initMap(), 500);
      }
      return;
    }

    const rect = mapElement.getBoundingClientRect();
    if (rect.height === 0 || rect.width === 0) {
      if (this.initRetryCount < 10) {
        this.initRetryCount++;
        setTimeout(() => this.initMap(), 500);
      }
      return;
    }

    try {
      this.map = L.map('map', {
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

      const osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap HOT',
        maxZoom: 19
      });
      const openTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenTopoMap',
        maxZoom: 17
      });

      const cartoVoyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      });

      const cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      });

      const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      });

      osmStandard.addTo(this.map);

      const baseMaps = {
        "OpenStreetMap": osmStandard,
        "Humanitario (edificios)": osmHOT,
        "Topográfico Detallado": openTopoMap,
        "Satelital + Nombres": satelliteHybrid,
        "Solo Satelital": esriSatellite,
        "Voyager (Moderno)": cartoVoyager,
        "Oscuro": cartoDark
      };

      L.control.layers(baseMaps).addTo(this.map);

      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);

      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 500);

      this.startPolling();

    } catch (error) {
    }
  }

  private startPolling(): void {
    this.pollSubscription = interval(5000)
      .pipe(
        switchMap(() => this.gpsService.onSearch(''))
      )
      .subscribe(gpsList => {
        this.procesarDatosGps(gpsList);
      });

    this.gpsService.onSearch('').subscribe(gpsList => {
      this.procesarDatosGps(gpsList);
    });
  }

  private procesarDatosGps(gpsList: Gps[]): void {
    const selectedVehiculo = this.selectedVehiculoControl.value;
    let filteredList = gpsList;

    if (selectedVehiculo && selectedVehiculo.id) {
      filteredList = gpsList.filter(g => g.vehiculo?.id === selectedVehiculo.id);
    }

    this.updateMarkers(filteredList);
    this.limpiarMarcadoresNoVisibles(filteredList);
  }

  private limpiarMarcadoresNoVisibles(visibleGpsList: Gps[]): void {
    const visibleIds = new Set(visibleGpsList.map(g => g.id));

    Array.from(this.markers.keys()).forEach(id => {
      if (!visibleIds.has(id)) {
        const marker = this.markers.get(id);
        if (marker && this.map) {
          marker.remove();
        }
        this.markers.delete(id);
      }
    });
  }

  private updateMarkers(gpsList: Gps[]): void {
    if (!this.map) return;

    gpsList.forEach(gps => {
      if (gps.ultimaTelemetria && gps.ultimaTelemetria.latitud && gps.ultimaTelemetria.longitud) {
        const lat = gps.ultimaTelemetria.latitud;
        const lng = gps.ultimaTelemetria.longitud;

        let marker = this.markers.get(gps.id);

        if (marker) {
          marker.setLatLng([lat, lng]);
          this.updatePopup(marker, gps);
        } else {
          marker = L.marker([lat, lng], { icon: this.carIcon }).addTo(this.map!);
          this.updatePopup(marker, gps);
          this.markers.set(gps.id, marker);
        }
      }
    });
  }

  private updatePopup(marker: L.Marker, gps: Gps): void {
    const popupContent = `
      <div style="color: black; text-align: center;">
        <h4 style="margin: 0; font-weight: bold;">${gps.vehiculo?.chapa || 'Sin Chapa'}</h4>
        <p style="margin: 5px 0;">IMEI: ${gps.imei}</p>
        <p style="margin: 5px 0;">Velocidad: ${gps.ultimaTelemetria?.velocidad || 0} km/h</p>
        <p style="margin: 5px 0;">Fecha: ${gps.ultimaTelemetria?.fechaGps ? new Date(gps.ultimaTelemetria.fechaGps).toLocaleString() : 'N/A'}</p>
      </div>
    `;
    marker.bindPopup(popupContent);
    marker.bindTooltip(`${gps.vehiculo?.chapa || gps.imei}`, { permanent: false, direction: 'top' });
  }

  private fitBounds(gpsList: Gps[]): void {
    if (!this.map) return;

    const bounds = L.latLngBounds([]);
    let hasPoints = false;

    gpsList.forEach(gps => {
      if (gps.ultimaTelemetria && gps.ultimaTelemetria.latitud && gps.ultimaTelemetria.longitud) {
        bounds.extend([gps.ultimaTelemetria.latitud, gps.ultimaTelemetria.longitud]);
        hasPoints = true;
      }
    });

    if (hasPoints) {
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }

  onVehiculoSelect(): void {
    this.gpsService.onSearch('').subscribe(gpsList => {
      this.procesarDatosGps(gpsList);

      const selectedVehiculo = this.selectedVehiculoControl.value;
      if (selectedVehiculo && selectedVehiculo.id) {
        const gps = gpsList.find(g => g.vehiculo?.id === selectedVehiculo.id);
        if (gps && gps.ultimaTelemetria?.latitud && gps.ultimaTelemetria?.longitud) {
          this.map?.setView([gps.ultimaTelemetria.latitud, gps.ultimaTelemetria.longitud], 16);
        }
      } else {
        this.fitBounds(gpsList);
      }
    });
  }
}
