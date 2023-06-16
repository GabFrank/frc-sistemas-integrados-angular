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
        fechaApertura
        fechaCierre
        sucursal {
          nombre
        }
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
  query ($id: ID!) {
    data: maletin(id: $id) {
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
  query ($texto: String) {
    data: searchMaletin(texto: $texto) {
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
