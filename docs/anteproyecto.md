# Anteproyecto — Laboratorio Virtual de Linux como Mediador Pedagógico para Cursos de Sistemas Operativos

**Proyecto:** LinuxLab UFPS
**Tipo de documento:** Anteproyecto de trabajo de grado (fase inicial)
**Autores:** Mauricio Di Donato Sánchez, Andersson Camilo Cárdenas Guarín
**Director:** Marco Antonio Adarme Jaimes
**Programa:** Ingeniería de Sistemas, Universidad Francisco de Paula Santander · 2025

---

## 1. Presentación general del anteproyecto

### 1.1 Título

Laboratorio Virtual de Linux como Mediador Pedagógico para Cursos de Sistemas Operativos.

### 1.2 Planteamiento del problema

Dentro del plan de estudios del Programa de Ingeniería de Sistemas de la Universidad Francisco de Paula Santander, en la asignatura de Sistemas Operativos los estudiantes aplican conceptos de administración de procesos, manejo de memoria, gestión de usuarios y permisos, y realizan sus actividades prácticas en el sistema operativo Linux. Actualmente, el acceso a entornos Linux para los estudiantes del curso se realiza mediante un servidor propio del docente, al cual los estudiantes se conectan por medio del servicio SSH. En este marco de trabajo, cada estudiante recibe una cuenta de usuario en el servidor con limitación de espacio en disco y tiempo de uso; dicha limitación temporal obedece a que el profesor apaga el servidor durante la noche para reducir costos, por lo que este entorno sólo está disponible en horario predeterminado.

Aunque esta alternativa habilita un entorno Linux para los estudiantes, presenta limitaciones significativas:

- La dependencia de un servidor no institucional implica que la responsabilidad administrativa y los costos económicos recaigan en el docente.
- La exposición del servicio SSH a usuarios externos aumenta el riesgo de un ataque al servidor por posibles accesos no autorizados.
- La limitación de espacio y tiempo impide la persistencia de las sesiones de trabajo, lo cual fragmenta el proceso formativo de los estudiantes.

Desde la perspectiva pedagógica, la solución actual también limita la aplicación de metodologías activas y el diseño de laboratorios autoevaluables. Si bien se ofrece un entorno real de trabajo, se deja de lado el ambiente académico, pues dicho entorno no contiene ningún tipo de seguimiento, ni lecciones estructuradas o ejercicios autoevaluables que guíen el proceso formativo del estudiante.

Finalmente, los periodos de inactividad del servidor y la imposibilidad de conexión durante horarios de mantenimiento o fuera de disponibilidad reducen la autonomía del aprendizaje práctico y dificultan la realización de ejercicios fuera de los espacios académicos programados.

Esta problemática se esquematiza en la Figura 1, donde se evidencian las principales limitaciones del entorno práctico actual, relacionadas con la dependencia de un servidor no institucional, la disponibilidad restringida, la falta de orientación académica y los riesgos de seguridad asociados al uso de SSH.

*Figura 1. Árbol del Problema*

### 1.3 Justificación

Contar con una plataforma institucional que permita trabajar en entornos Linux sin depender de servidores personales eliminaría las limitaciones actuales relacionadas con la disponibilidad horaria, la pérdida de progreso en las sesiones y los riesgos de seguridad derivados de la exposición de servicios externos. Esta iniciativa contribuiría a crear un espacio de aprendizaje donde los estudiantes puedan realizar ejercicios prácticos en cualquier momento, consolidando los conocimientos adquiridos en clase a través de la experimentación directa con el sistema operativo.

Según Ruff y Giacobe (2022), las máquinas virtuales basadas en navegador ofrecen un entorno eficiente y de bajo costo para la enseñanza de fundamentos de sistemas operativos, al eliminar las restricciones de infraestructura y permitir que los estudiantes desarrollen sus actividades sin depender de configuraciones locales o servidores externos. De manera complementaria, Park y Kim (2020) demostraron que los entornos en la nube diseñados para la práctica con el kernel de Linux facilitan tanto el aprendizaje de los estudiantes como la labor de los instructores, al ofrecer espacios individuales, automatizados y fácilmente evaluables, lo que reduce significativamente el tiempo y esfuerzo requeridos en las actividades de programación del sistema operativo. En este sentido, una plataforma web que permita desarrollar, almacenar y evaluar ejercicios prácticos aportaría valor formativo adicional al ofrecer escenarios auténticos, promover la interacción entre pares y proporcionar andamiajes que mejoren la comprensión y aplicación de los conceptos vistos en clase.

Además, al implementarse de manera institucional, la plataforma eliminaría los costos económicos y administrativos, ya que la infraestructura y el mantenimiento pasarían a formar parte de los recursos tecnológicos de la universidad. Esto no solo garantizaría sostenibilidad y escalabilidad, sino que también permitiría ampliar el acceso a un mayor número de estudiantes sin comprometer el rendimiento o la seguridad del sistema. Un entorno de este tipo podría integrar laboratorios guiados, terminales virtuales y simuladores de comandos Linux diseñados específicamente para fines pedagógicos, replicando con fidelidad el entorno real sin exponer los servidores a riesgos derivados del acceso SSH directo o del uso de privilegios administrativos. De acuerdo con Mihci y Satici (2020), los entornos que integran herramientas interactivas y actividades de autoevaluación contribuyen significativamente al desarrollo del pensamiento crítico y al aprendizaje autónomo, fortaleciendo el proceso formativo mediante estrategias activas y mediadores pedagógicos digitales.

Finalmente, una solución de este tipo permitiría mantener el enfoque académico del curso de Sistemas Operativos, ofreciendo experiencias prácticas estructuradas y seguras que integren metodologías activas y evaluación continua, consolidando así un entorno académico más seguro y adaptado a las necesidades reales del aprendizaje.

### 1.4 Objetivos

#### 1.4.1 Objetivo general

Desarrollar un laboratorio virtual que integre una terminal Linux con recursos hipermediales y conceptuales del curso de Sistemas Operativos.

#### 1.4.2 Objetivos específicos

1. Realizar la revisión tecnológica de aplicaciones o productos similares.
2. Analizar los contenidos del curso de Sistemas Operativos para la identificación y definición de los recursos conceptuales requeridos para el desarrollo de materiales y mediadores pedagógicos digitales.
3. Implementar la arquitectura de despliegue de una plataforma de laboratorio Linux Shell que incorpore mecanismos de seguridad basados en la integridad, confidencialidad y disponibilidad del entorno.
4. Desarrollar un componente interactivo que permita la creación dinámica de talleres prácticos.
5. Establecer escenarios de prueba orientados a evaluar la usabilidad, funcionalidad e interacción del laboratorio de Linux con los estudiantes y profesores del curso de Sistemas Operativos.

### 1.5 Alcances y delimitaciones

#### 1.5.1 Alcances

- El laboratorio virtual se desarrollará y desplegará en los servidores del Departamento de Sistemas e Informática de la Universidad Francisco de Paula Santander, utilizando la infraestructura tecnológica institucional disponible.
- Cada usuario contará con límites predefinidos de espacio en disco y memoria RAM asignados de forma controlada, garantizando un uso equitativo de los recursos del sistema y evitando la saturación del servidor.
- Se desarrollará un componente de talleres dinámicos basado en una estructura flexible que permita a los docentes crear, configurar y desplegar ejercicios y evaluaciones sobre temas específicos del curso de Sistemas Operativos, con validación automática de respuestas.
- La plataforma incluirá recursos hipermediales estructurados (tutoriales, guías, documentación) organizados por módulos temáticos alineados con los contenidos del curso de Sistemas Operativos.

#### 1.5.2 Delimitaciones

- El producto está diseñado exclusivamente para el entorno académico del curso de Sistemas Operativos del programa de Ingeniería de Sistemas, no contemplando su uso en contextos de producción o desarrollo profesional externo.
- La plataforma está dirigida específicamente a estudiantes matriculados en el curso de Sistemas Operativos y a los docentes responsables de su enseñanza, no contemplando su extensión a otros cursos o programas académicos en esta fase del proyecto.

## 2. Marco referencial

### 2.1 Antecedentes

Como parte del proceso metodológico, se llevó a cabo una búsqueda sistemática de literatura en bases de datos reconocidas como Scopus, Google Académico y diversos repositorios digitales. Para ello, se emplearon términos clave tales como "linux", "virtual laboratory", "learning", "operating systems course" y "terminal". La selección de fuentes se realizó considerando la relevancia temática en relación con los objetivos específicos del estudio, con una ventana de tiempo del 2017 hacia adelante.

**Evaluating the effectiveness of a cloud-based laboratory for teaching Linux operating systems to Computer Science students**

