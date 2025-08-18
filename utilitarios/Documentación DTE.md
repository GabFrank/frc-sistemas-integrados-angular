# Creación de tablas SQL necesarias:

\-- 1\. Crear la tabla para gestionar los lotes de envío a SIFEN  
CREATE TABLE financiero.lote\_dte (  
    id BIGSERIAL PRIMARY KEY,  
    id\_protocolo\_sifen VARCHAR(50), \-- ID devuelto por SIFEN al recibir el lote  
    fecha\_envio TIMESTAMP,  
    estado\_sifen VARCHAR(30), \-- Ej: ENVIANDO, RECIBIDO\_POR\_SIFEN, PROCESADO\_OK, ERROR\_ENVIO  
    respuesta\_sifen TEXT \-- La respuesta completa de la consulta del lote  
);

\-- 2\. Crear la tabla central para el Documento Tributario Electrónico (DTE)  
CREATE TABLE financiero.documento\_electronico (  
    id BIGSERIAL PRIMARY KEY,  
    lote\_id BIGINT REFERENCES financiero.lote\_dte(id),  
    cdc VARCHAR(44) UNIQUE, \-- El Código de Control de 44 dígitos  
    estado\_sifen VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE', \-- PENDIENTE, GENERADO, ENVIADO, APROBADO, RECHAZADO  
    mensaje\_sifen TEXT, \-- Para mensajes de error o informativos de SIFEN  
    xml\_firmado TEXT, \-- El XML exacto que se envió  
    url\_qr VARCHAR(500) \-- La URL para el código QR del KuDE  
);

\-- 3\. Crear la tabla para los eventos asociados a un DTE (Cancelación, etc.)  
CREATE TABLE financiero.evento\_dte (  
    id BIGSERIAL PRIMARY KEY,  
    documento\_electronico\_id BIGINT NOT NULL REFERENCES financiero.documento\_electronico(id),  
    tipo\_evento INT NOT NULL, \-- Código del evento según SIFEN (Ej: 1=Cancelación, 2=Inutilización...)  
    fecha\_evento TIMESTAMP NOT NULL DEFAULT NOW(),  
    cdc\_evento VARCHAR(44) UNIQUE, \-- El CDC del evento en sí  
    mensaje\_respuesta\_sifen TEXT \-- Respuesta de SIFEN al evento  
);

\-- 4\. Añadir la columna de enlace en tu tabla existente 'factura\_legal'  
\-- Esta es la única modificación a tu esquema actual.  
ALTER TABLE financiero.factura\_legal  
ADD COLUMN documento\_electronico\_id BIGINT UNIQUE REFERENCES financiero.documento\_electronico(id);



# Entidades JPA (@Entity)

**LoteDTE.java**  
package com.techekuatia.dte.financiero.model;

import jakarta.persistence.\*;  
import lombok.AllArgsConstructor;  
import lombok.Data;  
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;  
import java.util.List;

@Entity  
@Table(name \= "lote\_dte", schema \= "financiero")  
@Data  
@NoArgsConstructor  
@AllArgsConstructor  
public class LoteDTE {

    @Id  
    @GeneratedValue(strategy \= GenerationType.IDENTITY)  
    private Long id;

    @Column(name \= "id\_protocolo\_sifen")  
    private String idProtocoloSifen;

    @Column(name \= "fecha\_envio")  
    private OffsetDateTime fechaEnvio;

    @Column(name \= "estado\_sifen")  
    private String estadoSifen;

    @Column(name \= "respuesta\_sifen", columnDefinition \= "TEXT")  
    private String respuestaSifen;

    @OneToMany(mappedBy \= "lote")  
    private List\<DocumentoElectronico\> documentosElectronicos;  
}

DocumentoElectronico.java  
package com.techekuatia.dte.financiero.model;

import com.techekuatia.dte.financiero.model.FacturaLegal; // Asegúrate de importar tu clase FacturaLegal  
import jakarta.persistence.\*;  
import lombok.AllArgsConstructor;  
import lombok.Data;  
import lombok.NoArgsConstructor;

import java.util.List;

@Entity  
@Table(name \= "documento\_electronico", schema \= "financiero")  
@Data  
@NoArgsConstructor  
@AllArgsConstructor  
public class DocumentoElectronico {

    @Id  
    @GeneratedValue(strategy \= GenerationType.IDENTITY)  
    private Long id;

