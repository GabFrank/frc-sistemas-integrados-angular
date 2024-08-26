import gql from "graphql-tag";

export const cajasQuery = gql`
  query ($sucId: ID) {
    data: cajas(sucId: $sucId) {
      id
      sucursalId
      sucursal {
        id
        nombre
      }
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
  query ($inicio: String, $fin: String, $sucId: ID) {
    data: cajasPorFecha(inicio: $inicio, fin: $fin, sucId: $sucId) {
      id
      sucursal {
        id
        nombre
      }
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

export const balancePorFecha = gql`
  query ($inicio: String, $fin: String, $sucId: ID) {
    data: balancePorFecha(inicio: $inicio, fin: $fin, sucId: $sucId) {
      totalGeneral
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

export const balancePorCajaIdQuery = gql`
  query ($id: ID!) {
    data: balancePorCajaId(id: $id) {
      totalGeneral
      totalVentaGs
      totalVentaRs
      totalVentaDs
      totalTarjeta
      totalCredito
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
      totalCanceladasGs
      totalCanceladasRs
      totalCanceladasDs
      vueltoGs
      vueltoRs
      vueltoDs
      diferenciaGs
      diferenciaRs
      diferenciaDs
    }
  }
`;

export const cajaQuery = gql`
  query ($id: ID!, $sucId: ID) {
    data: pdvCaja(id: $id, sucId: $sucId) {
      id
      sucursal {
        id
        nombre
      }
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
        totalGeneral
        totalVentaGs
        totalVentaRs
        totalVentaDs
        totalTarjeta
        totalCredito
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
        totalCanceladasGs
        totalCanceladasRs
        totalCanceladasDs
        vueltoGs
        vueltoRs
        vueltoDs
        diferenciaGs
        diferenciaRs
        diferenciaDs
      }
    }
  }
`;

export const cajaPorUsuarioIdAndAbiertoQuery = gql`
  query ($id: ID!, $sucId: ID) {
    data: cajaAbiertoPorUsuarioId(id: $id, sucId: $sucId) {
      id
      sucursal {
        id
        nombre
      }
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
      sucursal {
        id
        nombre
      }
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
  mutation deletePdvCaja($id: ID!, $sucId: ID) {
    deletePdvCaja(id: $id, sucId: $sucId)
  }
`;

export const imprimirBalanceQuery = gql`
  query imprimirBalance(
    $id: ID!
    $printerName: String
    $local: String
    $sucId: ID
  ) {
    imprimirBalance(
      id: $id
      printerName: $printerName
      local: $local
      sucId: $sucId
    ) {
      id
    }
  }
`;

export const cajasWithFilters = gql`
  query (
    $cajaId: ID
    $estado: PdvCajaEstado
    $maletinId: ID
    $cajeroId: ID
    $fechaInicio: String
    $fechaFin: String
    $sucId: ID
    $page: Int
    $size: Int
  ) {
    data: cajasWithFilters(
      cajaId: $cajaId
      estado: $estado
      maletinId: $maletinId
      cajeroId: $cajeroId
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      sucId: $sucId
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
  }
`;
