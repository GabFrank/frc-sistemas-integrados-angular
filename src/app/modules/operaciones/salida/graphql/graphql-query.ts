import gql from "graphql-tag";

export const salidasQuery = gql`
  {
    data: salidas {
      id
      responsableCarga {
        id
        persona {
          id
          nombre
        }
      }
      sucursal {
        id
        nombre
      }
      tipoSalida
      observacion
      creadoEn
      usuario {
        id
        nombre
      }
    }
  }
`;

export const salidaQuery = gql`
  query ($id: ID!) {
    data: salida(id: $id) {
      id
      responsableCarga {
        id
        persona {
          id
          nombre
        }
      }
      sucursal {
        id
        nombre
      }
      tipoSalida
      observacion
      creadoEn
      usuario {
        id
        nombre
      }
    }
  }
`;

export const saveSalida = gql`
  mutation saveSalida($entity: SalidaInput!) {
    data: saveSalida(salida: $entity) {
      id
      responsableCarga {
        id
        persona {
          id
          nombre
        }
      }
      sucursal {
        id
        nombre
      }
      tipoSalida
      observacion
      creadoEn
      usuario {
        id
        nombre
      }
    }
  }
`;

export const deleteSalidaQuery = gql`
  mutation deleteSalida($id: ID!) {
    deleteSalida(id: $id)
  }
`;
