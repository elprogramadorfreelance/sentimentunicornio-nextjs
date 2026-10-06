export const FECHA_ACTUALIZACION_AVISO = "29 de julio de 2026";

export type SeccionAvisoPrivacidad = {
  id: string;
  titulo: string;
  /** Etiqueta corta para el sidemenu */
  nav: string;
  cuerpo: readonly string[];
};

export const SECCIONES_AVISO_PRIVACIDAD: readonly SeccionAvisoPrivacidad[] = [
  {
    id: "responsable",
    titulo: "1. Responsable del tratamiento",
    nav: "Responsable",
    cuerpo: [
      "El responsable del tratamiento de los datos personales es [Nombre o razón social del responsable] (en adelante, “Unicornio” o “nosotros”), con domicilio en [domicilio completo para efectos de notificaciones] y correo de contacto en privacidad@[dominio].",
      "Unicornio es una plataforma SaaS de monitoreo de sentimiento que permite a marcas, figuras públicas, actores políticos, agencias y otras entidades comprender qué se dice de ellas en noticias y redes sociales, y si esa conversación es positiva, neutra o negativa.",
    ],
  },
  {
    id: "ambito",
    titulo: "2. Ámbito de aplicación",
    nav: "Ámbito",
    cuerpo: [
      "Este aviso aplica a los usuarios con cuenta de acceso a la plataforma (creada y entregada por el equipo de Unicornio / soporte), a quienes solicitan una demostración del producto, y a quienes navegan las páginas públicas asociadas al servicio (por ejemplo, inicio de sesión y recuperación de contraseña).",
      "En el MVP, no existe registro público (self-signup): las cuentas se provisionan de forma controlada. El alcance de este documento contempla ese modelo y podrá ampliarse en fases posteriores (equipos, multi-tenant, facturación, etc.).",
    ],
  },
  {
    id: "datos",
    titulo: "3. Datos personales que podemos tratar",
    nav: "Datos personales",
    cuerpo: [
      "Datos de cuenta y contacto: nombre, correo electrónico, credenciales de acceso (almacenadas de forma segura / cifrada según el proveedor de autenticación), rol o cargo declarado, organización o proyecto asociado, y datos de soporte cuando contactas al equipo.",
      "Datos de uso de la plataforma: registros de acceso, dirección IP, tipo de dispositivo o navegador, páginas visitadas dentro de la app, preferencias de sesión (por ejemplo, “mantener activa mi sesión”) y metadatos técnicos necesarios para seguridad y operación.",
      "Datos de configuración del monitoreo: nombre y descripción de proyectos, tipo de proyecto (marca, figura pública, político, agencia u otro), palabras clave, fuentes a seguir, imágenes o archivos que el usuario cargue al perfil del proyecto, y parámetros de alertas.",
      "Contenido de fuentes públicas o de terceros: menciones, titulares, extractos, enlaces, metadatos de publicación y señales derivadas (volumen, sentimiento, tendencias, posibles alertas de desinformación). Este contenido suele ser información pública o obtenida mediante proveedores / APIs; no sustituye el cumplimiento de cada fuente respecto de sus propios términos.",
      "En principio no solicitamos datos personales sensibles. Si en algún flujo se recabaran, se solicitará consentimiento expreso cuando la ley lo exija.",
    ],
  },
  {
    id: "finalidades",
    titulo: "4. Finalidades del tratamiento",
    nav: "Finalidades",
    cuerpo: [
      "Primarias (necesarias para el servicio): autenticar y administrar tu cuenta; prestar el monitoreo de sentimiento y las métricas del dashboard; gestionar proyectos, palabras clave y fuentes; generar alertas y reportes operativos; brindar soporte técnico; mantener la seguridad, prevención de fraude y continuidad del servicio.",
      "Secundarias (opcionales): mejorar el producto con analítica agregada o seudonimizada; enviar comunicaciones sobre el servicio, actualizaciones o invitaciones a demostraciones. Puedes oponerte a finalidades secundarias sin que ello afecte el acceso al servicio contratado, salvo que sean indispensables por otra base legal.",
    ],
  },
  {
    id: "bases",
    titulo: "5. Bases y principios",
    nav: "Bases y principios",
    cuerpo: [
      "Tratamos datos conforme a los principios de licitud, consentimiento (cuando aplique), información, calidad, finalidad, lealtad, proporcionalidad y responsabilidad, de acuerdo con la legislación mexicana en materia de protección de datos personales y, en su caso, normativa aplicable a la jurisdicción del cliente.",
      "La prestación del servicio y la ejecución de la relación contractual / de acceso son bases principales del tratamiento de datos de cuenta y de configuración. El análisis de menciones públicas se orienta a reputación y percepción, no a la identificación indebida de terceros ajenos al objeto del monitoreo.",
    ],
  },
  {
    id: "transferencias",
    titulo: "6. Transferencias y encargados",
    nav: "Transferencias",
    cuerpo: [
      "Podemos compartir datos con proveedores que actúan como encargados del tratamiento (hospedaje, correo transaccional, autenticación, analítica, proveedores de datos o IA para clasificación de sentimiento), siempre bajo contratos o cláusulas que limiten el uso a las finalidades aquí descritas.",
      "También podremos divulgar información cuando exista mandato legal, requerimiento de autoridad competente, o para proteger derechos, seguridad de usuarios o integridad de la plataforma.",
      "Si en el futuro se realizan transferencias internacionales, se informarán los países o mecanismos de salvaguarda correspondientes en una actualización de este aviso.",
    ],
  },
  {
    id: "conservacion",
    titulo: "7. Conservación",
    nav: "Conservación",
    cuerpo: [
      "Los datos de cuenta se conservan mientras la relación de acceso esté vigente y durante los plazos adicionales que exijan obligaciones legales, contables o de seguridad.",
      "Los datos de monitoreo histórico (menciones, métricas, alertas) se conservarán según la política de retención del producto —aún por definir en el MVP— y los límites contractuales con cada cliente. Al concluir el servicio, se procederá a la baja, bloqueo o eliminación conforme a lo acordado y a la ley.",
    ],
  },
  {
    id: "derechos",
    titulo: "8. Derechos ARCO y revocación del consentimiento",
    nav: "Derechos ARCO",
    cuerpo: [
      "Puedes ejercer tus derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO), así como limitar el uso o divulgación de tus datos y revocar el consentimiento para finalidades secundarias, enviando una solicitud a privacidad@[dominio] con: nombre completo, medio para recibir respuesta, descripción clara de la solicitud y documento que acredite identidad (y representación, si aplica).",
      "Responderemos en los plazos previstos por la normativa aplicable. Si consideras que tu derecho no fue atendido, puedes acudir al Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI) u autoridad competente.",
    ],
  },
  {
    id: "seguridad",
    titulo: "9. Medidas de seguridad",
    nav: "Seguridad",
    cuerpo: [
      "Implementamos medidas administrativas, técnicas y físicas razonables para proteger los datos personales contra daño, pérdida, alteración, destrucción o uso, acceso o tratamiento no autorizados. El nivel de detalle de controles podrá ampliarse en anexos de seguridad o DPA con clientes empresariales.",
    ],
  },
  {
    id: "cookies",
    titulo: "10. Cookies y tecnologías similares",
    nav: "Cookies",
    cuerpo: [
      "El sitio y la aplicación pueden utilizar cookies o almacenamiento local estrictamente necesarios para la sesión, seguridad y preferencias básicas. Si se incorporan cookies analíticas o de marketing, se informará y, cuando corresponda, se solicitará consentimiento mediante un mecanismo dedicado.",
    ],
  },
  {
    id: "menores",
    titulo: "11. Menores de edad",
    nav: "Menores",
    cuerpo: [
      "El servicio está dirigido a usuarios profesionales y no está pensado para menores de edad. Si tienes indicios de que un menor nos proporcionó datos sin autorización, contáctanos para proceder a su eliminación.",
    ],
  },
  {
    id: "cambios",
    titulo: "12. Cambios a este aviso",
    nav: "Cambios",
    cuerpo: [
      "Podemos actualizar este aviso para reflejar cambios legales, del producto o de nuestros procesos. La fecha de última actualización aparecerá al inicio del documento. Cuando los cambios sean sustanciales, podremos notificarlos por correo o mediante un aviso en la plataforma.",
    ],
  },
  {
    id: "contacto",
    titulo: "13. Contacto",
    nav: "Contacto",
    cuerpo: [
      "Para dudas sobre este aviso o el tratamiento de datos personales: privacidad@[dominio] · [teléfono opcional] · [domicilio].",
      "Para soporte operativo de la cuenta (no ARCO): usa el módulo de Soporte dentro de la aplicación o el canal que te haya indicado el equipo de Unicornio.",
    ],
  },
] as const;
