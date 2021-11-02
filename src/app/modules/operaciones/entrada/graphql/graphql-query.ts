import gql from "graphql-tag";

export const entradasQuery = gql`
  {
    data: entradas {
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
      tipoEntrada
      observacion
      creadoEn
      usuario {
        id
        nombre
      }
    }
  }
`;

export const entradaQuery = gql`
  query ($id: ID!) {
    data: entrada(id: $id) {
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
      tipoEntrada
      observacion
      creadoEn
      usuario {
        id
        nombre
      }
    }
  }
`;

export const saveEntrada = gql`
  mutation saveEntrada($entity: EntradaInput!) {
    data: saveEntrada(entrada: $entity) {
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
      tipoEntrada
      observacion
      creadoEn
      usuario {
        id
        nombre
      }
    }
  }
`;

export const deleteEntradaQuery = gql`
  mutation deleteEntrada($id: ID!) {
    deleteEntrada(id: $id)
  }
`;

export const entradaPorFechaQuery = gql`
  query ($inicio: String, $fin: String) {
    data: entradaByFecha(inicio: $inicio, fin: $fin) {
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
      tipoEntrada
      observacion
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      entradaItemList {
        id
        producto{
          id
          descripcion
        }
        presentacion{
          id
          descripcion
        }
        observacion
        cantidad
        creadoEn
      }
    }
  }
`;
