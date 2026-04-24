import gql from "graphql-tag";

export const documentosElectronicosQuery = gql`
  query ($page: Int = 0, $size: Int = 10) {
    data: documentosElectronicos(page: $page, size: $size) {
      id
      sucursal {
        id
      }
      facturaLegal {
        id
      }
      cdc
      urlQr
      xmlFirmado
      xmlOriginal
      estado
      codigoRespuestaSifen
      mensajeRespuestaSifen
      fechaRecepcionSifen
      numeroDocumento
      actualizadoEn
      tipoDocumento
      fechaEmision
      creadoEn
      loteDe {
        id
      }
      activo
      
      usuario {
        id
    }
      }
  }
`;

export const saveDocumentoElectronicoMutation = gql`
  mutation ($input: DocumentoElectronicoInput!) {
    data: saveDocumentoElectronico(input: $input) {
      id
    }
  }
`;