    @ManyToOne(fetch \= FetchType.LAZY)  
    @JoinColumn(name \= "lote\_id")  
    private LoteDTE lote;

    @Column(name \= "cdc", unique \= true)  
    private String cdc;

    @Column(name \= "estado\_sifen", nullable \= false)  
    private String estadoSifen \= "PENDIENTE";

    @Column(name \= "mensaje\_sifen", columnDefinition \= "TEXT")  
    private String mensajeSifen;

    @Column(name \= "xml\_firmado", columnDefinition \= "TEXT")  
    private String xmlFirmado;

    @Column(name \= "url\_qr")  
    private String urlQr;

    @OneToOne(mappedBy \= "documentoElectronico")  
    private FacturaLegal facturaLegal;

    @OneToMany(mappedBy \= "documentoElectronico", cascade \= CascadeType.ALL)  
    private List\<EventoDTE\> eventos;  
}

**EventoDTE.java**  
package com.techekuatia.dte.financiero.model;

import jakarta.persistence.\*;  
import lombok.AllArgsConstructor;  
import lombok.Data;  
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Entity  
@Table(name \= "evento\_dte", schema \= "financiero")  
@Data  
@NoArgsConstructor  
@AllArgsConstructor  
public class EventoDTE {

    @Id  
    @GeneratedValue(strategy \= GenerationType.IDENTITY)  
    private Long id;

    @ManyToOne(fetch \= FetchType.LAZY, optional \= false)  
    @JoinColumn(name \= "documento\_electronico\_id", nullable \= false)  
    private DocumentoElectronico documentoElectronico;

    @Column(name \= "tipo\_evento", nullable \= false)  
    private Integer tipoEvento; // 1=Cancelación, 2=Inutilización, etc.

    @Column(name \= "fecha\_evento", nullable \= false)  
    private OffsetDateTime fechaEvento \= OffsetDateTime.now();

    @Column(name \= "cdc\_evento", unique \= true)  
    private String cdcEvento;  
      
    @Column(name \= "mensaje\_respuesta\_sifen", columnDefinition \= "TEXT")  
    private String mensajeRespuestaSifen;  
}

**Modificación FacturaLegal.java**  
// ... dentro de tu clase FacturaLegal.java

@OneToOne(cascade \= CascadeType.ALL)  
@JoinColumn(name \= "documento\_electronico\_id", referencedColumnName \= "id")  
private DocumentoElectronico documentoElectronico;

# Esquema GraphQL (.graphqls)

\# Definición de los tipos principales que expondremos  
type DocumentoElectronicoGQL {  
    id: ID\!  
    cdc: String  
    estadoSifen: String  
    mensajeSifen: String  
    urlQr: String  
    facturaLegal: FacturaLegalGQL \# Asume que ya tienes un tipo para FacturaLegal  
    eventos: \[EventoDTEGQL\]  
}

type EventoDTEGQL {  
    id: ID\!  
    tipoEvento: Int  
    fechaEvento: String \# Usamos String para simplicidad, puedes usar un escalar de fecha  
    cdcEvento: String  
    mensajeRespuestaSifen: String  
}

\# Tipos para la paginación de resultados en el panel administrativo  
type DocumentoElectronicoPage {  
    content: \[DocumentoElectronicoGQL\]  
    totalPages: Int  
    totalElements: Long  
    number: Int  
    size: Int  
}

\# Input para la creación de un DTE a partir de una venta  
input GenerarDTEInput {  
    ventaId: ID\!  
}

\# Input para la creación de un evento  
input RegistrarEventoInput {  
    documentoElectronicoId: ID\!  
    tipoEvento: Int\!  
    \# ... otros campos que el evento pueda necesitar, como justificación para cancelación  
}

\# Definición de las operaciones de consulta  
type Query {  
    \# Para el panel administrativo, con paginación y filtros  
    documentosElectronicos(  
        estadoSifen: String,   
        fechaDesde: String,   
        fechaHasta: String,   
        page: Int \= 0,   
        size: Int \= 10  
    ): DocumentoElectronicoPage

    documentoElectronico(id: ID\!): DocumentoElectronicoGQL  
}

\# Definición de las operaciones de mutación (modificación de datos)  
type Mutation {  
    \# Inicia el proceso de generación de un DTE para una venta. Es asíncrono.  
    generarDocumentoElectronico(input: GenerarDTEInput\!): DocumentoElectronicoGQL

    \# Registra un nuevo evento para un DTE (ej. Cancelación)  
    registrarEvento(input: RegistrarEventoInput\!): EventoDTEGQL  
}

