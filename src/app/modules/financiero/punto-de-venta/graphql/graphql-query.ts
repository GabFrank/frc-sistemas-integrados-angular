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