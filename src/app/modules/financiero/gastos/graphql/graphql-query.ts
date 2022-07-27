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
      retiroGs
      retiroRs
      retiroDs
      vueltoGs
      vueltoRs
      vueltoDs
      activo
      finalizado
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
      retiroGs
      retiroRs
      retiroDs
      vueltoGs
      vueltoRs
      vueltoDs
      activo
      finalizado
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
      retiroGs
      retiroRs
      retiroDs
      vueltoGs
      vueltoRs
      vueltoDs
      activo
      finalizado
    }
  }
`;

export const saveGasto = gql`
  mutation saveGasto(
    $entity: GastoInput!
    $printerName: String
    $local: String
    ) {
    data: saveGasto(
      entity: $entity
      printerName: $printerName
      local: $local
      ) {
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
      retiroGs
      retiroRs
      retiroDs
      vueltoGs
      vueltoRs
      vueltoDs
      activo
      finalizado
    }
  }
`;

export const deleteGastoQuery = gql`
  mutation deleteGasto($id: ID!) {
    deleteGasto(id: $id)
  }
`;

//gastosPorCajaId

export const gastosPorCajaIdQuery = gql`
  query ($id: ID!) {
    data: gastosPorCajaId(id: $id) {
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
      retiroGs
      retiroRs
      retiroDs
      vueltoGs
      vueltoRs
      vueltoDs
      activo
      finalizado
    }
  }
`;
