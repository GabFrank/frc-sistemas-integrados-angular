import gql from "graphql-tag";

// export const conteosQuery = gql`
//   {
//     data: conteos {
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

// export const conteoMonedasPorCajaId = gql`
//   query ($id: ID!) {
//     data: conteoMonedasPorCajaId(id: $id) {
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

// export const conteoMonedasSearch = gql`
//   query ($texto: String) {
//     conteoMonedas: conteoMonedasSearch(texto: $texto) {
//       id
//       responsable {
//         id
//         persona {
//           id
//           nombre
//         }
//       }
//       tipoConteoMoneda {
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
//       conteoMonedaDetalleList {
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

// export const conteoMonedaQuery = gql`
//   query ($id: ID!) {
//     data: conteoMoneda(id: $id) {
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

export const saveConteoMoneda = gql`
  mutation saveConteoMoneda($entity: ConteoMonedaInput!) {
    data: saveConteoMoneda(conteoMoneda: $entity) {
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
`;

export const deleteConteoMonedaQuery = gql`
  mutation deleteConteoMoneda($id: ID!) {
    deleteConteoMoneda(id: $id)
  }
`;
