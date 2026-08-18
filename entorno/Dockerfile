FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    bash \
    man-db \
    coreutils \
    vim \
    nano \
    tar \
    gzip \
    bzip2 \
    zip \
    unzip \
    grep \
    findutils \
    procps \
    tree \
    passwd \
    sudo \
    python3-minimal \
    openssh-server \
    quota \
    && apt-get remove -y wget curl 2>/dev/null || true \
    && rm -rf /var/lib/apt/lists/*

# Script simulado de systemctl
RUN printf '#!/bin/bash\nCOMMAND=$1\nSERVICE=$2\ncase "$COMMAND" in\n  start)   echo "Started $SERVICE"  ;;\n  stop)    echo "Stopped $SERVICE"  ;;\n  status)  echo "$SERVICE is active (simulated)" ;;\n  enable)  echo "Enabled $SERVICE"  ;;\n  disable) echo "Disabled $SERVICE" ;;\n  restart) echo "Restarted $SERVICE" ;;\n  *)       echo "Usage: systemctl {start|stop|status|enable|disable|restart} service" ;;\nesac' > /usr/local/bin/systemctl \
    && chmod +x /usr/local/bin/systemctl

# `tree` acotado al home del estudiante.
#
# El comando lo pide la leccion de navegacion, pero suelto es un recorredor de
# arbol: `tree /` pasea por todo el contenedor y `tree /home` enumera quien mas
# existe. Los permisos ya frenan la lectura del trabajo ajeno, pero no el paseo.
# Este envoltorio va en /usr/local/bin, que precede a /usr/bin en el PATH, asi
# que es el que se ejecuta. Resuelve cada ruta y rechaza lo que caiga fuera del
# home; el resto lo pasa tal cual al binario de verdad.
COPY scripts/tree-acotado.sh /usr/local/bin/tree
RUN chmod 755 /usr/local/bin/tree && chown root:root /usr/local/bin/tree

# Limites de recursos por usuario
# Limites de cada sesion de estudiante.
#
# `ulimit -u` es el que importa: el servidor de despliegue concede 512 procesos
# al proyecto ENTERO, no a cada estudiante. Con 512 por cabeza, uno solo podia
# agotar el presupuesto y tumbar tambien el backend y el frontend. Un estudiante
# trabajando usa 3, asi que 16 le sobra para tuberias y deja el fork bomb en 16
# procesos: menos capacidad de monopolizar la CPU del laboratorio.
#
# TMOUT cierra las terminales inactivas a los 15 minutos. Va `readonly` para que
# no se pueda desactivar, y es lo que hace que el cupo de sesiones rinda: quien
# se va a almorzar libera su sitio sin tener que cerrar nada.
RUN printf '\nulimit -u 16\nulimit -f 15360\nulimit -v 262144\n# Cierre por inactividad: 15 minutos\nTMOUT=900\nreadonly TMOUT\nexport TMOUT\n' >> /etc/bash.bashrc

# Identidad LinuxLab en la terminal (prompt rojo + saludo ambar).
COPY scripts/linuxlab-shell.sh /etc/linuxlab-shell.sh
RUN printf '\n. /etc/linuxlab-shell.sh\n' >> /etc/bash.bashrc

# Configurar SSH: solo clave publica, sin password
# Cada terminal abierta ocupa un canal SSH permanente sobre la unica conexion
# que mantiene el backend. El valor por defecto de MaxSessions es 10, o sea que
# el estudiante numero once no abria terminal por mucha memoria que sobrara. Con
# 100 el techo lo pone la memoria y no una constante de OpenSSH.
RUN echo 'PasswordAuthentication no' >> /etc/ssh/sshd_config \
    && echo 'PubkeyAuthentication yes' >> /etc/ssh/sshd_config \
    && echo 'MaxSessions 100' >> /etc/ssh/sshd_config \
    && echo 'MaxStartups 30:60:120' >> /etc/ssh/sshd_config \
    && chmod 600 /etc/ssh/sshd_config

# Quitar systemd de nsswitch (no hay systemd, cuelga NSS lookup)
RUN sed -i 's/^passwd:.*/passwd: files/' /etc/nsswitch.conf && \
    sed -i 's/^group:.*/group: files/' /etc/nsswitch.conf

# Usuario intermedio para operaciones del backend
RUN useradd -m -s /bin/bash labadmin \
    && chmod 700 /home/labadmin

# Configurar sudoers para labadmin
RUN printf '%s\n%s\n' \
    'labadmin ALL=(root) NOPASSWD: /usr/sbin/useradd, /usr/sbin/userdel, /usr/sbin/usermod, /usr/sbin/groupadd, /usr/bin/passwd, /bin/mkdir, /bin/chown, /bin/chmod, /bin/cp, /bin/rm, /usr/bin/su' \
    'labadmin ALL=(ALL) NOPASSWD: /usr/local/lib/linuxlab/checker.py, /usr/local/lib/linuxlab/setup.py, /usr/local/lib/linuxlab/submitter.py' \
    > /etc/sudoers.d/labadmin \
    && chmod 440 /etc/sudoers.d/labadmin

# Evaluador de aserciones. Va horneado y no se copia en cada corrida: un script
# que se envia es un script que el estudiante podria reemplazar o interceptar.
COPY scripts/checker.py /usr/local/lib/linuxlab/checker.py
# Prepara el arbol de una actividad. Va aparte del checker porque escribe, y el
# checker solo lee: darle permiso de escritura al que evalua significaria que un
# fallo suyo pueda estropear el trabajo que esta midiendo.
COPY scripts/setup.py /usr/local/lib/linuxlab/setup.py
# Entregas manuales: captura el arbol de archivos y crea el tarball. Tambien
# escribe, por eso corre aparte del checker.
COPY scripts/submitter.py /usr/local/lib/linuxlab/submitter.py
RUN chmod 755 /usr/local/lib/linuxlab/checker.py /usr/local/lib/linuxlab/setup.py /usr/local/lib/linuxlab/submitter.py \
    && chown root:root /usr/local/lib/linuxlab/checker.py /usr/local/lib/linuxlab/setup.py /usr/local/lib/linuxlab/submitter.py

COPY scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
CMD ["/entrypoint.sh"]
