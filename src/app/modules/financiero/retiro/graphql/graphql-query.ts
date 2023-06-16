import gql from "graphql-tag";

export const retirosQuery = gql`
  query ($page:Int, $size:Int, $sucId:ID){
    data: retiros (page: $page, size: $size, sucId: $sucId) {
      id
      responsable {
        id
      }
      estado
      observacion
      cajaSalida {
        id
      }
      cajaEntrada {
        id
      }
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      retiroGs
      retiroRs
      retiroDs
    }
  }
`;

export const retiroQuery = gql`
  query ($id: ID!, $sucId: ID) {
    data: retiro(id: $id, sucId: $sucId) {
      id
      responsable {
        id
      }
      estado
      observacion
      cajaSalida {
        id
      }
      cajaEntrada {
        id
      }
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      retiroGs
      retiroRs
      retiroDs
    }
  }
`;

export const retiroListPorCajaSalidaIdQuery = gql`
  query ($id: ID!, $sucId: ID) {
    data: retiroListPorCajaSalidaId(id: $id, sucId: $sucId) {
      id
      responsable {
        id
        persona {
          nombre
        }
      }
      estado
      observacion
      cajaSalida {
        id
      }
      cajaEntrada {
        id
      }
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      retiroGs
      retiroRs
      retiroDs
    }
  }
`;

export const saveRetiro = gql`
  mutation saveRetiro($entity:RetiroInput!, $retiroDetalleInputList: [RetiroDetalleInput], $printerName: String, $local: String) {
    data: saveRetiro(retiro: $entity, retiroDetalleInputList: $retiroDetalleInputList, printerName: $printerName, local: $local) {
      id
      responsable {
        id
      }
      estado
      observacion
      cajaSalida {
        id
      }
      cajaEntrada {
        id
      }
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      retiroGs
      retiroRs
      retiroDs
    }
  }
`;

export const reimprimirRetiro = gql`
  query reimprimirRetiro($id:ID!, $printerName: String, $local: String, $sucId: ID) {
    data: reimprimirRetiro(id: $id, printerName: $printerName, local: $local, sucId: $sucId)
  }
`;

export const deleteRetiroQuery = gql`
  mutation deleteRetiro($id: ID!,  $sucId: ID) {
    deleteRetiro(id: $id, sucId: $sucId)
  }
`;

export const filterRetirosQuery = gql`
  query ($id:ID, $cajaId:ID, $sucId:ID, $responsableId:ID, $cajeroId:ID, $page:Int, $size:Int) {
    data: filterRetiros(id:$id, cajaId:$cajaId, sucId:$sucId, responsableId:$responsableId, cajeroId:$cajeroId, page:$page, size:$size) {
      id
      responsable {
        id
        persona {
          nombre
        }
      }
      estado
      observacion
      cajaSalida {
        id
        sucursalId
      }
      cajaEntrada {
        id
        sucursalId
      }
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
        nickname
      }
      retiroGs
      retiroRs
      retiroDs
      sucursal {
        nombre
      }
    }
  }
`;


