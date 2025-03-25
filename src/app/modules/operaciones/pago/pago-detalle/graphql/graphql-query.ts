import { gql } from 'apollo-angular';

export const GET_PAGO_DETALLE = gql`
  query pagoDetalle($id: ID!) {
    data: pagoDetalle(id: $id) {
      id
      pago {
        id
      }
      usuario {
        id
        nombre
      }
      creadoEn
      moneda {
        id
        nombre
        simbolo
      }
      formaPago {
        id
        nombre
      }
      total
      sucursal {
        id
        nombre
      }
      caja {
        id
        nombre
      }
      activo
      fechaProgramado
      estado
    }
  }
`;

export const SAVE_PAGO_DETALLE = gql`
  mutation savePagoDetalle($entity: PagoDetalleInput!) {
    data: savePagoDetalle(entity: $entity) {
      id
      pago {
        id
      }
      usuario {
        id
        persona {
          id
          nombre
        }
      }
      creadoEn
      moneda {
        id
        denominacion
        simbolo
      }
      formaPago {
        id
        descripcion
      }
      total
      sucursal {
        id
        nombre
      }
      caja {
        id
      }
      activo
      fechaProgramado
      estado
    }
  }
`;

export const PAGO_DETALLES_POR_PAGO_ID = gql`
  query pagoDetallesPorPagoId($pagoId: ID!) {
    data: pagoDetallesPorPagoId(pagoId: $pagoId) {
      id
      pago {
        id
      }
      usuario {
        id
        persona {
          id
          nombre
        }
      }
      creadoEn
      moneda {
        id
        denominacion
        simbolo
      }
      formaPago {
        id
        descripcion
      }
      total
      sucursal {
        id
        nombre
      }
      caja {
        id
      }
      activo
      plazo
      fechaProgramado
      estado
    }
  }
`;

export const DELETE_PAGO_DETALLE = gql`
  mutation deletePagoDetalle($id: ID!) {
    data: deletePagoDetalle(id: $id)
  }
`; 