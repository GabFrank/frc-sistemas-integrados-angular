import gql from "graphql-tag";

export const gastosQuery = gql`
  {
    data: gastos {
      id
      responsable {
        id
        persona {
          id
          nombre
        }
      }
      tipoGasto {
        id
        descripcion
        autorizacion
      }
      autorizadoPor {
        id
        persona {
          id
          nombre
        }
      }
      observacion
      creadoEn
      usuario {
        id
        persona {
          id
          nombre
        }
      }
      gastoDetalleList {
        id
        moneda {
          id
          denominacion
          cambio
        }
        cantidad
      }
      valorGs
      valorRs
      valorDs
    }
  }
`;

export const gastosPorFecha = gql`
  query ($inicio: String, $fin: String) {
    data: gastosPorFecha(inicio: $inicio, fin: $fin) {
      id
      responsable {
        id
        persona {
          id
          nombre
        }
      }
      tipoGasto {
        id
        descripcion
        autorizacion
      }
      autorizadoPor {
        id
        persona {
          id
          nombre
        }
      }
      observacion
      creadoEn
      usuario {
        id
        persona {
          id
          nombre
        }
      }
      gastoDetalleList {
        id
        moneda {
          id
          denominacion
          cambio
        }
        
        cantidad
      }
      valorGs
      valorRs
      valorDs
    }
  }
`;

// export const gastosSearch = gql`
//   query ($texto: String) {
//     gastos: gastosSearch(texto: $texto) {
//       id
//       responsable {
//         id
//         persona {
//           id
//           nombre
//         }
//       }
//       tipoGasto {
//         id
//         descripcion
//         autorizacion
//       }
//       autorizadoPor {
//         id
//         persona {
//           id
//           nombre
//         }
//       }
//       observacion
//       creadoEn
//       usuario {
//         id
//         persona {
//           id
//           nombre
//         }
//       }
//       gastoDetalleList {
//         id
//         moneda {
//           id
//           denominacion
//         }
//         cambio {
//           id
//           valorEnGs
//         }
//         cantidad
//       }
//     }
//   }
// `;

export const gastoQuery = gql`
  query ($id: ID!) {
    data: gasto(id: $id) {
      id
      responsable {
        id
        persona {
          id
          nombre
        }
      }
      tipoGasto {
        id
        descripcion
        autorizacion
      }
      autorizadoPor {
        id
        persona {
          id
          nombre
        }
      }
      observacion
      creadoEn
      usuario {
        id
        persona {
          id
          nombre
        }
      }
      gastoDetalleList {
        id
        moneda {
          id
          denominacion
          cambio
        }
        
        cantidad
      }
      valorGs
      valorRs
      valorDs
    }
  }
`;

export const saveGasto = gql`
  mutation saveGasto($entity: GastoInput!) {
    data: saveGasto(gasto: $entity) {
      id
      responsable {
        id
        persona {
          id
          nombre
        }
      }
      tipoGasto {
        id
        descripcion
        autorizacion
      }
      autorizadoPor {
        id
        persona {
          id
          nombre
        }
      }
      observacion
      creadoEn
      usuario {
        id
        persona {
          id
          nombre
        }
      }
      gastoDetalleList {
        id
        moneda {
          id
          denominacion
          cambio
        }
        cantidad
      }
      valorGs
      valorRs
      valorDs
    }
  }
`;

export const deleteGastoQuery = gql`
  mutation deleteGasto($id: ID!) {
    deleteGasto(id: $id)
  }
`;
