import { Producto } from '../../productos/producto/producto.model';
import { Sucursal } from '../../empresarial/sucursal/sucursal.model';

export type ModoParticipacionSorteo = 'UNA_POR_VENTA' | 'POR_MULTIPLO' | 'CANTIDAD_FIJA';

export class SorteoPremio {
  id: number;
  orden: number;
  descripcion: string;
  producto: Producto;
  cantidad: number;
}

export class Sorteo {
  id: number;
  nombre: string;
  descripcion: string;
  montoMinimo: number;
  modoParticipacion: ModoParticipacionSorteo;
  cantidadFija: number;
  topePorVenta: number;
  incluyeTarjeta: boolean;
  /** "yyyy-MM-dd 00:00" desde el backend; leer con stringToLocalDate. */
  fechaDesde: string;
  fechaHasta: string;
  fechaSorteo: string;
  todasSucursales: boolean;
  activo: boolean;
  sucursales: Sucursal[];
  premios: SorteoPremio[];
  creadoEn: string;
  usuarioNickname: string;
  tieneParticipaciones: boolean;
}

export class SorteoPremioInput {
  descripcion: string | null;
  productoId: number | null;
  cantidad: number;
}

export class SorteoInput {
  id?: number | null;
  nombre: string;
  descripcion: string | null;
  montoMinimo: number;
  modoParticipacion: ModoParticipacionSorteo;
  cantidadFija: number | null;
  topePorVenta: number | null;
  incluyeTarjeta: boolean;
  fechaDesde: string | null;
  fechaHasta: string | null;
  fechaSorteo: string | null;
  todasSucursales: boolean;
  sucursalIds: number[];
  premios: SorteoPremioInput[];
}

export class SorteoParticipacion {
  id: number;
  sucursalId: number;
  sucursalNombre: string;
  ventaId: number;
  codigo: string;
  cantidad: number;
  clienteNombre: string;
  documento: string;
  anulada: boolean;
  creadoEn: string;
}

export class SorteoResumenSucursal {
  sucursalId: number;
  sucursalNombre: string;
  participaciones: number;
  tickets: number;
}

/** Sorteo en el que califica una venta, según la filial (`sorteosAplicables`). */
export class SorteoAplicable {
  sorteoId: number;
  nombre: string;
  descripcion: string;
  cantidadTickets: number;
  fechaSorteo: string;
  fechaDesde: string;
  fechaHasta: string;
  premios: string[];
}

/** Quién participa del sorteo con la venta (`saveVenta(sorteoCliente)`). Null = no participa. */
export class SorteoClienteInput {
  clienteId?: number | null;
  documento?: string | null;
  nombre: string;
}

/** Tickets de sorteo que salieron con una venta (`Venta.sorteoTickets`). */
export class SorteoTicketInfo {
  nombreSorteo: string;
  cantidad: number;
}
