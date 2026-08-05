## LABORATORIO VIRTUAL DE LINUX - REVISIÓN DE TECNOLOGÍAS

Existen diferentes plataformas de laboratorios virtuales reportadas en la literatura, siendo de

nuestro interés aquellas basadas en Linux y accesibles a través de navegadores web, tomando

en cuenta el objeto de estudio del proyecto. Estas plataformas suelen ofrecer terminales

Linux; aunque con variaciones importantes en aspectos como la persistencia de archivos, la

seguridad y escasos recursos pedagógicos o educativos.

En relación con lo anterior, la tabla 1 presenta la especificación del modelo CVM aplicado a

la revisión tecnológica de laboratorios virtuales basados en Linux. Este modelo se adapta a

partir de lo propuesto por (Adarme Jaimes, 2021), quien plantea un proceso de análisis [URL 🔗](https://www.zotero.org/google-docs/?A4k9xU)

documental basado en la definición de criterios de búsqueda, una ventana temporal y las

tendencias de investigación o moda.

*Tabla 1: Criterios CVM*

| Convención | Valor |
| --- | --- |
| C1 | Comandos permitidos / restringidos |
| C2 | Persistencia de archivos |
| C3 | Control de acceso y aislamiento |
| C4 | Componente pedagógico |
| V1 | Ventana de tiempo entre 2017 - 2026 plataformas de |
|   | laboratorio de Linux basadas en web |
| M1 Virtualización |   |
| M2 Contenedores |   |
| M3 Sandbox |   |

La búsqueda documental se realizó en bases de datos especializadas (Scopus y Google

Académico) utilizando la siguiente ecuación:


"virtual laboratory" AND "linux" AND "web-based" AND ("docker" OR "container" OR

"virtual machine") Ventana temporal: 2017-2026

Esta estrategia permitió identificar siete trabajos de investigación que se presentan a

continuación según los criterios CVM establecidos.

El trabajo de (Baun et al., 2025) de la Frankfurt University of Applied Sciences, Alemania, [URL 🔗](https://www.zotero.org/google-docs/?sNobtd)

desarrollaron SKILL/VL, una plataforma de laboratorio virtual institucional basada

exclusivamente en software libre, orientada a cursos de redes de computadores y seguridad

informática. La infraestructura opera sobre doce (12) servidores de alto rendimiento usando

Proxmox VE1 como hipervisor con KVM/QEMU2, almacenamiento distribuido CEPH3, y

aislamiento de red mediante VXLAN4 por estudiante. La interfaz web, construida con Next.js

y ReactFlow, permite a los docentes crear y configurar escenarios de red mediante

drag-and-drop, mientras que Keycloak gestiona la autenticación integrada con los sistemas

institucionales.

Frente a las variables de análisis, SKILL/VL ofrece VMs completas con acceso total a

comandos Linux, persistencia mediante snapshots y aislamiento de red sólido a nivel de capa

2. Sin embargo, al estar orientado exclusivamente a la simulación de infraestructuras de red,

carece completamente de componente pedagógico estructurado, no tiene módulos temáticos,

talleres dinámicos, ni retroalimentación automática sobre las actividades del estudiante. Su

aporte principal para el presente proyecto radica en validar el modelo de despliegue


institucional on-premise con software libre como alternativa viable y sostenible frente a

soluciones en nube pública.

Desde está perspectiva se encuentra el trabajo de (Chapman & Clark, 2017) de la University of [URL 🔗](https://www.zotero.org/google-docs/?PD5B61)

South Alabama desarrollaron EVL5, una plataforma web de laboratorio virtual orientada a

ciberseguridad que combina un sistema de gestión de contenidos (CMS) con máquinas

virtuales en vivo accesibles desde el navegador. El CMS, construido con Django y Python,

permite a los docentes crear y publicar lecciones estructuradas con instrucciones paso a paso

que se presentan lado a lado con la VM activa, eliminando la necesidad de documentación

externa. Los contenidos son creados una sola vez y reutilizables para múltiples estudiantes,

con un panel de administración que permite asociar máquinas virtuales específicas a cada

ejercicio.

Desde las variables de análisis, EVL es el antecedente que más se acerca a la integración

pedagógica que busca el presente proyecto: el docente define el contenido, lo estructura en

lecciones progresivas y el sistema provisiona automáticamente las VMs6 vía noVNC7 sin

requerir software adicional en el cliente. Sin embargo, no implementa persistencia de sesión

la VM se destruye al finalizar la lección y carece de validación automática de respuestas o

talleres dinámicos configurables, aspectos que sí serán desarrollados en el laboratorio virtual

de la UFPS.

El trabajo de (Chen, 2020) diseña CvLabs, cuyo objetivo es la creación de una plataforma [URL 🔗](https://www.zotero.org/google-docs/?4Ath01)

web de laboratorios virtuales basada en contenedores Docker orquestados con Kubernetes,

donde cada estudiante recibe un entorno Linux aislado accesible desde el navegador mediante


WebSocket, sin necesidad de SSH. La plataforma soporta cuatro roles de usuario, calificación

automática agrupada y guías de laboratorio en Markdown con pasos interactivos.

CvLabs ejecuta comandos reales dentro de contenedores aislados por namespaces y cgroups,

garantizando seguridad mediante RBAC8 y políticas de red por namespace. No obstante, no

implementa persistencia el contenedor se destruye al terminar la sesión y carece de recursos

hipermediales estructurados por módulos temáticos y talleres dinámicos configurables por el

docente, aspectos que sí serán desarrollados en el presente proyecto.

El trabajo de (Deshmukh et al., 2025) del JSPM's Rajarshi Shahu College of Engineering, [URL 🔗](https://www.zotero.org/google-docs/?7ZAQsX)

India, desarrollaron EnVLAB, una plataforma web de laboratorio virtual bajo el modelo

Lab-as-a-Service orientada a la entrega y calificación de prácticas académicas. La

arquitectura usa Angular en el frontend, Node.js en el backend, MongoDB como base de

datos y Docker con Kubernetes para provisionar instancias individuales de un entorno

llamado Code Studio, que incluye terminal Linux y compilador integrados, accesibles

directamente desde el navegador mediante Xterm.js.

Frente a las variables de análisis, EnVLAB ejecuta comandos reales en contenedores Docker

aislados por estudiante, con roles diferenciados para institución, instructor y estudiante. Sin

embargo, no implementa persistencia de sesión, no tiene recursos hipermediales estructurados

por módulos temáticos, y su componente pedagógico se limita a la entrega y validación de

tareas con fecha límite, sin talleres dinámicos configurables ni retroalimentación automática

sobre comandos ejecutados.

El trabajo de (Shoshitaishvili et al., 2026) de la Universidad Estatal de Arizona desarrollaron

el Linux Luminarium, una plataforma web de aprendizaje de Linux basada en el framework


pwn.college DOJO9, donde cada estudiante accede a un entorno Linux aislado directamente

desde el navegador. La plataforma organiza su contenido en desafíos distribuidos en módulos

temáticos bajo el paradigma CTF (Capture the Flag), instrumentando el shell mediante hooks

en .bashrc para detectar errores y entregar retroalimentación inmediata, además de

randomizar los desafíos por estudiante para desincentivar la copia de soluciones.

La plataforma no ofrece mecanismos para que el docente personalice módulos de forma

dinámica, ni integra recursos hipermediales como videos, documentos o talleres ajustables

según el contexto del curso.

Otro trabajo es de (Šuppa et al., 2021) de la Universidad de Comenius desarrollaron

TermAdventure, una suite para la enseñanza interactiva de la línea de comandos UNIX

mediante el paradigma de juegos de aventura de texto. La herramienta instrumenta la sesión

Bash del estudiante a través de PROMPT_COMMAND, evaluando automáticamente cada

comando ejecutado sin necesidad de cambiar de entorno. Los desafíos se definen en archivos

YAML con estructura de grafo acíclico dirigido (DAG) que genera rutas aleatorias por

estudiante, y se complementa con TA Monitor, una aplicación web que permite al docente

visualizar el progreso en tiempo real y exportar calificaciones a sistemas externos.

Sin embargo, TermAdventure requiere acceso SSH o un entorno UNIX preconfigurado,

imponiendo una barrera técnica de entrada, y no ofrece acceso desde el navegador sin

instalación previa.

(Bailey y Zilles, 2019) de la Universidad de Illinois en Urbana-Champaign desarrollaron

uAssign, un sistema de asignaciones para la enseñanza y evaluación de habilidades en la

terminal Unix accesible directamente desde el navegador. La plataforma proporciona un

contenedor Docker por estudiante, conectado mediante WebSockets y un emulador de


terminal en JavaScript (hterm). En lugar de usar Dockerfiles estándar, implementaron un

script personalizado en JavaScript (index.js) que configura los contenedores directamente.

Cada contenedor se aísla mediante límites de CPU, memoria y procesos definidos por

Docker, se deshabilita la red una vez completada la configuración inicial, y se restringe a una

única conexión de terminal activa por instancia; mientras que las asignaciones se

parametrizan aleatoriamente a través de especificaciones JSON únicas por estudiante para

evitar la reutilización de soluciones.

Sin embargo, depende de un LMS externo para gestionar el contenido y el registro de

calificaciones, sin ofrecer por sí mismo un aprendizaje estructurado ni retroalimentación

dentro del entorno del shell.

A partir de los trabajos revisados, se observa que las soluciones se concentran en el uso de

virtualización y contenedores como principales enfoques de implementación, con diferencias

marcadas en el nivel de desarrollo del componente pedagógico. Esta variabilidad permite

establecer una categorización presentada en la Tabla 2.

*Tabla 2: Categorización de Enfoques*

| Enfoque Estrategia | Moda |   | Componente Pedagógico |   |
| --- | --- | --- | --- | --- |
| M1 | Usa Proxmox VE como | No | incluye | recursos |
| Baun et al. | hipervisor para crear máquinas | pedagógicos |   | ni |
|   | virtuales Linux/Windows | retroalimentación, por lo que se |   |   |
| (2025) | completas. Cada estudiante | orienta únicamente a la gestión |   |   |
|   | tiene un OS propio con acceso | de infraestructura técnica. |   |   |
|   | total a comandos y red, aislado |   |   |   |
|   | del resto mediante VXLAN. |   |   |   |


| M1 | Usa XenServer para | Integra lecciones paso a paso |
| --- | --- | --- |
| Chapman y | provisionar VMs Linux y | junto a la VM, pero sin |
|   | Windows bajo demanda. El | validación automática de las |
| Clark (2017) | estudiante accede al OS desde | actividades ni |
|   | el navegador vía noVNC sin | retroalimentación. |
|   | instalar nada. La VM se |   |
|   | destruye al terminar la sesión. |   |
| M2 | Usa Docker sobre Kubernetes | Incluye guías en Markdown |
| Chen (2020) | para entregar un entorno Linux | con pasos interactivos y |
|   | aislado por estudiante. No es | evaluación básica, pero sin |
|   | un OS completo, sino un | estructura modular ni |
|   | contenedor con los paquetes | retroalimentación sobre los |
|   | necesarios para el laboratorio, | comandos ejecutados. |
|   | accesible por terminal web. |   |
| M2 | Usa Docker con Kubernetes | Permite la entrega y |
| Deshmukh et M3 | para crear un contenedor | calificación de tareas, pero la |
|   | Linux por estudiante. El OS | evaluación se limita al |
| al. (2024) | está limitado al sandbox de | resultado final sin |
|   | Code Studio terminal y | retroalimentación. |
|   | compilador con restricciones |   |
|   | para evitar ejecución de código |   |
|   | malicioso. |   |
| M3 | Modifica la sesión Bash del | Presenta ejercicios tipo |
| Šuppa et al. | estudiante mediante un script | aventura con evaluación |
|   | Go que intercepta el prompt. | automática, pero sin guías |
| (2021) | No requiere VM ni | pedagógicas ni organización en |
|   | contenedor; corre en un | módulos temáticos. |
|   | servidor UNIX o dentro de |   |
|   | Docker como entorno de |   |
|   | distribución. |   |
| M2 | Plataforma web basada en | Ofrece un currículo |
| Shoshitaishvil | pwn.college DOJO que | estructurado con retos |
|   | entrega un entorno Linux | progresivos y retroalimentación |
| i et al. (2026) | accesible desde el navegador | en tiempo real, aunque centrado |
|   | sin instalación. Cada reto corre | en desafíos tipo CTF más que |
|   | en un contenedor Linux con | en guías formativas. |
|   | hooks en bash para monitorear |   |
|   | comandos en tiempo real. |   |
| M2 | Usa Docker para crear un | Integra asignaciones |
| Bailey y | contenedor Linux por | auto-calificadas dentro de un |
|   | estudiante, accesible desde el | LMS, pero sin guías de |
| Zilles (2019) | navegador vía WebSocket y | aprendizaje ni |
|   | emulador de terminal hterm. | retroalimentación. |
|   | El contenedor se destruye al |   |
|   | terminar o tras inactividad. |   |


A partir del análisis de la tabla de categorización, se identifica que las soluciones basadas en

virtualización (M1) aparecen en menor proporción y se orientan principalmente a escenarios

que priorizan el control y aislamiento, aunque con un mayor consumo de recursos que limita

su escalabilidad. Por su parte, los enfoques basados en contenedores (M2) se consolidan

como la tendencia predominante, al optimizar el uso de recursos, lo que permite una mejor

escalabilidad del sistema. Finalmente, los enfoques tipo sandbox (M3) se presentan como

mecanismos complementarios, enfocados en el control y evaluación de comandos, además de

facilitar la gestión y control de recursos dentro de los entornos de ejecución.

En cuanto al componente pedagógico, se evidencian tres tendencias: plataformas centradas

únicamente en la infraestructura técnica (SKILL/VL), soluciones con integración básica de

contenidos sin retroalimentación (EVL y uAssign), y propuestas más avanzadas con

evaluación automática y seguimiento del estudiante (Linux Luminarium). Sin embargo,

ninguna de las soluciones analizadas integra un entorno con un componente pedagógico

dinámico, modular y configurable por el docente y a su vez, con persistencia de sesiones del

estudiante.

Considerando las restricciones de infraestructura disponibles en el Departamento de Sistemas

e Informática de la Universidad Francisco de Paula Santander, donde el despliegue completo

del proyecto debe operar dentro de límites definidos de memoria, almacenamiento y número

de contenedores, se descarta la viabilidad de provisionar un contenedor individual por

estudiante bajo el enfoque M2, dado que desplegar un contenedor por cada uno de los

usuarios previstos superaría ampliamente los recursos institucionales disponibles.

Por lo anterior, se adopta una arquitectura híbrida que combina los enfoques M2 y M3. El

stack de la aplicación se despliega mediante contenedores Docker dentro de los límites

permitidos, mientras que el entorno Linux de los estudiantes se implementa sobre un servidor

Linux compartido, donde cada estudiante accede a una sesión asociada a un espacio de


trabajo persistente, con mecanismos de aislamiento, restricciones de permisos y control de

recursos aplicados sobre cada sesión de usuario. Este enfoque permite ofrecer entornos de

trabajo reales y persistentes dentro de las restricciones institucionales, manteniendo una

interacción directa con herramientas y comandos reales del sistema operativo Linux.

Sobre esta base, la propuesta incorpora acceso a terminal web real desde el navegador,

persistencia del espacio de trabajo entre sesiones, y un componente de contenidos con

recursos hipermediales organizados por módulos temáticos del curso, complementado con

simuladores visuales ejecutados en el navegador del estudiante. De esta manera, la propuesta

busca integrar las fortalezas identificadas en los trabajos revisados y superar sus limitaciones,

ofreciendo un entorno de aprendizaje más completo, flexible y adaptado a las necesidades del

contexto educativo de la UFPS.

## BIBLIOGRAFÍA

- Bailey, J. y Zilles, C. (2019). uAssign: Scalable interactive activities for teaching the Unix terminal. Proceedings of the 50th ACM Technical Symposium on Computer Science Education, 70–76.

- [Adarme Jaimes. (2021). Búsqueda y Selección de Servicios Web con restricciones QoS en ambientes Cloud Computing Ar_WSDS.](https://www.zotero.org/google-docs/?DMCkx5)

- [Baun, C., Kappes, M., Cocos, H.-N., Koch, M., & Petrozziello, M. (2025). The Virtual Computer Networks Lab: On the Design and Implementation of a Location Independent Networks Laboratory in Higher Education: Proceedings of the 17th International Conference on Computer Supported Education, 199-207. https://doi.org/10.5220/0013199400003932](https://www.zotero.org/google-docs/?DMCkx5)


[Chapman, D., & Clark, A. (2017). The Enhanced Virtual Laboratory: Extending Cyber](https://www.zotero.org/google-docs/?DMCkx5)

[Security Awareness through a Web-based Laboratory.](https://www.zotero.org/google-docs/?DMCkx5)

[Chen, G. (2020). CvLabs—A Container Based Interactive Virtual Lab for IT Education.](https://www.zotero.org/google-docs/?DMCkx5)

- [Deshmukh, R., Pandit, G., Patil, N., Dandvate, S., & Zele, S. (2024). EnVLAB-Enhanced Virtual Labs for Educational Environment.](https://www.zotero.org/google-docs/?DMCkx5)

- Shoshitaishvili, Y., Doupé, A. y Nelson, C. (2026). The Linux Luminarium: Learning Linux by leveraging lightweight labs and ludicrous lessons. Proceedings of the 57th ACM Technical Symposium on Computer Science Education V.1 (SIGCSE TS 2026). https://doi.org/10.1145/3770762.3772655

- Šuppa, M., Jariabka, O., Matejov, A. y Nagy, M. (2021). TermAdventure: Interactively teaching Unix command line, text adventure style. Proceedings of the 26th ACM Conference on Innovation and Technology in Computer Science Education V.1, 108–114.