Oleksiuk et al. (2024) del Ternopil Volodymyr Hnatiuk National Pedagogical University, Ucrania, investigaron la efectividad de un laboratorio basado en la nube para la enseñanza de sistemas operativos Linux a futuros docentes de informática. Integraron el curso NDG Linux Essentials de Cisco Networking Academy con plataformas de nube privada Apache CloudStack y Proxmox VE, desarrollando un modelo de laboratorio con materiales complementarios como pruebas, ensayos y tareas de tres niveles de complejidad. Se analizaron las actividades de los estudiantes en entornos reales de blended learning, y se aplicó un experimento pedagógico con 54 participantes, evaluado mediante ANOVA de medidas repetidas y coeficiente de correlación de Spearman para determinar el impacto de factores como género y experiencia previa en Linux. Se halló una mejora significativa en el rendimiento académico tras el uso del laboratorio, con un incremento promedio de 6 a 12 puntos en las calificaciones; la experiencia previa influyó positivamente en el desempeño de medio término, pero su efecto se diluyó en la evaluación final, sin diferencias relevantes por género. La investigación demostró que un laboratorio en la nube, integrado con contenidos MOOC y recursos hipermediales, supera limitaciones de acceso, escalabilidad y persistencia propias de entornos tradicionales basados en servidores físicos.

**Selecting cloud computing software for a virtual online laboratory supporting the Operating Systems course**

Holovnia y Oleksiuk (2022) de la Zhytomyr Polytechnic State University, Ucrania, investigaron la selección de software de computación en la nube para un laboratorio virtual en línea que apoye el curso de Sistemas Operativos. Realizaron una revisión de plataformas de nube privada (IaaS) adaptadas a necesidades pedagógicas, analizaron trabajos relacionados sobre entornos cloud para enseñanza de SO como AWS, OpenStack y experiencias previas con VirtualBox y Docker. También elaboraron requisitos básicos como disponibilidad, estabilidad, escalabilidad y seguridad, y requisitos adicionales como soporte para comandos administrativos, aislamiento de red, persistencia de estados y scripting. Adicionalmente, compararon Eucalyptus, OpenStack, CloudStack y OpenNebula en términos de arquitectura, facilidad de implementación, costo, integración con hipervisores y adaptabilidad educativa mediante una matriz de criterios. Se halló que las plataformas open-source privadas superan a las SaaS comerciales en control y personalización para laboratorios OS, con Eucalyptus destacando en simplicidad de despliegue y compatibilidad con AWS, y OpenStack en escalabilidad y comunidad; CloudStack y OpenNebula presentan fortalezas en gestión de redes, pero limitaciones en madurez para entornos educativos. La investigación demostró que entornos cloud hechos a la medida resuelven desafíos como la variedad de herramientas y aislamiento de "playgrounds", priorizando plataformas que equilibren costo bajo con alta seguridad y persistencia. Esto resulta relevante para esta investigación al proporcionar un marco de requisitos y comparación para seleccionar plataformas cloud seguras y escalables en laboratorios virtuales Linux, así como determinar componentes de despliegue con normas de seguridad estándar.

**Teaching operating systems concepts using the cloud**

Gaffar y Hajjdiab (2018) de la Abu Dhabi University, Emiratos Árabes Unidos, investigaron la enseñanza de conceptos de sistemas operativos mediante laboratorios en la nube, utilizando un enfoque práctico con instancias Ubuntu en Amazon AWS para asignaciones en programación C sobre procesos concurrentes, threads, pipes y sockets. Desarrollaron una metodología que incluye creación de una instancia Ubuntu, configuración de grupos de usuarios, generación de cuentas con directorios aislados, implementación de un socket servidor TCP, envío de secuencias aleatorias a clientes, y un script shell automatizado para calificación que compara outputs estudiantiles con archivos del servidor. Se halló que el modelo reduce costos al escalar recursos on-demand, elimina requisitos de hardware local, y garantiza experiencias equitativas para participantes remotos, con evaluación automática que optimiza el tiempo del instructor, aunque depende de claves SSH para acceso y presenta riesgos de seguridad en permisos de archivos. Este estudio resulta relevante al contrastar un modelo basado en el servicio SSH y nube pública con las limitaciones que este proyecto busca superar, pues el objetivo es garantizar el aprendizaje autónomo del estudiante con seguridad institucional y sin exposición de servicios SSH.

**Plataforma educativa con elementos de gamificación para la enseñanza de comandos de Linux**

Freitas (2018) del Instituto Federal de Goiás - Câmpus Jataí, Brasil, investigó el desarrollo de una plataforma web educativa para la enseñanza de comandos Linux destinada a estudiantes del programa de Tecnología en Análisis y Desarrollo de Sistemas. El autor desarrolló una aplicación web multiplataforma que requiere únicamente un navegador y conexión a internet para su ejecución, proporcionando al usuario practicidad, flexibilidad, movilidad y comodidad en el acceso al entorno de aprendizaje. La arquitectura de la plataforma implementa un sistema de gestión de contenidos estructurado jerárquicamente mediante cursos, módulos y materiales didácticos, donde los docentes y tutores pueden administrar completamente el contenido mediante funcionalidades CRUD (consulta, inclusión, alteración y exclusión) para cursos, módulos, contenidos teóricos, cuestiones de opción múltiple y actividades prácticas con validación de respuestas, incluyendo la capacidad de reordenar la secuencia de presentación de estos elementos para optimizar la progresión pedagógica.

Se implementó un mecanismo de retroalimentación inmediata que informa al estudiante instantáneamente si su respuesta a cuestiones o actividades fue correcta o incorrecta, presentando la respuesta correcta en caso de error, eliminando así la necesidad de intervención docente para correcciones básicas y permitiendo al estudiante identificar y corregir sus errores de manera autónoma durante el proceso de aprendizaje. El sistema incorpora funcionalidades de persistencia de progreso (requisito funcional RF18) que permite guardar automáticamente el punto exacto donde el usuario detuvo su actividad, posibilitando la continuación del aprendizaje sin necesidad de rehacer actividades previamente completadas, resolviendo así el problema de fragmentación del proceso formativo identificado en entornos tradicionales con limitación temporal.

La plataforma provee herramientas administrativas mediante un panel que permite a los docentes generar reportes generales, visualizar dashboards con información estadística presentada en forma de texto y gráficos, gestionar usuarios mediante sistema de autenticación con roles diferenciados (profesor, tutor, alumno), y monitorear el progreso estudiantil a través de métricas de avance por módulo, optimizando significativamente el tiempo y esfuerzo docente requerido para el seguimiento y evaluación de estudiantes. Se halló que la subdivisión del contenido en módulos temáticos progresivos tales como conceptos iniciales, comandos de información de estado y operaciones avanzadas, combinada con la asignación de puntuación previamente definida por el docente para cada contenido, cuestión o actividad, facilita tanto la organización curricular como el seguimiento objetivo del progreso estudiantil mediante barras de progreso que informan el porcentaje de avance dentro de cada módulo.

La investigación demostró que una plataforma web educativa con arquitectura cliente-servidor, sistema de gestión de contenidos estructurado, mecanismos de autoevaluación con retroalimentación inmediata y herramientas de administración docente centralizada, proporciona una solución integral que reduce la resistencia al aprendizaje de la línea de comandos Linux mientras elimina barreras de acceso relacionadas con disponibilidad horaria, configuración de hardware local y dependencia de infraestructura física. Esto resulta relevante para esta investigación al validar la viabilidad técnica y pedagógica de implementar una plataforma web que combine terminal Linux funcional con recursos hipermediales estructurados, sistema de gestión de contenidos administrable por docentes, mecanismos de autoevaluación que proporcionen retroalimentación inmediata sin intervención docente para correcciones básicas, y persistencia de sesiones de trabajo que elimine la fragmentación del proceso formativo, aspectos directamente alineados con los objetivos de desarrollar componentes para talleres dinámicos, analizar contenidos de sistemas operativos para establecer recursos conceptuales, y ofrecer un shell basado en normas de seguridad estándar contemplados en el presente proyecto.

**Linux online virtual environments in teaching operating systems**

Holovnia (2020) de la Zhytomyr Polytechnic State University, Ucrania, investigó los entornos virtuales en línea de Linux basados en diversas tecnologías de virtualización para la enseñanza de sistemas operativos. La autora parte del reconocimiento de que los cursos de sistemas operativos requieren asignaciones prácticas en sistemas Unix-like, mientras que los equipos de laboratorio universitarios, laptops de estudiantes y computadoras personales generalmente vienen con instalación de Windows, situación que justifica el uso de tecnologías de virtualización que permitan trabajar con el sistema operativo objetivo sin comprometer la seguridad de los equipos institucionales. Desarrolló una metodología basada en el enfoque variado de aplicación de tecnologías de virtualización, combinando múltiples herramientas para atender las características individuales del curso, las necesidades particulares de los estudiantes y garantizar tolerancia a fallos de hardware y software. Durante la implementación de cursos Unix/Linux Operating Systems y Operating Systems en Zhytomyr Polytechnic State University entre 2019 y 2020, empleó herramientas tales como máquinas virtuales del curso NDG Linux Essentials disponible en CISCO Networking Academy, Oracle VirtualBox, laptops con distribuciones Ubuntu y Arch, e instancias Amazon EC2 t2.micro de manera intermitente, analizando sistemáticamente las ventajas y desventajas de cada grupo de entornos virtuales.

