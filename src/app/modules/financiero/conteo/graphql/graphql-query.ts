import gql from "graphql-tag";

export const conteosQuery = gql`
  query ($sucId: ID) {
    data: conteos(sucId: $sucId) {
      id
      sucursalId
      descripcion
      activo
      estado
      tuvoProblema
      fechaApertura
      fechaCierre
      observacion
      maletin {
        id
        descripcion
      }
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

// export const conteosPorCajaId = gql`
//   query ($id: ID!) {
//     data: conteosPorCajaId(id: $id) {
//       id
//       descripcion
//       activo
//       estado
//       tuvoProblema
//       fechaApertura
//       fechaCierre
//       observacion
//       maletin {
//         id
//         descripcion
//       }
//       creadoEn
//       usuario {
//         id
//         persona {
//           nombre
//         }
//       }
//     }
//   }
// `;

// export const conteosSearch = gql`
//   query ($texto: String) {
//     conteos: conteosSearch(texto: $texto) {
//       id
//       responsable {
//         id
//         persona {
//           id
//           nombre
//         }
//       }
//       tipoConteo {
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
//       conteoDetalleList {
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

// export const conteoQuery = gql`
//   query ($id: ID!) {
//     data: conteo(id: $id) {
//       id
//       descripcion
//       activo
//       estado
//       tuvoProblema
//       fechaApertura
//       fechaCierre
//       observacion
//       maletin {
//         id
//         descripcion
//       }
//       creadoEn
//       usuario {
//         id
//         persona {
//           nombre
//         }
//       }
//     }
//   }
// `;

export const saveConteo = gql`
  mutation saveConteo(
    $conteo: ConteoInput!
    $conteoMonedaInputList: [ConteoMonedaInput]
    $cajaId: Int
    $apertura: Boolean
  ) {
    data: saveConteo(
      conteo: $conteo
      conteoMonedaInputList: $conteoMonedaInputList
      cajaId: $cajaId
      apertura: $apertura
    ) {
      id
      sucursalId
      observacion
      creadoEn
      conteoMonedaList {
        id
        monedaBilletes {
          id
          moneda {
            id
            denominacion
          }
          flotante
          papel
          activo
          valor
        }
        cantidad
        observacion
      }
    }
  }
`;

export const deleteConteoQuery = gql`
  mutation deleteConteo($id: ID!, $sucId: ID) {
    deleteConteo(id: $id, sucId: $sucId)
  }
`;
