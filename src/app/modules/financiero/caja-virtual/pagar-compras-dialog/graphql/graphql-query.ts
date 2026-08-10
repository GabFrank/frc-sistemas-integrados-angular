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