Se halló que los terminales Unix/Linux en línea independientes, a pesar de su fácil accesibilidad y gratuidad, presentan limitaciones significativas como conjunto reducido de comandos disponibles, obsolescencia, restricciones de acceso root y de red, además de incertidumbre sobre la sostenibilidad futura de estos proyectos al ser desarrollados por pocos entusiastas; las IDEs en línea que incluyen terminales Unix/Linux ofrecen funcionalidades intermedias pero tampoco satisfacen completamente las necesidades de un curso completo de sistemas operativos; mientras que los entornos virtuales Unix/Linux de función completa en la nube, aunque más robustos, requieren consideraciones especiales de diseño. La autora identificó requisitos específicos que debe cumplir un entorno virtual en línea para sistemas operativos, incluyendo soporte de comandos administrativos y no administrativos típicos de una instalación Linux completa, otorgamiento de privilegios administrativos a estudiantes dentro del entorno virtual, soporte de operaciones básicas de red como cambio de configuración de red y ping, capacidad de carga y descarga de archivos hacia y desde entornos virtuales, habilidad para mantener actualizado el sistema operativo invitado, soporte de bash scripting, y capacidad de persistencia de archivos de estudiantes entre reinicios. La investigación demostró que existe un desafío fundamental en encontrar el balance entre disponibilidad y estabilidad de los entornos virtuales por un lado, y el realismo de la experiencia de aprendizaje de los estudiantes por el otro, problema que requiere el desarrollo de un sistema diseñado individualmente que provea entornos virtuales en línea de Linux adaptados específicamente a las necesidades pedagógicas. Esto resulta relevante para esta investigación al fundamentar la necesidad de diseñar una plataforma institucional que combine las ventajas de accesibilidad de los terminales en línea con la funcionalidad completa de instalaciones Linux reales, abordando específicamente los requisitos de persistencia de sesiones, privilegios administrativos controlados, y automatización de retroalimentación que facilite el trabajo del personal docente con grandes números de estudiantes.

**Virtual Online Laboratory supporting the operating systems course**

Srinivasulu y Bhavani (2022), de Malla Reddy College of Engineering for Women en India, realizaron un estudio orientado a la identificación de plataformas cloud adecuadas para implementar laboratorios virtuales en cursos de Sistemas Operativos. Los autores destacan que, aunque los estudiantes requieren acceso administrativo a entornos Linux completos para realizar prácticas relacionadas con procesos, memoria, redes y scripting, la mayoría de laboratorios institucionales y equipos personales están basados en Windows, lo que dificulta la disponibilidad de estos entornos de forma directa. Su investigación evalúa tanto servicios en la nube bajo el modelo IaaS como plataformas de nube privada diseñadas específicamente para uso educativo, concluyendo que las soluciones cloud genéricas presentan limitaciones significativas en términos de persistencia, control, costos y dependencia del proveedor. En contraste, las plataformas de nube privada como OpenStack, Eucalyptus, CloudStack y OpenNebula permiten configurar laboratorios con máquinas virtuales completas, control de red, almacenamiento persistente y privilegios administrativos, asegurando entornos realistas para la enseñanza práctica. Además, se especifican los requisitos mínimos e ideales que un laboratorio virtual debe cumplir para soportar adecuadamente cursos de Sistemas Operativos, incluyendo soporte para comandos administrativos, aislamiento seguro, gestión de redes, personalización del entorno y preservación de los avances del estudiante entre sesiones. Esta investigación es relevante para el presente proyecto, pues valida la necesidad de diseñar un entorno institucional controlado que combine terminal Linux funcional, persistencia de sesiones y recursos educativos estructurados, superando las limitaciones del acceso por SSH a servidores personales que actualmente enfrentan los estudiantes del curso.

**Conclusiones de las investigaciones realizadas**

| Proyecto | Descripción | Aporte al proyecto |
|---|---|---|
| Evaluating the effectiveness of a cloud-based laboratory for teaching Linux operating systems to Computer Science students | Laboratorio en la nube que integra curso NDG Linux Essentials con plataformas Apache CloudStack y Proxmox VE, incluyendo materiales complementarios y tareas de tres niveles de complejidad. | Valida la efectividad pedagógica de laboratorios en la nube con contenidos MOOC y recursos hipermediales. Demuestra que estos entornos superan limitaciones de acceso, escalabilidad y persistencia de servidores físicos tradicionales. |
| Selecting cloud computing software for a virtual online laboratory supporting the Operating Systems course | Comparación de plataformas de nube privada (OpenStack, CloudStack, OpenNebula) para laboratorios de SO, estableciendo requisitos básicos (disponibilidad, estabilidad, escalabilidad, seguridad) y adicionales (comandos administrativos, aislamiento de red, persistencia, scripting). | Proporciona un marco de requisitos para seleccionar plataformas que permitan entregar entornos Linux completos en un laboratorio virtual. Aunque analiza plataformas de nube privada, su aporte principal para este proyecto radica en los criterios de disponibilidad, estabilidad, seguridad y persistencia necesarios para cualquier entorno institucional controlado, independientemente de la tecnología específica. |
| Teaching operating systems concepts using the cloud | Laboratorio en AWS con instancias Ubuntu para programación en C (procesos, threads, pipes, sockets). Incluye script shell automatizado para calificación que compara outputs estudiantiles con archivos del servidor. | Aporta un contraste clave al mostrar las limitaciones de depender de instancias remotas vía SSH. Su valor para este proyecto es evidenciar por qué se requiere un entorno web seguro que no exponga claves ni puertos, manteniendo los beneficios de automatización y retroalimentación inmediata. |
| Plataforma educativa con elementos de gamificación para la enseñanza de comandos de Linux | Plataforma web multiplataforma con sistema de gestión de contenidos jerárquico (cursos/módulos/materiales), retroalimentación inmediata, persistencia de progreso, panel administrativo docente con reportes y dashboards, y roles diferenciados (profesor/tutor/alumno). | Válida viabilidad técnica y pedagógica de combinar terminal Linux funcional con recursos hipermediales estructurados, autoevaluación con retroalimentación inmediata, persistencia de sesiones y gestión de contenidos administrable por docentes. Modelo directo para componentes de talleres dinámicos. |
| Linux online virtual environments in teaching operating systems | Análisis comparativo de tecnologías de virtualización (NDG Linux Essentials, VirtualBox, Ubuntu/Arch) para enseñanza de SO. Identifica requisitos específicos: comandos administrativos completos, privilegios root controlados, operaciones de red, persistencia de archivos, y bash scripting. | Fundamenta necesidad de plataforma institucional que combine accesibilidad de terminales en línea con funcionalidad completa de Linux real. Establece requisitos técnicos para persistencia de sesiones, privilegios administrativos controlados y automatización de retroalimentación. |
| Virtual Online Laboratory supporting the operating systems course | Evaluación de plataformas cloud IaaS vs. nube privada (OpenStack, CloudStack, OpenNebula) para laboratorios de SO. Define requisitos mínimos e ideales: comandos administrativos, aislamiento seguro, gestión de redes, personalización y preservación de avances entre sesiones. | Valida la necesidad de un entorno institucional controlado que garantice persistencia, seguridad y acceso a un Linux funcional. Aunque revisa plataformas de nube privada, lo relevante para este proyecto es la identificación de requisitos esenciales para un laboratorio virtual eficaz, sin implicar que la solución deba implementarse necesariamente mediante dichas tecnologías. |

De esta forma se puede concluir que:

- Los laboratorios virtuales basados en Linux son una estrategia pedagógica validada por múltiples investigaciones, demostrando mejoras en aprendizaje, autonomía y acceso a recursos avanzados sin depender de infraestructura física tradicional.
- Los modelos basados en SSH, máquinas virtuales personales o nubes públicas presentan limitaciones críticas en seguridad, persistencia, control docente y escalabilidad, lo que evidencia la necesidad de un entorno institucional centralizado accesible desde la web.
- Los proyectos revisados convergen en la importancia de ofrecer un entorno Linux real con persistencia, privilegios controlados, retroalimentación inmediata y recursos hipermediales estructurados, confirmando que un laboratorio web con terminal integrada cumple con los requisitos técnicos y formativos necesarios para la enseñanza efectiva de Sistemas Operativos.

### 2.2 Marco teórico

#### Sistemas operativos

Un sistema operativo es un conjunto estructurado de programas que gestionan los recursos físicos y lógicos de un computador, tales como la memoria, el procesador, los dispositivos de almacenamiento y los periféricos de entrada y salida. Su función principal es actuar como intermediario entre el hardware y el usuario, proporcionando un entorno en el cual las aplicaciones puedan ejecutarse de forma eficiente y segura (Pacheco, 2022). Desde esta perspectiva, el sistema operativo administra procesos en primer plano, que requieren interacción directa del usuario, y procesos en segundo plano, que operan sin interfaz gráfica y cumplen funciones de soporte interno, como los servicios de seguridad o actualización.