# Resolvers GraphQL

**DTEGraphQL**  
package com.techekuatia.dte.graphql.resolver;

import com.techekuatia.dte.financiero.model.DocumentoElectronico;  
import com.techekuatia.dte.financiero.service.DTEService; // Este servicio lo crearemos a continuación  
import graphql.kickstart.tools.GraphQLQueryResolver;  
import graphql.kickstart.tools.GraphQLMutationResolver;  
import lombok.RequiredArgsConstructor;  
import org.springframework.data.domain.Page;  
import org.springframework.stereotype.Component;

@Component  
@RequiredArgsConstructor  
public class DTEQueryResolver implements GraphQLQueryResolver, GraphQLMutationResolver {

    private final DTEService dteService;

    /\*\*  
     \* Resuelve la query 'documentosElectronicos' del esquema GraphQL.  
     \* Permite la paginación y filtrado de DTEs para el panel administrativo.  
     \*/  
    public Page\<DocumentoElectronico\> documentosElectronicos(  
            String estadoSifen,  
            String fechaDesde,  
            String fechaHasta,  
            int page,  
            int size) {  
        // La lógica de filtrado y paginación se delegará al DTEService  
        return dteService.findAll(estadoSifen, fechaDesde, fechaHasta, page, size);  
    }

    /\*\*  
     \* Resuelve la query 'documentoElectronico' para obtener un solo DTE por su ID.  
     \*/  
    public DocumentoElectronico documentoElectronico(Long id) {  
        return dteService.findById(id);  
    }  
      
 \* Resuelve la mutación 'generarDocumentoElectronico'.  
     \* Esta mutación inicia el flujo de creación de un DTE. Es el punto de entrada principal.  
     \*/  
    public DocumentoElectronico generarDocumentoElectronico(GenerarDTEInput input) {  
        // La lógica compleja se delega al servicio  
        return dteService.iniciarGeneracionDTE(input.getVentaId());  
    }  
      
    /\*\*  
     \* Resuelve la mutación 'registrarEvento'.  
     \* Inicia el flujo para registrar un evento (como Cancelación) sobre un DTE ya aprobado.  
     \*/  
    public EventoDTE registrarEvento(RegistrarEventoInput input) {  
        // La lógica del evento también se delega al servicio  
        return dteService.registrarEvento(input.getDocumentoElectronicoId(), input.getTipoEvento());  
    }  
}  
}

# DTOs para los Inputs de GraphQL:

**GenerarDTEInput.java**  
package com.techekuatia.dte.graphql.input;

import lombok.Data;

@Data  
public class GenerarDTEInput {  
    private Long ventaId;  
}

**RegistrarEventoInput.java**  
package com.techekuatia.dte.graphql.input;

import lombok.Data;

@Data  
public class RegistrarEventoInput {  
    private Long documentoElectronicoId;  
    private Integer tipoEvento;  
    // Podrías añadir más campos como 'justificacion' para un evento de cancelación  
}

# Capa de servicio (@Service)

**DTEService.java**  
package com.techekuatia.dte.financiero.service;

import com.techekuatia.dte.financiero.model.DocumentoElectronico;  
import com.techekuatia.dte.financiero.model.EventoDTE;  
import com.techekuatia.dte.financiero.repository.DocumentoElectronicoRepository; // Repositorio JPA  
import com.techekuatia.dte.financiero.repository.EventoDTERepository;  
import com.techekuatia.dte.financiero.repository.FacturaLegalRepository;  
import com.techekuatia.dte.financiero.model.FacturaLegal; // Tu entidad existente  
import lombok.RequiredArgsConstructor;  
import org.springframework.data.domain.Page;  
import org.springframework.data.domain.PageRequest;  
import org.springframework.stereotype.Service;  
import org.springframework.transaction.annotation.Transactional;

@Service  
@RequiredArgsConstructor  
public class DTEService {

    private final DocumentoElectronicoRepository documentoElectronicoRepository;  
    private final EventoDTERepository eventoDTERepository;  
    private final FacturaLegalRepository facturaLegalRepository;  
    // private final DteNodeClient dteNodeClient; // Un cliente HTTP para el microservicio Node.js

