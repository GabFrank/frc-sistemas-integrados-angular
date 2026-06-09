export interface InmuebleInput {
    id?: number;
    propietarioId?: number;
    nombreAsignado?: string;
    paisId?: number;
    ciudadId?: number;
    direccion?: string;
    googleMapsUrl?: string;
    codigoCatastral?: string;
    valorTasacion?: number;
    valorTasacionPyg?: number;
    valorTasacionBrl?: number;
    situacionPago?: string;
    proveedorId?: number;
    monedaId?: number;
    montoTotal?: number;
    montoYaPagado?: number;
    cantidadCuotas?: number;
    cantidadCuotasPagadas?: number;
    diaVencimiento?: number;
    esPropio?: boolean;
    alquilerProveedorId?: number;
    alquilerMonto?: number;
    alquilerDiaVencimiento?: number;
    alquilerVigencia?: string;
    usuarioId?: number;
    cuotasDetalle?: { numeroCuota: number; monto: number; pagado?: boolean }[];
}