Los sistemas operativos contemporáneos se caracterizan por su capacidad multitarea y, en muchos casos, multiusuario, permitiendo la ejecución simultánea de múltiples programas y la administración de permisos diferenciales sobre los recursos compartidos. Dentro del conjunto de sistemas operativos más utilizados se encuentran Windows, macOS y Linux, cada uno con particularidades derivadas de sus modelos de desarrollo, licenciamiento y soporte.

En el caso de Linux, su estructura basada en el núcleo Unix y su distribución en forma de paquetes modulares permiten una amplia flexibilidad, personalización y adopción en contextos educativos y de investigación. Al tratarse de software libre, Linux promueve la exploración interna del sistema, el aprendizaje de comandos y la comprensión de conceptos fundamentales de administración y operación del sistema, lo cual lo convierte en una plataforma idónea para la enseñanza de cursos de Sistemas Operativos.

#### Shell Bash

La interacción con los sistemas operativos basados en Linux se realiza comúnmente a través de la interfaz de línea de comandos, provista por un programa denominado shell. La shell interpreta las instrucciones que el usuario introduce mediante el teclado y las envía al sistema operativo para su ejecución. La mayoría de distribuciones Linux incorporan la shell bash (Bourne Again Shell), una evolución de la shell original de Unix que ofrece facilidades como historial de comandos, edición de líneas y scripting automatizado (Shotts, 2019).

Cuando se utiliza un entorno gráfico, el acceso a la shell se da mediante emuladores de terminal, tales como gnome-terminal o konsole, los cuales permiten abrir sesiones interactivas donde el usuario puede ejecutar órdenes, navegar por el sistema de archivos, administrar procesos y consultar el estado de los recursos del sistema.

El aprendizaje de la terminal fortalece habilidades de razonamiento procedimental, secuenciación lógica y precisión en la ejecución de acciones —habilidades clave en la formación en informática. Además, el empleo de bash scripting permite automatizar tareas, comprender la estructura interna del sistema y desarrollar prácticas de resolución autónoma de problemas (Shotts, 2019). Por esta razón, la línea de comandos constituye un medio formativo esencial para comprender el funcionamiento de los sistemas operativos más allá de las interfaces gráficas, promoviendo una comprensión profunda del comportamiento del sistema.

#### Virtualización de entornos

La virtualización se entiende como el proceso mediante el cual se crea un entorno computacional completo mediante software, reproduciendo el comportamiento de un dispositivo físico. En un sistema convencional, el sistema operativo se ejecuta directamente sobre el hardware y administra de forma exclusiva los recursos disponibles. En cambio, la virtualización introduce una capa intermedia encargada de gestionar la asignación de memoria, procesamiento, almacenamiento y comunicación de red, permitiendo que varios sistemas operativos se ejecuten de manera simultánea sobre la misma máquina física. Esta capa, conocida como hipervisor, posibilita la creación y control de sistemas operativos invitados que funcionan como si fueran máquinas independientes, aun cuando comparten los mismos recursos subyacentes (Barrionuevo et al., 2020).

El uso de la virtualización ofrece ventajas significativas en términos de optimización de recursos y reducción de costos asociados al mantenimiento de equipos físicos. En el ámbito educativo, esta tecnología adquiere especial relevancia debido a que facilita la creación de laboratorios accesibles, reproducibles y aislados, donde los estudiantes pueden experimentar con sistemas reales sin comprometer la estabilidad de sus equipos personales o de la infraestructura institucional. Asimismo, la virtualización posibilita restaurar el entorno con rapidez ante errores, lo cual resulta particularmente útil en el proceso de aprendizaje, donde la exploración, la modificación del sistema y la prueba de configuraciones son actividades inherentes al desarrollo de competencias en administración de sistemas operativos.

#### Contenedores versus máquinas virtuales

Una máquina virtual simula un sistema operativo completo y opera a través de un hipervisor que simula los componentes de hardware necesarios para su funcionamiento. Esto permite ejecutar sistemas operativos heterogéneos y disponer de entornos totalmente aislados, aunque a costa de un mayor consumo de memoria, almacenamiento y tiempo de inicialización. En entornos educativos, las máquinas virtuales ofrecen una reproducción fiel del funcionamiento del sistema, pero su despliegue y mantenimiento pueden resultar pesados cuando se trabaja con grandes grupos de estudiantes.

Por el contrario, los contenedores se ejecutan de forma nativa sobre el sistema operativo del anfitrión, compartiendo su núcleo y aprovechando los mecanismos de aislamiento de procesos provistos por el kernel, como namespaces y cgroups. A diferencia de las máquinas virtuales, los contenedores no requieren un sistema operativo completo por instancia, sino únicamente las dependencias y librerías necesarias para ejecutar una aplicación o entorno de trabajo específico. Esto permite despliegues mucho más ligeros, tiempos de inicialización prácticamente instantáneos y una utilización más eficiente de los recursos del sistema (Zhang et al., 2018).

En el contexto de la enseñanza de sistemas operativos, esta diferencia resulta fundamental. Los contenedores permiten proporcionar a cada estudiante un entorno Linux funcional y estructurado para la práctica, sin sobrecargar los equipos disponibles ni la infraestructura del laboratorio. Al mismo tiempo, mantienen la coherencia entre los entornos de trabajo, evitando variaciones derivadas de configuraciones locales. No obstante, cuando se requiere estudiar aspectos vinculados al núcleo, los permisos privilegiados o las configuraciones avanzadas de hardware virtual, las máquinas virtuales continúan siendo la opción más adecuada. Por ello, la elección entre contenedores y máquinas virtuales no debe asumirse como una sustitución directa, sino como una decisión que depende de los objetivos formativos y del grado de acceso que se desea proporcionar al sistema operativo.

#### Laboratorios virtuales

Los laboratorios virtuales se conciben como entornos computacionales remotos compuestos por recursos de procesamiento, almacenamiento y red administrados institucionalmente, a los cuales los estudiantes acceden mediante Internet. Estos entornos pueden reproducir fielmente la experiencia del laboratorio presencial, permitiendo la ejecución de software especializado, la manipulación de sistemas operativos completos y la interacción con configuraciones de red reales. La literatura señala que la experiencia práctica obtenida en laboratorios virtuales es equivalente, en términos de logro de aprendizaje, a la obtenida en laboratorios físicos tradicionales, especialmente cuando se adoptan metodologías centradas en actividades y resolución de problemas (Encalada & Sequera, 2017). La cuestión central no radica en la presencia o ausencia de hardware físico, sino en la posibilidad de que el estudiante interactúe activamente con el sistema y construya conocimiento a partir de la experimentación.

En este sentido, los laboratorios virtuales basados en servicios cloud ofrecen beneficios pedagógicos y operativos que los laboratorios físicos no pueden igualar: accesibilidad permanente desde cualquier dispositivo, capacidad para escalar recursos bajo demanda, facilidad para duplicar o reiniciar entornos de trabajo, y la posibilidad de integrar herramientas de supervisión docente y retroalimentación automatizada. Estos elementos permiten que el estudiante "aprenda haciendo", principio asociado al pilar formativo de *learning to do*, central en las propuestas contemporáneas de educación inmersiva.

No obstante, la revisión de experiencias institucionales evidencia que la implementación de laboratorios virtuales requiere una cuidadosa selección de herramientas y modelos de servicio. Mientras los servicios SaaS permiten gestionar contenidos y actividades, y las plataformas PaaS facilitan la publicación de cursos en línea, es el modelo IaaS el que posibilita la entrega de máquinas virtuales completas o escritorios virtualizados para prácticas avanzadas, como las que demanda el estudio de sistemas operativos. Además, los autores muestran que los ecosistemas educativos más exitosos son aquellos que integran estos tres niveles de servicio en un mismo flujo pedagógico, articulando recursos teóricos, actividades colaborativas y experimentación práctica en un entorno accesible y unificado.

Sin embargo, la literatura también señala que la adopción de laboratorios virtuales no está exenta de desafíos. La interoperabilidad entre herramientas, la necesidad de interfaces docentes simplificadas, el riesgo de dependencia de proveedores externos y las limitaciones de ancho de banda en ciertos contextos pueden afectar la experiencia formativa. Por ello, diversos estudios recomiendan la construcción de entornos institucionales controlados que automaticen la provisión de máquinas y recursos, reduzcan la complejidad técnica visible para el docente y garanticen la continuidad del acceso para el estudiante sin requerir configuraciones avanzadas en sus equipos personales.

### 2.3 Marco legal

En el aspecto legal, se deben tener en cuenta las siguientes leyes y decretos que enmarcan el desarrollo de proyectos educativos mediados por tecnologías de la información en Colombia:

