import gql from 'graphql-tag';

export const solicitudesPagoPendientesQuery = gql`
  query ($proveedorId: ID) {
    data: solicitudesPagoPendientes(proveedorId: $proveedorId) {
      id
      numeroSolicitud
      fechaSolicitud
      montoTotal
      montoPagado
      estado
      proveedor { id persona { id nombre } }
      moneda { id denominacion simbolo principal decimales }
      detalles {
        id
        orden
        valor
        fechaPago
        diferido
        nominal
        formaPago { id descripcion }
      }
    }
  }
`;

export const gastosPendientesQuery = gql`
  query {
    data: gastosPendientes {
      id
      numeroSolicitud
      fechaSolicitud
      montoTotal
      montoPagado
      estado
      tipo
      observaciones
      tipoGasto { id descripcion }
      proveedor { id persona { id nombre } }
      moneda { id denominacion simbolo principal decimales }
    }
  }
`;

export const crearGastoParaPagoMutation = gql`
  mutation ($input: GastoParaPagoInput!) {
    data: crearGastoParaPago(input: $input) {
      id
      numeroSolicitud
      montoTotal
      montoPagado
      estado
      tipo
      observaciones
      proveedor { id persona { id nombre } }
      moneda { id denominacion simbolo principal decimales }
    }
  }
`;

export const chequerasPorCuentaQuery = gql`
  query ($cuentaBancariaId: ID!, $soloActivas: Boolean) {
    data: chequerasPorCuenta(cuentaBancariaId: $cuentaBancariaId, soloActivas: $soloActivas) {
      id
      nombre
      siguienteNumero
      rangoHasta
      estado
      hojasDisponibles
      cuentaBancaria { id numero moneda { id denominacion simbolo principal decimales } }
    }
  }
`;

export const pagarSolicitudesLoteCajaMayorMutation = gql`
  mutation ($cajaVirtualId: ID!, $pagos: [PagoLoteInput!]!) {
    data: pagarSolicitudesLoteCajaMayor(cajaVirtualId: $cajaVirtualId, pagos: $pagos) {
      id
      estado
    }
  }
`;

export const pagarSolicitudesMixtoMutation = gql`
  mutation ($pagos: [SolicitudConLineasInput!]!) {
    data: pagarSolicitudesMixto(pagos: $pagos) {
      id
      estado
    }
  }
`;

export const anularPagoCppMutation = gql`
  mutation ($pagoId: ID!, $motivo: String) {
    data: anularPagoCpp(pagoId: $pagoId, motivo: $motivo) {
      id
      estado
    }
  }
`;

// ── Modo VALES ──
// El vale es la unidad pagable (no la SolicitudPago): su obligacion de pago se crea/resuelve
// en el backend. Por eso la query devuelve ValePendiente y la mutation toma valeId.
export const valesPendientesQuery = gql`
  query {
    data: valesPendientes {
      id
      fecha
      monto
      saldoPendiente
      esAdelanto
      observacion
      funcionarioNombre
      motivoDescripcion
      funcionario { id persona { id nombre } }
      motivo { id descripcion }
      moneda { id denominacion simbolo principal decimales }
    }
  }
`;

export const crearValeParaPagoMutation = gql`
  mutation ($input: ValeParaPagoInput!) {
    data: crearValeParaPago(input: $input) {
      id
      monto
      estado
      esAdelanto
      observacion
      funcionario { id persona { id nombre } }
      moneda { id denominacion simbolo principal decimales }
    }
  }
`;

export const pagarValesMixtoMutation = gql`
  mutation ($pagos: [ValeConLineasInput!]!) {
    data: pagarValesMixto(pagos: $pagos) {
      id
      estado
    }
  }
`;

// ── Pago de documentos de RRHH desde la caja (liquidacion / finiquito / aguinaldo) ──
// Mismo puente que el vale: la obligacion de pago es una SolicitudPago tipo RRHH y el
// pago va por el motor de CPP. Los tres conceptos comparten proyeccion.
const pagoRrhhPendienteFields = `
  concepto
  id
  fecha
  periodo
  monto
  saldoPendiente
  descripcion
  funcionarioNombre
  funcionario { id persona { id nombre } }
  moneda { id denominacion simbolo principal decimales }
`;

export const liquidacionesPendientesPagoQuery = gql`
  query {
    data: liquidacionesPendientesPago { ${pagoRrhhPendienteFields} }
  }
`;

export const finiquitosPendientesPagoQuery = gql`
  query {
    data: finiquitosPendientesPago { ${pagoRrhhPendienteFields} }
  }
`;

export const aguinaldosPendientesPagoQuery = gql`
  query {
    data: aguinaldosPendientesPago { ${pagoRrhhPendienteFields} }
  }
`;

export const pagarRrhhMixtoMutation = gql`
  mutation ($pagos: [PagoRrhhConLineasInput!]!) {
    data: pagarRrhhMixto(pagos: $pagos) {
      id
      estado
    }
  }
`;

// Desglose de un evento de pago: que documentos se pagaron y cuanto se imputo a cada uno.
// Lo necesita el detalle del movimiento consolidado, cuya descripcion no puede nombrar a los N.
export const detalleDePagoQuery = gql`
  query ($pagoId: ID!) {
    data: detalleDePago(pagoId: $pagoId) {
      solicitudPagoId
      tipo
      descripcion
      proveedorNombre
      monedaDenominacion
      monedaSimbolo
      decimales
      montoImputado
      montoTotal
      montoPagado
      estado
    }
  }
`;
