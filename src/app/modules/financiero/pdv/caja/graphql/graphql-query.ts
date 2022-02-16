import gql from "graphql-tag";

export const cajasQuery = gql`
  {
    data: cajas {
      id
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

export const cajasPorFecha = gql`
  query ($inicio: String, $fin: String) {
    data: cajasPorFecha(inicio: $inicio, fin: $fin) {
      id
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

// export const cajasSearch = gql`
//   query ($texto: String) {
//     cajas: cajasSearch(texto: $texto) {
//       id
//       responsable {
//         id
//         persona {
//           id
//           nombre
//         }
//       }
//       tipoCaja {
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
//       cajaDetalleList {
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

export const cajaQuery = gql`
  query ($id: ID!) {
    data: pdvCaja(id: $id) {
      id
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
      conteoApertura {
        id
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
            valor
          }
          cantidad
        }
      }
      conteoCierre {
        id
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
            valor
          }
          cantidad
        }
      }
      balance {
        totalVentaGs
        totalVentaRs
        totalVentaDs
        totalTarjeta
        totalRetiroGs
        totalRetiroRs
        totalRetiroDs
        totalGastoGs
        totalGastoRs
        totalGastoDs
        totalAperGs
        totalAperRs
        totalAperDs
        totalCierreGs
        totalCierreRs
        totalCierreDs
        totalDescuento
        totalAumento
        totalCanceladas
      }
    }
  }
`;

export const cajaPorUsuarioIdAndAbiertoQuery = gql`
  query ($id: ID!) {
    data: cajaAbiertoPorUsuarioId(id: $id) {
      id
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
      conteoApertura {
        id
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
            valor
          }
          cantidad
        }
      }
      conteoCierre {
        id
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
            valor
          }
          cantidad
        }
      }
    }
  }
`;

export const savePdvCaja = gql`
  mutation savePdvCaja($entity: PdvCajaInput!) {
    data: savePdvCaja(pdvCaja: $entity) {
      id
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
      conteoApertura {
        id
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
            valor
          }
          cantidad
        }
      }
      conteoCierre {
        id
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
            valor
          }
          cantidad
        }
      }
    }
  }
`;

export const deleteCajaQuery = gql`
  mutation deletePdvCaja($id: ID!) {
    deletePdvCaja(id: $id)
  }
`;

export const imprimirBalanceQuery = gql`
  query imprimirBalance($id: ID!) {
    imprimirBalance(id: $id) {
      id
    }
  }
`;