- La **Ley 30 de 1992** (Congreso de la República de Colombia, 1992) organiza el servicio público de la educación superior y establece en su artículo 6 los objetivos principales de las instituciones de educación superior. Entre ellos se destacan la formación integral de los ciudadanos para cumplir funciones profesionales, investigativas y sociales; la difusión del conocimiento en todas sus formas; la prestación de un servicio educativo de calidad que responda a las necesidades del país; y la incorporación de innovaciones tecnológicas en los procesos de enseñanza y aprendizaje. Esta ley respalda el desarrollo de estrategias pedagógicas apoyadas en tecnología, como la implementación de laboratorios virtuales.
- La **Ley 1188 de 2008** (Congreso de la República de Colombia, 2008) regula el registro calificado de los programas de educación superior y establece las condiciones de calidad que deben cumplir las instituciones en sus programas académicos e infraestructura.
- En relación con el uso de tecnologías, la **Ley 1341 de 2009** (Congreso de la República de Colombia, 2009a) establece los principios y definiciones sobre la sociedad de la información y la organización de las Tecnologías de la Información y las Comunicaciones (TIC) en Colombia.
- La **Ley 1581 de 2012** (Congreso de la República de Colombia, 2012) establece disposiciones generales para la protección de datos personales, garantizando el derecho constitucional al habeas data y regulando el tratamiento de información personal en bases de datos públicas o privadas.
- La **Ley 1273 de 2009** (Congreso de la República de Colombia, 2009b) modifica el Código Penal colombiano para tipificar los delitos informáticos y proteger la información y los datos.
- La **Ley 23 de 1982** (Congreso de la República de Colombia, 1982) sobre derechos de autor protege las obras literarias, artísticas y científicas, otorgando a los autores derechos morales y patrimoniales sobre sus creaciones. Esta disposición es relevante para el proyecto, pues los recursos hipermediales desarrollados deben respetar las licencias de uso y la autoría intelectual.

### 2.4 Marco contextual

El presente proyecto se enmarca en la Universidad Francisco de Paula Santander (UFPS), una institución de educación superior pública ubicada en la ciudad de Cúcuta, capital del departamento de Norte de Santander, Colombia. La UFPS se distingue por su compromiso con la excelencia académica, contando con seis facultades y una variada oferta de programas, de los cuales nueve están acreditados en alta calidad.

Dentro de este contexto, este proyecto propone el desarrollo de un laboratorio virtual orientado al fortalecimiento de las competencias en el entorno Linux, correspondiente a la asignatura de Sistemas Operativos del programa de Ingeniería de Sistemas. Esta iniciativa se enmarca en un entorno académico comprometido con la calidad educativa, la innovación pedagógica y la adaptación tecnológica como parte del mejoramiento continuo.

## 3. Diseño metodológico

### 3.1 Tipo de investigación

La investigación es de tipo aplicada, dado que se orienta a resolver un problema práctico institucional relacionado con las limitaciones técnicas y pedagógicas en el acceso a entornos Linux para el desarrollo de actividades prácticas en la asignatura de Sistemas Operativos. De acuerdo con Hernández Sampieri y Fernandez-Collado (2014), la investigación aplicada busca generar conocimientos que puedan usarse en la práctica para resolver necesidades específicas, lo cual coincide con el propósito de este proyecto.

En cuanto a su nivel, la investigación es descriptiva y proyectiva. Es descriptiva porque permite detallar la situación actual del acceso a entornos Linux por parte de los estudiantes de la asignatura de Sistemas Operativos, identificando las limitaciones técnicas y pedagógicas que afectan su proceso de aprendizaje. A su vez, es proyectiva, dado que propone, diseña e implementa una solución basada en un laboratorio virtual de Linux que logre mejorar dichas condiciones.

Asimismo, la investigación se apoya en los paradigmas de las ciencias del comportamiento y de las ciencias del diseño (Hevner et al., 2004), los cuales permiten, respectivamente, comprender la problemática desde la interacción de los usuarios con los sistemas y desarrollar soluciones tecnológicas que respondan de manera efectiva a dichas necesidades.

### 3.2 Metodología de la investigación

El desarrollo de este proyecto se fundamenta en una metodología estructurada en cuatro fases: apropiación del conocimiento, experimentación y desarrollo, evaluación y validación, y documentación de resultados. Este enfoque responde a los paradigmas de las ciencias del comportamiento y de las ciencias del diseño, garantizando que la solución propuesta se base en fundamentos teóricos sólidos y que también sea validada en un entorno real.

En la **primera fase, apropiación del conocimiento**, se realizará un análisis detallado de la situación actual relacionada con el acceso a entornos Linux por parte de los estudiantes, examinando las limitaciones técnicas y pedagógicas derivadas del uso del servidor personal del docente. Esta etapa comprenderá la revisión de literatura, el análisis del entorno académico y el levantamiento de requerimientos funcionales y no funcionales necesarios para la propuesta del laboratorio virtual. El propósito es establecer una comprensión sólida del problema, identificando las necesidades reales de aprendizaje y las condiciones técnicas que deben ser consideradas en la solución.

La **segunda fase, experimentación y desarrollo**, se orienta al diseño y construcción del laboratorio virtual de Linux mediante un proceso iterativo que permita incorporar los requerimientos obtenidos en la fase anterior. En esta etapa se desarrollará un prototipo funcional que integre un entorno Linux accesible desde la web, mecanismos de persistencia de trabajo y recursos educativos que apoyen la práctica autónoma del estudiante. Durante el proceso se realizarán ajustes incrementales con base en revisiones periódicas, garantizando que el prototipo se mantenga alineado con los objetivos pedagógicos y las necesidades técnicas identificadas.

En la **tercera fase, evaluación y validación**, el prototipo será puesto a prueba en un entorno real con un grupo de estudiantes y docentes de la asignatura de Sistemas Operativos. Se analizará su usabilidad, disponibilidad, pertinencia pedagógica y capacidad para superar las limitaciones del modelo actual basado en SSH. Esta fase permitirá identificar fortalezas, posibles fallas y/o mejoras y el grado de aceptación de la solución por parte de sus usuarios, asegurando que la propuesta sea viable, pertinente y ajustada a las dinámicas institucionales.

Finalmente, la **fase de documentación y socialización** consistirá en la elaboración del informe final del proyecto, donde se registrará el proceso de desarrollo de la solución, los resultados obtenidos durante la validación y las recomendaciones para su implementación institucional. Esta fase asegurará que el conocimiento generado sea transferible y que la solución propuesta pueda ser adoptada formalmente por el programa académico.

### 3.3 Metodología de desarrollo de software

Para el desarrollo del laboratorio se adoptará un modelo de desarrollo iterativo, el cual resulta adecuado para proyectos que requieren una construcción progresiva y una validación continua de sus funcionalidades. Según Sommerville (2011), el modelo iterativo permite realizar ajustes en cada ciclo del proceso, facilitando la adaptación del producto a requisitos que pueden evolucionar a medida que se avanza en el proyecto. Este enfoque asegura que el producto final se adapte mejor a las necesidades reales de los usuarios, lo cual es ideal para el desarrollo de un laboratorio virtual de Linux. Así, permite incorporar mejoras basadas en la retroalimentación y pruebas, ajustando el complemento a las expectativas de docentes y estudiantes.

*Figura 2. Ciclo de vida iterativo. Fuente: Tomado de (Puello, 2012)*

La imagen ilustra el modelo de desarrollo iterativo, donde el proyecto se construye en fases o iteraciones que agregan funcionalidades de manera progresiva. Cada iteración sigue un ciclo de desarrollo estructurado en etapas de análisis, diseño, codificación y pruebas. Al finalizar cada iteración, se obtiene una nueva versión del producto con características adicionales.

## 4. Cronograma

El siguiente cronograma, en formato de diagrama de Gantt, presenta las actividades planificadas para alcanzar los objetivos del proyecto, indicando la duración estimada de cada tarea durante todo el período de ejecución (6 meses).