    @Transactional  
    public DocumentoElectronico iniciarGeneracionDTE(Long ventaId) {  
        // 1\. Validar que la venta existe y no tiene ya un DTE  
        FacturaLegal factura \= facturaLegalRepository.findByVentaId(ventaId)  
                .orElseThrow(() \-\> new RuntimeException("Factura no encontrada para la venta ID: " \+ ventaId));

        if (factura.getDocumentoElectronico() \!= null) {  
            throw new RuntimeException("La factura ya tiene un Documento Electrónico asociado.");  
        }

        // 2\. Crear la entidad DocumentoElectronico en estado PENDIENTE  
        DocumentoElectronico dte \= new DocumentoElectronico();  
        dte.setEstadoSifen("PENDIENTE");  
          
        // 3\. Asociar el DTE con la FacturaLegal  
        dte.setFacturaLegal(factura);  
        factura.setDocumentoElectronico(dte);  
          
        // 4\. Guardar en la BD  
        documentoElectronicoRepository.save(dte);  
        facturaLegalRepository.save(factura);

        // 5\. \*\*Lógica Asíncrona (MUY IMPORTANTE)\*\*  
        // Aquí es donde se llama al proceso que se comunica con el microservicio Node.js.  
        // Esto NO debe bloquear la respuesta al usuario.  
        // Puedes usar @Async de Spring, un sistema de colas (RabbitMQ, Kafka) o un simple hilo.  
        // Ejemplo con @Async (deberás configurarlo en tu aplicación):  
        generarYFirmarXmlAsync(dte);  
          
        return dte;  
    }

    // @Async  
    public void generarYFirmarXmlAsync(DocumentoElectronico dte) {  
        // Lógica para:  
        // a. Recolectar todos los datos necesarios de la BBDD (emisor, receptor, items).  
        // b. Construir el DTO para el microservicio de Node.js.  
        // c. Llamar a POST /api/documento/generar del microservicio.  
        // d. Recibir la respuesta (cdc, xmlFirmado, urlQr).  
        // e. Actualizar la entidad DocumentoElectronico con estos datos y cambiar estado a "GENERADO".  
        // f. Guardar los cambios en la BBDD.  
    }  
      
    @Transactional  
    public EventoDTE registrarEvento(Long dteId, Integer tipoEvento) {  
        // Lógica similar a la anterior:  
        // 1\. Validar que el DTE existe y está en un estado que permite el evento (ej. APROBADO).  
        // 2\. Crear la entidad EventoDTE.  
        // 3\. Llamar al microservicio de Node.js para generar y enviar el XML del evento.  
        // 4\. Actualizar el estado del evento según la respuesta de SIFEN.  
        return new EventoDTE(); // Placeholder  
    }

    public Page\<DocumentoElectronico\> findAll(String estadoSifen, String fechaDesde, String fechaHasta, int page, int size) {  
        // Aquí implementarías la lógica de filtrado usando Spring Data JPA Specifications o Querydsl  
        return documentoElectronicoRepository.findAll(PageRequest.of(page, size));  
    }

    public DocumentoElectronico findById(Long id) {  
        return documentoElectronicoRepository.findById(id)  
                .orElseThrow(() \-\> new RuntimeException("Documento Electrónico no encontrado"));  
    }  
      
    // Aquí irían los métodos para las tareas programadas (@Scheduled)  
    // \- @Scheduled(...) public void procesarLotesPendientes() { ... }  
    // \- @Scheduled(...) public void consultarResultadosDeLotes() { ... }  
}

# Tareas Programadas (@Scheduled)

En Spring Boot, las tareas programadas son la forma más sencilla y directa de implementar la lógica de lotes que SIFEN requiere. Se configuran con la anotación @Scheduled.Habilitar la Programación de Tareas:Primero, asegúrate de que la programación de tareas esté habilitada en tu aplicación principal o en una clase de configuración:

// En tu clase principal de Spring Boot  
import org.springframework.boot.SpringApplication;  
import org.springframework.boot.autoconfigure.SpringBootApplication;  
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication  
@EnableScheduling // \<-- ¡Añadir esta anotación\!  
public class TuAplicacionApplication {

    public static void main(String\[\] args) {  
        SpringApplication.run(TuAplicacionApplication.class, args);  
    }

}  
**DTEScheduler.java**  
package com.techekuatia.dte.scheduler;

