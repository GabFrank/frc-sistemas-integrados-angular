import gql from "graphql-tag";

export const maletinsQuery = gql`
  query ($page: Int, $size: Int) {
    data: maletines(page: $page, size: $size) {
      id
      descripcion
      activo
      abierto
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      cajaActual {
        id
        sucursalId
      }
      sucursal {
        id
        nombre
      }
    }
  }
`;

// export const maletinsSearch = gql`
//   query ($texto: String) {
//     data: maletinsSearch(texto: $texto) {
//       id
//       credito
//       diarista
//       sueldo
//       fechaIngreso
//       creadoEn
//       fasePrueba
//       activo
//       nickname
//       persona {
//         id
//         nombre
//         telefono
//       }
//       cargo {
//         id
//         nombre
//       }
//       supervisadoPor {
//         id
//         persona {
//           id
//           nombre
//         }
//       }
//       sucursal {
//         id
//         nombre
//       }
//     }
//   }
// `;

export const maletinQuery = gql`
  query ($id: ID!, $sucursalId: ID!) {
    data: maletin(id: $id, sucursalId: $sucursalId) {
      id
      descripcion
      activo
      abierto
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      cajaActual {
        id
        fechaApertura
        fechaCierre
        sucursal {
          nombre
        }
        usuario {
          persona {
            nombre
          }
        }
      }
    }
  }
`;

export const maletinPorDescripcionQuery = gql`
  query ($texto: String) {
    data: maletinPorDescripcion(texto: $texto) {
      id
      descripcion
      activo
      abierto
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

export const searchMaletinQuery = gql`
  query ($texto: String, $sucId:ID) {
    data: searchMaletin(texto: $texto, sucId: $sucId) {
      id
      descripcion
      activo
      abierto
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      cajaActual {
        id
        fechaApertura
        fechaCierre
        sucursal {
          nombre
        }
        usuario {
          persona {
            nombre
          }
        }
      }
    }
  }
`;
export const saveMaletin = gql`
  mutation saveMaletin($entity: MaletinInput!) {
    data: saveMaletin(maletin: $entity) {
      id
      descripcion
      activo
      abierto
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      sucursal {
        id
        nombre
      }
    }
  }
`;

export const deleteMaletinQuery = gql`
  mutation deleteMaletin($id: ID!) {
    deleteMaletin(id: $id)
  }
`;

export const countMaletinQuery = gql`
   {
    data: countMaletin
  }
`;

// --- Maletín ↔ caja mayor (tesorería) ---
export const valorMaletinQuery = gql`
  query ($maletinId: ID!) {
    data: valorMaletin(maletinId: $maletinId) {
      total
      moneda {
        id
        denominacion
        simbolo
        principal
        decimales
      }
    }
  }
`;

export const ingresarMaletinCajaMayorMutation = gql`
  mutation ($cajaVirtualId: ID!, $maletinId: ID!, $monedaId: ID!, $monto: Float!, $descripcion: String) {
    data: ingresarMaletinCajaMayor(cajaVirtualId: $cajaVirtualId, maletinId: $maletinId, monedaId: $monedaId, monto: $monto, descripcion: $descripcion) {
      id
    }
  }
`;

// Con y sin `claveIdempotencia`: un central anterior al cambio no conoce el argumento y rechaza el pedido
// entero, así que el servicio cae a la versión sin clave (franco-system-backend-servidor#376).
const egresarMaletinCajaMayor = (conClave: boolean) => gql`
  mutation ($cajaVirtualId: ID!, $maletinId: ID!, $monedaId: ID!, $monto: Float!, $descripcion: String${conClave ? ', $claveIdempotencia: String' : ''}) {
    data: egresarMaletinCajaMayor(cajaVirtualId: $cajaVirtualId, maletinId: $maletinId, monedaId: $monedaId, monto: $monto, descripcion: $descripcion${conClave ? ', claveIdempotencia: $claveIdempotencia' : ''}) {
      id
    }
  }
`;
export const egresarMaletinCajaMayorMutation = egresarMaletinCajaMayor(true);
export const egresarMaletinCajaMayorSinClaveMutation = egresarMaletinCajaMayor(false);

export const ingresarMaletinCierreMutation = gql`
  mutation ($cajaVirtualId: ID!, $maletinId: ID!, $monedaIds: [ID], $descripcion: String) {
    data: ingresarMaletinCierre(cajaVirtualId: $cajaVirtualId, maletinId: $maletinId, monedaIds: $monedaIds, descripcion: $descripcion) {
      id
    }
  }
`;