| Fase | N° | Objetivos | Entregable | Actividad |
|---|---|---|---|---|
| Fase 1 | 1 | Realizar la revisión tecnológica de aplicaciones o productos similares. Analizar los contenidos del curso de Sistemas Operativos para la identificación y definición de los recursos conceptuales requeridos para el desarrollo de materiales y mediadores pedagógicos digitales. | Documento de análisis del contexto y especificación de requerimientos funcionales y no funcionales. | Revisión de literatura sobre laboratorios virtuales, Linux educativo y limitaciones actuales |
| | | | | Diagnóstico del entorno actual (SSH, limitaciones técnicas, pedagógicas y operativas) |
| | | | | Levantamiento de requerimientos funcionales y no funcionales |
| | | | | Consolidación del documento final de análisis y requerimientos |
| Fase 2 | 2 | Implementar la arquitectura de despliegue de una plataforma de laboratorio Linux Shell que incorpore mecanismos de seguridad basados en la integridad, confidencialidad y disponibilidad del entorno. Desarrollar un componente interactivo que permita la creación dinámica de talleres prácticos. | Prototipo funcional del laboratorio virtual de Linux | Diseño de la arquitectura y definición de los módulos funcionales |
| | | | | Estimar el tiempo y recursos necesarios para el desarrollo de cada módulo |
| | | | | Desarrollo e integración de todos los módulos del sistema |
| | | | | Ejecución de pruebas unitarias para verificar que todos los módulos cumplen con los requisitos especificados |
| Fase 3 | 3 | Establecer escenarios de prueba orientados a evaluar la usabilidad, funcionalidad e interacción del laboratorio de Linux con los estudiantes y profesores del curso de Sistemas Operativos. | Informe de evaluación y validación del prototipo del laboratorio virtual | Elaboración de los casos de prueba y de instrumentos de evaluación |
| | | | | Selección del grupo piloto (estudiantes y docente de Sistemas Operativos) |
| | | | | Aplicación de los casos de prueba con el grupo piloto |
| | | | | Análisis de resultados y ajustes finales al prototipo |
| Fase 4 | 4 | Elaborar el informe final del proyecto, consolidando el proceso de desarrollo, implementación y validación del laboratorio. | Documento técnico | Redactar el documento técnico describiendo la arquitectura, configuración, componentes y lineamientos del laboratorio virtual |
| | | | Manual de usuario | Redactar el manual de usuario para apoyar la capacitación e implementación |
| | | | Informe final del proyecto | Redactar el informe detallado con la metodología, desarrollo, resultados y conclusiones del proyecto |

*Nota: la distribución de las actividades en los meses se representa en el diagrama de Gantt del documento original.*

## 5. Presupuesto

| ITEM | CANTIDAD | EFECTIVO (COP) | ESPECIE (COP) | RECURSO HUMANO (COP) |
|---|---|---|---|---|
| **Recurso humano** | | | | |
| Desarrollador de software | 2 | 16.000.000 | 0 | 16.000.000 |
| Capacitador técnico | 1 | 3.000.000 | 0 | 3.000.000 |
| **Total recurso humano** | | 19.000.000 | 0 | 19.000.000 |
| **Equipos - herramientas** | | | | |
| Herramientas de desarrollo (Docker, Node.js, VSCode, GitHub, React) | 0 | 0 | 0 | 0 |
| Servicio en la nube para despliegue (6 meses × 360.000 COP) | 1 | 2.160.000 | 0 | 0 |
| **Total equipos - herramientas** | | 2.160.000 | 0 | 0 |
| **TOTAL DE PRESUPUESTO** | | 21.160.000 | 0 | 19.000.000 |

## 6. Revisión de tecnología

Existen diferentes plataformas de laboratorios virtuales reportadas en la literatura, siendo de nuestro interés aquellas basadas en Linux y accesibles a través de navegadores web, tomando en cuenta el objeto de estudio del proyecto. Estas plataformas suelen ofrecer terminales Linux; aunque con variaciones importantes en aspectos como la persistencia de archivos, la seguridad y escasos recursos pedagógicos o educativos. En relación con lo anterior, la tabla siguiente presenta la especificación del modelo CVM aplicado a la revisión tecnológica de laboratorios virtuales basados en Linux. Este modelo se adapta a partir de lo propuesto por Adarme Jaimes (2021), quien plantea un proceso de análisis documental basado en la definición de criterios de búsqueda, una ventana temporal y las tendencias de investigación o moda.

| Convención | Valor |
|---|---|
| C1 | Comandos permitidos / restringidos |
| C2 | Persistencia de archivos |
| C3 | Control de acceso y aislamiento |
| C4 | Componente pedagógico |
| V1 | Ventana de tiempo entre 2017 - 2026 plataformas de laboratorio de Linux basadas en web |
| M1 | Virtualización |
| M2 | Contenedores |
| M3 | Sandbox |

La búsqueda documental se realizó en bases de datos especializadas (Scopus y Google Académico) utilizando la siguiente ecuación:

```
"virtual laboratory" AND "linux" AND "web-based" AND ("docker" OR "container" OR "virtual machine")
```

Ventana temporal: 2017-2026. Esta estrategia permitió identificar siete trabajos de investigación que se presentan a continuación según los criterios CVM establecidos.

**SKILL/VL — Baun et al. (2025), Frankfurt University of Applied Sciences, Alemania**

Plataforma de laboratorio virtual institucional basada exclusivamente en software libre, orientada a cursos de redes de computadores y seguridad informática. La infraestructura opera sobre doce (12) servidores de alto rendimiento usando Proxmox VE como hipervisor con KVM/QEMU, almacenamiento distribuido CEPH, y aislamiento de red mediante VXLAN por estudiante. La interfaz web, construida con Next.js y ReactFlow, permite a los docentes crear y configurar escenarios de red mediante drag-and-drop, mientras que Keycloak gestiona la autenticación integrada con los sistemas institucionales.

Frente a las variables de análisis, SKILL/VL ofrece VMs completas con acceso total a comandos Linux, persistencia mediante snapshots y aislamiento de red sólido a nivel de capa 2. Sin embargo, al estar orientado exclusivamente a la simulación de infraestructuras de red, carece completamente de componente pedagógico estructurado: no tiene módulos temáticos, talleres dinámicos, ni retroalimentación automática sobre las actividades del estudiante. Su aporte principal para el presente proyecto radica en validar el modelo de despliegue institucional on-premise con software libre como alternativa viable y sostenible frente a soluciones en nube pública.

**EVL — Chapman y Clark (2017), University of South Alabama**

Plataforma web de laboratorio virtual orientada a ciberseguridad que combina un sistema de gestión de contenidos (CMS) con máquinas virtuales en vivo accesibles desde el navegador. El CMS, construido con Django y Python, permite a los docentes crear y publicar lecciones estructuradas con instrucciones paso a paso que se presentan lado a lado con la VM activa, eliminando la necesidad de documentación externa. Los contenidos son creados una sola vez y reutilizables para múltiples estudiantes, con un panel de administración que permite asociar máquinas virtuales específicas a cada ejercicio.

Desde las variables de análisis, EVL es el antecedente que más se acerca a la integración pedagógica que busca el presente proyecto: el docente define el contenido, lo estructura en lecciones progresivas y el sistema provisiona automáticamente las VMs vía noVNC sin requerir software adicional en el cliente. Sin embargo, no implementa persistencia de sesión —la VM se destruye al finalizar la lección— y carece de validación automática de respuestas o talleres dinámicos configurables, aspectos que sí serán desarrollados en el laboratorio virtual de la UFPS.

**CvLabs — Chen (2020)**

Plataforma web de laboratorios virtuales basada en contenedores Docker orquestados con Kubernetes, donde cada estudiante recibe un entorno Linux aislado accesible desde el navegador mediante WebSocket, sin necesidad de SSH. La plataforma soporta cuatro roles de usuario, calificación automática agrupada y guías de laboratorio en Markdown con pasos interactivos.

CvLabs ejecuta comandos reales dentro de contenedores aislados por namespaces y cgroups, garantizando seguridad mediante RBAC y políticas de red por namespace. No obstante, no implementa persistencia —el contenedor se destruye al terminar la sesión— y carece de recursos hipermediales estructurados por módulos temáticos y talleres dinámicos configurables por el docente, aspectos que sí serán desarrollados en el presente proyecto.

**EnVLAB — Deshmukh et al. (2025), JSPM's Rajarshi Shahu College of Engineering, India**

Plataforma web de laboratorio virtual bajo el modelo Lab-as-a-Service orientada a la entrega y calificación de prácticas académicas. La arquitectura usa Angular en el frontend, Node.js en el backend, MongoDB como base de datos y Docker con Kubernetes para provisionar instancias individuales de un entorno llamado Code Studio, que incluye terminal Linux y compilador integrados, accesibles directamente desde el navegador mediante Xterm.js.

Frente a las variables de análisis, EnVLAB ejecuta comandos reales en contenedores Docker aislados por estudiante, con roles diferenciados para institución, instructor y estudiante. Sin embargo, no implementa persistencia de sesión, no tiene recursos hipermediales estructurados por módulos temáticos, y su componente pedagógico se limita a la entrega y validación de tareas con fecha límite, sin talleres dinámicos configurables ni retroalimentación automática sobre comandos ejecutados.

**Linux Luminarium — Shoshitaishvili et al. (2026), Universidad Estatal de Arizona**

Plataforma web de aprendizaje de Linux basada en el framework pwn.college DOJO, donde cada estudiante accede a un entorno Linux aislado directamente desde el navegador. La plataforma organiza su contenido en desafíos distribuidos en módulos temáticos bajo el paradigma CTF (Capture the Flag), instrumentando el shell mediante hooks en .bashrc para detectar errores y entregar retroalimentación inmediata, además de randomizar los desafíos por estudiante para desincentivar la copia de soluciones.

La plataforma no ofrece mecanismos para que el docente personalice módulos de forma dinámica, ni integra recursos hipermediales como videos, documentos o talleres ajustables según el contexto del curso.

