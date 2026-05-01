import { gql } from "apollo-angular";

export const puntoDeVentaQuery = gql`
  query {
    data: puntoDeVenta {
      id
      nombre
      sucursal {
        id
        nombre
      }
    }
  }
`;

export const puntoDeVentaPorIdQuery = gql`
  query ($id: ID!) {
    data: puntoDeVenta(id: $id) {
      id
      nombre
      sucursal {
        id
        nombre
        ip
        puerto
        direccion
        nroDelivery
        depositoPredeterminado
        deposito
        codigoEstablecimientoFactura
        isConfigured
        activo
      }
    }
  }
`;

export const puntoDeVentasQuery = gql`
  query {
    data: puntoDeVentas(size: 50) {
      id
      nombre
      sucursal {
        id
        nombre
      }
    }
  }
`;