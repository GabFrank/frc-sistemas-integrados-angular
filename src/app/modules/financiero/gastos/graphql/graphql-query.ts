import gql from "graphql-tag";

export const gastosQuery = gql`
  query ($sucId: ID) {
    data: gastos(sucId: $sucId) {
      id
      sucursalId
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
  query ($inicio: String, $fin: String, $sucId: ID) {
    data: gastosPorFecha(inicio: $inicio, fin: $fin, sucId: $sucId) {
      id
      sucursalId
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
      sucursalVuelto {
        id
        nombre
      }
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
  query ($id: ID!, $sucId: ID) {
    data: gasto(id: $id, sucId: $sucId) {
      id
      sucursalId
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
      sucursalVuelto {
        id
        nombre
      }
    }
  }
`;

export const reimprimirQuery = gql`
  query ($id: ID!, $printerName: String, $sucId: ID) {
    data: reimprimirGasto(id: $id, printerName: $printerName, sucId: $sucId)
  }
`;

export const saveGasto = gql`
  mutation saveGasto(
    $entity: GastoInput!
    $printerName: String
    $local: String
  ) {
    data: saveGasto(entity: $entity, printerName: $printerName, local: $local) {
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
      sucursalVuelto {
        id
        nombre
      }
    }
  }
`;

export const saveVueltoGasto = gql`
  mutation saveVueltoGasto(
    $id: ID!
    $valorGs: Float
    $valorRs: Float
    $valorDs: Float
  ) {
    data: saveVueltoGasto(
      id: $id
      valorGs: $valorGs
      valorRs: $valorRs
      valorDs: $valorDs
    ) {
      id
      sucursalId
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
      sucursalVuelto {
        id
        nombre
      }
    }
  }
`;

export const deleteGastoQuery = gql`
  mutation deleteGasto($id: ID!, $sucId: ID) {
    deleteGasto(id: $id, sucId: $sucId)
  }
`;

//gastosPorCajaId

export const gastosPorCajaIdQuery = gql`
  query ($id: ID!, $sucId: ID) {
    data: gastosPorCajaId(id: $id, sucId: $sucId) {
      id
      sucursalId
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
      sucursalVuelto {
        id
        nombre
      }
    }
  }
`;

export const filterGastosQuery = gql`
  query (
    $id: ID
    $cajaId: ID
    $sucId: ID
    $responsableId: ID
    $descripcion: String
    $page: Int
    $size: Int
  ) {
    data: filterGastos(
      id: $id
      cajaId: $cajaId
      sucId: $sucId
      responsableId: $responsableId
      descripcion: $descripcion
      page: $page
      size: $size
    ) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        sucursal {
          id
          nombre
        }
        caja {
          id
          sucursalId
        }
        responsable {
          persona {
            nombre
          }
        }
        tipoGasto {
          descripcion
        }
        observacion
        retiroGs
        retiroRs
        retiroDs
        creadoEn
      }
    }
  }
`;