**TermAdventure — Šuppa et al. (2021), Universidad de Comenius**

Suite para la enseñanza interactiva de la línea de comandos UNIX mediante el paradigma de juegos de aventura de texto. La herramienta instrumenta la sesión Bash del estudiante a través de PROMPT_COMMAND, evaluando automáticamente cada comando ejecutado sin necesidad de cambiar de entorno. Los desafíos se definen en archivos YAML con estructura de grafo acíclico dirigido (DAG) que genera rutas aleatorias por estudiante, y se complementa con TA Monitor, una aplicación web que permite al docente visualizar el progreso en tiempo real y exportar calificaciones a sistemas externos.

Sin embargo, TermAdventure requiere acceso SSH o un entorno UNIX preconfigurado, imponiendo una barrera técnica de entrada, y no ofrece acceso desde el navegador sin instalación previa.

**uAssign — Bailey y Zilles (2019), Universidad de Illinois en Urbana-Champaign**

Sistema de asignaciones para la enseñanza y evaluación de habilidades en la terminal Unix accesible directamente desde el navegador. La plataforma proporciona un contenedor Docker por estudiante, conectado mediante WebSockets y un emulador de terminal en JavaScript (hterm). En lugar de usar Dockerfiles estándar, implementaron un script personalizado en JavaScript (index.js) que configura los contenedores directamente. Cada contenedor se aísla mediante límites de CPU, memoria y procesos definidos por Docker, se deshabilita la red una vez completada la configuración inicial, y se restringe a una única conexión de terminal activa por instancia; mientras que las asignaciones se parametrizan aleatoriamente a través de especificaciones JSON únicas por estudiante para evitar la reutilización de soluciones.

Sin embargo, depende de un LMS externo para gestionar el contenido y el registro de calificaciones, sin ofrecer por sí mismo un aprendizaje estructurado ni retroalimentación dentro del entorno del shell.

**Categorización de enfoques**

A partir de los trabajos revisados, se observa que las soluciones se concentran en el uso de virtualización y contenedores como principales enfoques de implementación, con diferencias marcadas en el nivel de desarrollo del componente pedagógico. Esta variabilidad permite establecer la siguiente categorización:

| Enfoque | Estrategia | Moda | Componente pedagógico |
|---|---|---|---|
| Baun et al. (2025) | Usa Proxmox VE como hipervisor para crear máquinas virtuales Linux/Windows completas. Cada estudiante tiene un OS propio con acceso total a comandos y red, aislado del resto mediante VXLAN. | M1 | No incluye recursos pedagógicos ni retroalimentación, por lo que se orienta únicamente a la gestión de infraestructura técnica. |
| Chapman y Clark (2017) | Usa XenServer para provisionar VMs Linux y Windows bajo demanda. El estudiante accede al OS desde el navegador vía noVNC sin instalar nada. La VM se destruye al terminar la sesión. | M1 | Integra lecciones paso a paso junto a la VM, pero sin validación automática de las actividades ni retroalimentación. |
| Chen (2020) | Usa Docker sobre Kubernetes para entregar un entorno Linux aislado por estudiante. No es un OS completo, sino un contenedor con los paquetes necesarios para el laboratorio, accesible por terminal web. | M2 | Incluye guías en Markdown con pasos interactivos y evaluación básica, pero sin estructura modular ni retroalimentación sobre los comandos ejecutados. |
| Deshmukh et al. (2024) | Usa Docker con Kubernetes para crear un contenedor Linux por estudiante. El OS está limitado al sandbox de Code Studio: terminal y compilador con restricciones para evitar ejecución de código malicioso. | M2, M3 | Permite la entrega y calificación de tareas, pero la evaluación se limita al resultado final sin retroalimentación. |
| Šuppa et al. (2021) | Modifica la sesión Bash del estudiante mediante un script Go que intercepta el prompt. No requiere VM ni contenedor; corre en un servidor UNIX o dentro de Docker como entorno de distribución. | M3 | Presenta ejercicios tipo aventura con evaluación automática, pero sin guías pedagógicas ni organización en módulos temáticos. |
| Shoshitaishvili et al. (2026) | Plataforma web basada en pwn.college DOJO que entrega un entorno Linux accesible desde el navegador sin instalación. Cada reto corre en un contenedor Linux con hooks en bash para monitorear comandos en tiempo real. | M2 | Ofrece un currículo estructurado con retos progresivos y retroalimentación en tiempo real, aunque centrado en desafíos tipo CTF más que en guías formativas. |
| Bailey y Zilles (2019) | Usa Docker para crear un contenedor Linux por estudiante, accesible desde el navegador vía WebSocket y emulador de terminal hterm. El contenedor se destruye al terminar o tras inactividad. | M2 | Integra asignaciones auto-calificadas dentro de un LMS, pero sin guías de aprendizaje ni retroalimentación. |

A partir del análisis de la tabla de categorización, se identifica que las soluciones basadas en virtualización (M1) aparecen en menor proporción y se orientan principalmente a escenarios que priorizan el control y aislamiento, aunque con un mayor consumo de recursos que limita su escalabilidad. Por su parte, los enfoques basados en contenedores (M2) se consolidan como la tendencia predominante, al optimizar el uso de recursos, lo que permite una mejor escalabilidad del sistema. Finalmente, los enfoques tipo sandbox (M3) se presentan como mecanismos complementarios, enfocados en el control y evaluación de comandos, además de facilitar la gestión y control de recursos dentro de los entornos de ejecución.

En cuanto al componente pedagógico, se evidencian tres tendencias: plataformas centradas únicamente en la infraestructura técnica (SKILL/VL), soluciones con integración básica de contenidos sin retroalimentación (EVL y uAssign), y propuestas más avanzadas con evaluación automática y seguimiento del estudiante (Linux Luminarium). Sin embargo, ninguna de las soluciones analizadas integra un entorno con un componente pedagógico dinámico, modular y configurable por el docente y, a su vez, con persistencia de sesiones del estudiante.

Considerando las restricciones de infraestructura disponibles en el Departamento de Sistemas e Informática de la Universidad Francisco de Paula Santander, donde el despliegue completo del proyecto debe operar dentro de límites definidos de memoria, almacenamiento y número de contenedores, se descarta la viabilidad de provisionar un contenedor individual por estudiante bajo el enfoque M2, dado que desplegar un contenedor por cada uno de los usuarios previstos superaría ampliamente los recursos institucionales disponibles.

Por lo anterior, se adopta una **arquitectura híbrida** que combina los enfoques M2 y M3. El stack de la aplicación se despliega mediante contenedores Docker dentro de los límites permitidos, mientras que el entorno Linux de los estudiantes se implementa sobre un servidor Linux compartido, donde cada estudiante accede a una sesión asociada a un espacio de trabajo persistente, con mecanismos de aislamiento, restricciones de permisos y control de recursos aplicados sobre cada sesión de usuario. Este enfoque permite ofrecer entornos de trabajo reales y persistentes dentro de las restricciones institucionales, manteniendo una interacción directa con herramientas y comandos reales del sistema operativo Linux.

Sobre esta base, la propuesta incorpora acceso a terminal web real desde el navegador, persistencia del espacio de trabajo entre sesiones, y un componente de contenidos con recursos hipermediales organizados por módulos temáticos del curso, complementado con simuladores visuales ejecutados en el navegador del estudiante. De esta manera, la propuesta busca integrar las fortalezas identificadas en los trabajos revisados y superar sus limitaciones, ofreciendo un entorno de aprendizaje más completo, flexible y adaptado a las necesidades del contexto educativo de la UFPS.

## 7. Desarrollo del proyecto

### 7.1 Requerimientos funcionales y no funcionales

Tras el análisis de las limitaciones del entorno práctico actual, la revisión de plataformas similares reportadas en la literatura, y la consulta con docentes del curso de Sistemas Operativos, se definieron los requerimientos funcionales y no funcionales que guían el desarrollo del laboratorio virtual.

#### 7.1.1 Requerimientos funcionales

