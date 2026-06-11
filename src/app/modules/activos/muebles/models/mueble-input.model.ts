export interface MuebleInput {
    id?: number;
    propietarioId?: number;
    identificador?: string;
    descripcion?: string;
    familiaId?: number;
    tipoMuebleId?: number;
    consumeEnergia?: boolean;
    consumoValor?: string;
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
    usuarioId?: number;
}