import com.techekuatia.dte.financiero.model.DocumentoElectronico;  
import com.techekuatia.dte.financiero.model.LoteDTE;  
import com.techekuatia.dte.financiero.repository.DocumentoElectronicoRepository;  
import com.techekuatia.dte.financiero.repository.LoteDTERepository;  
// import com.techekuatia.dte.node.DteNodeClient; // El cliente HTTP para el microservicio  
import lombok.RequiredArgsConstructor;  
import lombok.extern.slf4j.Slf4j;  
import org.springframework.scheduling.annotation.Scheduled;  
import org.springframework.stereotype.Component;  
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;  
import java.util.List;

@Component  
@RequiredArgsConstructor  
@Slf4j  
public class DTEScheduler {

    private final DocumentoElectronicoRepository documentoElectronicoRepository;  
    private final LoteDTERepository loteDTERepository;  
    // private final DteNodeClient dteNodeClient; // Inyectar el cliente HTTP

    /\*\*  
     \* TAREA 1: Procesar y enviar lotes de DTEs pendientes.  
     \* Se ejecuta cada 10 minutos. Busca documentos en estado 'GENERADO',  
     \* los agrupa en un lote y los envía a SIFEN a través del microservicio.  
     \*/  
    @Scheduled(fixedRate \= 600000\) // 600,000 ms \= 10 minutos  
    @Transactional  
    public void procesarLotesPendientes() {  
        log.info("Iniciando tarea programada: Procesar Lotes Pendientes de DTE...");

        // 1\. Buscar hasta 50 documentos listos para ser enviados  
        List\<DocumentoElectronico\> documentosParaEnviar \= documentoElectronicoRepository.findTop50ByEstadoSifen("GENERADO");

        if (documentosParaEnviar.isEmpty()) {  
            log.info("No hay documentos en estado 'GENERADO'. Tarea finalizada.");  
            return;  
        }

        log.info("Se encontraron {} documentos para enviar.", documentosParaEnviar.size());

        // 2\. Crear una entidad LoteDTE para agruparlos  
        LoteDTE nuevoLote \= new LoteDTE();  
        nuevoLote.setFechaEnvio(OffsetDateTime.now());  
        nuevoLote.setEstadoSifen("ENVIANDO"); // Estado transitorio  
        loteDTERepository.save(nuevoLote);

        // 3\. Asociar cada documento al nuevo lote y actualizar su estado  
        for (DocumentoElectronico dte : documentosParaEnviar) {  
            dte.setLote(nuevoLote);  
            dte.setEstadoSifen("ENVIADO");  
        }  
        documentoElectronicoRepository.saveAll(documentosParaEnviar);

        try {  
            // 4\. Llamar al microservicio de Node.js para que envíe el lote a SIFEN  
            // List\<String\> xmls \= documentosParaEnviar.stream().map(DocumentoElectronico::getXmlFirmado).toList();  
            // String idProtocolo \= dteNodeClient.enviarLote(xmls);  
              
            String idProtocolo \= "dummy-protocol-12345"; // Placeholder

            // 5\. Actualizar el lote con el ID de protocolo de SIFEN  
            nuevoLote.setIdProtocoloSifen(idProtocolo);  
            nuevoLote.setEstadoSifen("RECIBIDO\_POR\_SIFEN");  
            loteDTERepository.save(nuevoLote);

            log.info("Lote ID {} enviado exitosamente. Protocolo SIFEN: {}", nuevoLote.getId(), idProtocolo);

        } catch (Exception e) {  
            log.error("Error al enviar el lote ID {} al microservicio.", nuevoLote.getId(), e);  
            // Lógica de reintento o notificación: revertir estados para el próximo ciclo  
            nuevoLote.setEstadoSifen("ERROR\_ENVIO");  
            loteDTERepository.save(nuevoLote);  
            for (DocumentoElectronico dte : documentosParaEnviar) {  
                dte.setEstadoSifen("GENERADO"); // Revertir para que se intente de nuevo  
            }  
            documentoElectronicoRepository.saveAll(documentosParaEnviar);  
        }  
    }