| NÚMERO | REQUERIMIENTO | DESCRIPCIÓN |
|---|---|---|
| RF-01 | Autenticación institucional | El sistema debe permitir el acceso a la plataforma únicamente mediante autenticación con cuenta institucional de Google OAuth 2.0, concediendo acceso solo a usuarios cuyo correo esté previamente registrado como docente o estudiante, y denegando el ingreso a cualquier cuenta no registrada. |
| RF-02 | Gestión de roles | El sistema debe gestionar roles diferenciados de administrador, docente y estudiante, donde cada rol puede acceder a funcionalidades distintas. |
| RF-03 | Temario con recursos hipermediales | El sistema debe proporcionar un temario fijo estructurado por temas, con recursos hipermediales asociados (texto, video, enlaces externos y simuladores), accesible desde la plataforma. |
| RF-04 | Banco de actividades | El sistema debe proporcionar un banco de actividades prácticas asociadas a los temas del temario, definidas por el equipo de desarrollo de la plataforma. |
| RF-05 | Evaluación automática de actividades | El sistema debe evaluar automáticamente las actividades del banco mediante aserciones de validación preconfiguradas, proporcionando retroalimentación inmediata por cada aserción evaluada. |
| RF-06 | Catálogo de aserciones | El sistema debe contar con un catálogo predefinido de aserciones atómicas (existencia de archivo, permisos, propietario, contenido, salida de comandos, archivos comprimidos, entre otros) que el docente pueda utilizar al crear actividades automáticas, configurando sus parámetros desde un formulario. |
| RF-07 | Creación de grupo de laboratorio | El sistema debe permitir al docente crear un grupo de laboratorio seleccionando los temas del temario y las actividades del banco predefinidas que desea habilitar para sus estudiantes. |
| RF-08 | Registro de estudiantes | El sistema debe permitir al docente registrar estudiantes en su grupo de laboratorio mediante carga masiva de archivo CSV o de forma individual. |
| RF-09 | Archivar grupos | El sistema debe permitir al docente archivar y desarchivar sus grupos de laboratorio. Los grupos archivados no aparecerán en el listado activo pero conservarán toda su información histórica (estudiantes, actividades y progreso). |
| RF-10 | Creación de actividades por el docente | El sistema debe permitir al docente crear actividades de revisión automática o manual dentro de su grupo de laboratorio, definiendo el título, el enunciado y el tipo de actividad (quiz o taller). |
| RF-11 | Configuración de aserciones | El sistema debe permitir al docente configurar las aserciones de validación de una actividad automática, seleccionando los tipos del catálogo, completando sus parámetros y asignando un valor numérico a cada una en una escala de 0.1 a 5. |
| RF-12 | Límite de intentos en quiz | El sistema debe permitir al docente definir el número máximo de intentos de validación para una actividad de tipo quiz. |
| RF-13 | Habilitar/deshabilitar actividades | El sistema debe permitir al docente habilitar o deshabilitar una actividad, además de definir una fecha de cierre para cualquier actividad de su grupo de laboratorio. |
| RF-14 | Revisión manual de envíos | El sistema debe permitir al docente revisar los envíos de sus actividades de revisión manual, asignar una calificación y proporcionar retroalimentación escrita al estudiante. |
| RF-15 | Panel de seguimiento docente | El sistema debe proporcionar al docente un panel de seguimiento donde pueda visualizar el avance y las calificaciones de cada estudiante por actividad dentro de su grupo de laboratorio. |
| RF-16 | Bitácora de eventos | El sistema debe registrar una bitácora de eventos relevantes de la plataforma (inicios y cierres de sesión, entregas y validaciones de actividades), accesible al docente y al administrador, con opción de exportación. |
| RF-17 | Navegación de temas por estudiante | El sistema debe permitir al estudiante navegar y consultar únicamente los temas habilitados por su docente dentro del temario, junto con sus recursos hipermediales asociados (texto, video, enlaces externos y simuladores). |
| RF-18 | Terminal Linux en navegador | El sistema debe proporcionar al estudiante una terminal Linux real accesible desde el navegador, conectada a su entorno personal, donde pueda ejecutar comandos reales del sistema operativo. |
| RF-19 | Cuenta y directorio personal | El sistema debe asignar a cada estudiante una cuenta de usuario y directorio /home propios dentro del entorno Linux, conservando sus archivos y configuraciones entre sesiones. |
| RF-20 | Consulta de estado de actividades | El sistema debe permitir al estudiante consultar el estado de sus actividades (pendiente, enviada, calificada) y su calificación dentro de su grupo de laboratorio. |
| RF-21 | Validación de actividad automática | El sistema debe permitir al estudiante solicitar la validación de una actividad automática cuando lo considere pertinente, mostrando el resultado individual de cada aserción con su estado (superada o fallida) y el valor obtenido frente al esperado. |
| RF-22 | Intentos ilimitados en taller | El sistema debe permitir al estudiante realizar intentos de validación ilimitados sobre una actividad de tipo taller mientras esta permanezca habilitada por el docente. |
| RF-23 | Intentos limitados en quiz | El sistema debe limitar los intentos de validación del estudiante sobre una actividad de tipo quiz al máximo definido por el docente, registrando cada intento con su resultado y calificación obtenida. |
| RF-24 | Administración de plataforma | El sistema debe permitir al administrador gestionar los docentes registrados en la plataforma y las actividades del banco asociadas a cada módulo del temario. |

#### 7.1.2 Requerimientos no funcionales

| NÚMERO | REQUERIMIENTO | DESCRIPCIÓN |
|---|---|---|
| RNF-01 | Compatibilidad de navegadores | La plataforma debe ser accesible desde cualquier navegador web moderno (Chrome, Firefox, Edge, Safari) sin requerir instalación de software ni complementos adicionales. |
| RNF-02 | Tiempo de conexión | El tiempo de establecimiento o reanudación de la sesión de terminal personal del estudiante no debe superar los 5 segundos en condiciones normales de carga. |
| RNF-03 | Aislamiento de sesiones | Cada estudiante debe operar bajo una cuenta de usuario del sistema independiente, con aislamiento entre sesiones y límites de recursos (CPU, memoria, número de procesos y disco) aplicados mediante cgroups, sobre un servidor Linux compartido. |
| RNF-04 | Comunicación segura | Toda la comunicación entre el cliente y el servidor debe realizarse sobre HTTPS y WSS (WebSocket seguro). |
| RNF-05 | Capacidad de sesiones | La arquitectura debe soportar al menos 30 sesiones simultáneas sobre la infraestructura del Departamento de Sistemas de la UFPS. |
| RNF-06 | Despliegue on-premise | El despliegue debe realizarse on-premise en los servidores institucionales de la UFPS, sin dependencia de servicios de nube pública. |
| RNF-07 | Restricción de privilegios | El sistema debe impedir que los estudiantes ejecuten comandos con privilegios de superusuario dentro de su sesión de terminal, garantizando que todas las operaciones se realicen exclusivamente dentro de los límites del usuario del sistema asignado. |
| RNF-08 | Cierre por inactividad | La sesión de terminal personal del estudiante debe cerrarse automáticamente tras un período de inactividad configurable, liberando los recursos del servidor sin afectar la persistencia de sus archivos y directorios. |

### 7.2 Casos de uso

El laboratorio fue desarrollado a partir de casos de uso que sirvieron como base para la definición de las funcionalidades del aplicativo. A continuación, se muestran los casos de uso desarrollados.

| CÓDIGO | CASO DE USO | ACTORES PARTICIPANTES |
|---|---|---|
| CU1 | Autenticarse en la plataforma | Administrador, Docente, Estudiante |
| CU2 | Cerrar sesión | Administrador, Docente, Estudiante |
| CU3 | Gestionar docentes registrados | Administrador |
| CU4 | Administrar banco de actividades | Administrador |
| CU5 | Consultar bitácora de eventos | Administrador, Docente |
| CU6 | Gestionar grupos de laboratorio | Docente |
| CU7 | Gestionar estudiantes del grupo | Docente |
| CU8 | Gestionar actividades del grupo | Docente |
| CU9 | Revisar actividades manuales del grupo | Docente |
| CU10 | Realizar seguimiento estudiantil | Docente |
| CU11 | Acceder al temario | Estudiante |
| CU12 | Usar la terminal Linux | Estudiante |
| CU13 | Realizar actividades asignadas | Estudiante |

### 7.3 Definición del temario del laboratorio

A partir del análisis de los contenidos del curso de Sistemas Operativos, las entrevistas con los docentes de la asignatura y la revisión de temarios de cursos como NDG Linux Essentials de Cisco Networking Academy, se definió el siguiente temario estructurado para el laboratorio virtual. Este temario constituye el contenido fijo de la plataforma, sobre el cual los docentes seleccionan los temas que desean habilitar para sus grupos de laboratorio.

| N° | TEMA | SUBTEMAS |
|---|---|---|
| 1 | Introducción a Linux | Historia, Kernel, Entorno de ventanas, Instalación, Software libre y licenciamiento |
| 2 | Ayuda del sistema | man, --help, apropos |
| 3 | Directorios | Tipos de directorios: etc/, home/, var/, tmp/, entre otros |
| 4 | Sistema de archivos | Estructura del sistema de archivos |
| 5 | Creación de directorios | mkdir, estructura jerárquica |
| 6 | Creación de archivos | touch, editores de texto: vi, pico, nano |
| 7 | Permisos | chmod, chown, umask |
| 8 | Compresión | tar, gzip, bzip2, zip |
| 9 | Búsqueda | Patrones, expresiones regulares, find, grep |
| 10 | Usuarios y grupos | passwd, shadow, useradd, groupadd |
| 11 | Gestión de procesos | ps, top, kill, jobs, fg, bg |
| 12 | Servicios y demonios | systemctl, estados de servicios |
| 13 | Shell scripting | Variables, condicionales, ciclos, funciones |
| 14 | Instalación de paquetes | apt, dnf (tema complementario) |
