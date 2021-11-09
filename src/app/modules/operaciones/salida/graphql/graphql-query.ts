import gql from "graphql-tag";

export const salidasQuery = gql`
  {
    data: salidas {
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
      tipoSalida
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

export const salidaQuery = gql`
  query ($id: ID!) {
    data: salida(id: $id) {
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
      tipoSalida
      observacion
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      salidaItemList {
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

export const saveSalida = gql`
  mutation saveSalida($entity: SalidaInput!) {
    data: saveSalida(salida: $entity) {
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
      tipoSalida
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

export const deleteSalidaQuery = gql`
  mutation deleteSalida($id: ID!) {
    deleteSalida(id: $id)
  }
`;

export const salidaPorFechaQuery = gql`
  query ($inicio: String, $fin: String) {
    data: salidaByFecha(inicio: $inicio, fin: $fin) {
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
      tipoSalida
      observacion
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      salidaItemList {
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

export const finalizarSalida = gql`
  mutation finalizarSalida($id: ID!) {
    finalizarSalida(id: $id)
  }
`;