    /\*\*  
     \* TAREA 2: Consultar los resultados de los lotes ya enviados.  
     \* Se ejecuta cada 5 minutos. Busca lotes que SIFEN ya recibió  
     \* y consulta su estado final (aprobado/rechazado).  
     \*/  
    @Scheduled(fixedRate \= 300000\) // 300,000 ms \= 5 minutos  
    @Transactional  
    public void consultarResultadosDeLotes() {  
        log.info("Iniciando tarea programada: Consultar Resultados de Lotes...");

        // 1\. Buscar lotes que fueron recibidos por SIFEN pero aún no tienen un resultado final  
        List\<LoteDTE\> lotesPorConsultar \= loteDTERepository.findByEstadoSifen("RECIBIDO\_POR\_SIFEN");  
          
        if (lotesPorConsultar.isEmpty()) {  
            log.info("No hay lotes pendientes de consulta. Tarea finalizada.");  
            return;  
        }

        log.info("Se encontraron {} lotes para consultar.", lotesPorConsultar.size());

        for (LoteDTE lote : lotesPorConsultar) {  
            try {  
                // 2\. Llamar al microservicio para que consulte a SIFEN por el resultado  
                // String resultadoXml \= dteNodeClient.consultarLote(lote.getIdProtocoloSifen());  
                  
                // Placeholder de una respuesta exitosa  
                String resultadoXml \= "\<respuesta\>\<aprobado cdc='123...'/\>\<rechazado cdc='456...'\>Error en RUC\</rechazado\>\</respuesta\>";  
                  
                lote.setRespuestaSifen(resultadoXml);

                // 3\. \*\*Lógica de Parseo y Actualización\*\*  
                // Aquí iría la lógica compleja para parsear el XML de respuesta de SIFEN.  
                // Por cada DE en la respuesta, se debe encontrar en la BBDD por su CDC y actualizar su estado.  
                // Ejemplo simplificado:  
                // parsearXmlYActualizarEstados(resultadoXml);

                lote.setEstadoSifen("PROCESADO\_OK");  
                loteDTERepository.save(lote);  
                log.info("Lote ID {} procesado exitosamente.", lote.getId());

            } catch (Exception e) {  
                log.error("Error al consultar el resultado del lote ID {}", lote.getId(), e);  
                lote.setEstadoSifen("ERROR\_CONSULTA");  
                loteDTERepository.save(lote);  
            }  
        }  
    }  
}

# Repositorios JPA necesarios:

**DocumentoElectrónicoRepository.java**

package com.techekuatia.dte.financiero.repository;

import com.techekuatia.dte.financiero.model.DocumentoElectronico;  
import org.springframework.data.jpa.repository.JpaRepository;  
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository  
public interface DocumentoElectronicoRepository extends JpaRepository\<DocumentoElectronico, Long\> {  
    // Busca los primeros 50 DTE en estado 'GENERADO' para procesar en un lote.  
    List\<DocumentoElectronico\> findTop50ByEstadoSifen(String estado);  
}  
**LoteDTERepository.java**  
package com.techekuatia.dte.financiero.repository;

import com.techekuatia.dte.financiero.model.LoteDTE;  
import org.springframework.data.jpa.repository.JpaRepository;  
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository  
public interface LoteDTERepository extends JpaRepository\<LoteDTE, Long\> {  
    // Busca lotes que están pendientes de consulta.  
    List\<LoteDTE\> findByEstadoSifen(String estado);  
}  

# Resumen de las Direcciones Electrónicas de los Servicios Web para Ambientes de Pruebas y Producción
**URL**
https://sifen.set.gov.py/de/ws/sync/recibe.wsdl?wsdl                    //Produccion
https://sifen.set.gov.py/de/ws/async/recibe-lote.wsdl?wsdl              //Produccion
https://sifen.set.gov.py/de/ws/eventos/evento.wsdl?wsdl                 //Produccion
https://sifen.set.gov.py/de/ws/consultas/consulta-lote.wsdl?wsdl        //Produccion
https://sifen.set.gov.py/de/ws/consultas/consulta-ruc.wsdl?wsdl         //Produccion
https://sifen.set.gov.py/de/ws/consultas/consulta.wsdl?wsdl             //Produccion
https://sifen-test.set.gov.py/de/ws/sync/recibe.wsd?wsdl                //Test
https://sifen-test.set.gov.py/de/ws/async/recibe-lote.wsdl?wsdl         //Test
https://sifen-test.set.gov.py/de/ws/eventos/evento.wsdl?wsdl            //Test
https://sifen-test.set.gov.py/de/ws/consultas/consulta.wsdl?wsdl        //Test
https://sifen-test.set.gov.py/de/ws/consultas/consulta-lote.wsdl?wsdl   //Test
https://sifen-test.set.gov.py/de/ws/consultas/consulta-ruc.wsdl?wsdl    //Test
