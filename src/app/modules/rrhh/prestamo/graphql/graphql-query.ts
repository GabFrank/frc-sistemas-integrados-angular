import gql from "graphql-tag";

const PRESTAMO_FIELDS = `
  id
  funcionario { id persona { id nombre } }
  descripcion
  montoTotal
  montoPagado
  moneda { id denominacion }
  fechaInicio
  cantidadCuotas
  estado
  observacion
`;

const CUOTA_FIELDS = `id numero fechaVencimiento monto montoPagado estado fechaPago`;

export const prestamosPorFuncionarioQuery = gql`
  query ($funcionarioId: ID!) {
    data: prestamosPorFuncionario(funcionarioId: $funcionarioId) { ${PRESTAMO_FIELDS} }
  }
`;

export const prestamoCuotasQuery = gql`
  query ($prestamoId: ID!) {
    data: prestamoCuotas(prestamoId: $prestamoId) { ${CUOTA_FIELDS} }
  }
`;

export const crearPrestamoMutation = gql`
  mutation crearPrestamo($prestamo: PrestamoInput!, $cajaVirtualId: ID!) {
    data: crearPrestamo(prestamo: $prestamo, cajaVirtualId: $cajaVirtualId) { ${PRESTAMO_FIELDS} }
  }
`;

export const cobrarCuotaMutation = gql`
  mutation cobrarCuota($cuotaId: ID!, $cajaVirtualId: ID!, $montoPago: Float) {
    data: cobrarCuota(cuotaId: $cuotaId, cajaVirtualId: $cajaVirtualId, montoPago: $montoPago) { ${CUOTA_FIELDS} }
  }
`;
