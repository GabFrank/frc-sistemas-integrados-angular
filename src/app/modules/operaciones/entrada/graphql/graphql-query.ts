import gql from "graphql-tag";

export const entradasQuery = gql`
  {
    data: entradas {
      id
      activo
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
    }
  }
`;

export const entradaQuery = gql`
  query ($id: ID!) {
    data: entrada(id: $id) {
      id
      activo
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
        producto {
          id
          descripcion
        }
        presentacion {
          id
          descripcion
          codigoPrincipal {
            id
            codigo
          }
        }
        observacion
        cantidad
        creadoEn
      }
    }
  }
`;

export const saveEntrada = gql`
  mutation saveEntrada($entity: EntradaInput!) {
    data: saveEntrada(entrada: $entity) {
      id
      activo
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
      activo
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
        producto {
          id
          descripcion
        }
        presentacion {
          id
          descripcion
          codigoPrincipal {
            id
            codigo
          }
        }
        observacion
        cantidad
        creadoEn
      }
    }
  }
`;

export const finalizarEntrada = gql`
  mutation finalizarEntrada($id: ID!) {
    finalizarEntrada(id: $id)
  }
`;

export const imprimirEntrada = gql`
  query imprimirEntrada($id: ID!) {
    imprimirEntrada(id: $id)
  }
`;
