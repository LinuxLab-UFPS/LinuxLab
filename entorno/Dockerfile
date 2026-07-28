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
    passwd \
    sudo \
    curl \
    wget \
    openssh-server \
    && rm -rf /var/lib/apt/lists/*

# Script simulado de systemctl
RUN printf '#!/bin/bash\nCOMMAND=$1\nSERVICE=$2\ncase "$COMMAND" in\n  start)   echo "Started $SERVICE"  ;;\n  stop)    echo "Stopped $SERVICE"  ;;\n  status)  echo "$SERVICE is active (simulated)" ;;\n  enable)  echo "Enabled $SERVICE"  ;;\n  disable) echo "Disabled $SERVICE" ;;\n  restart) echo "Restarted $SERVICE" ;;\n  *)       echo "Usage: systemctl {start|stop|status|enable|disable|restart} service" ;;\nesac' > /usr/local/bin/systemctl \
    && chmod +x /usr/local/bin/systemctl

# Configuracion global de bash para todos los usuarios
RUN printf '\n# Limites de seguridad por usuario\nulimit -u 50\nulimit -f 102400\nulimit -v 262144\n# Cierre por inactividad: 15 minutos\nTMOUT=900\nreadonly TMOUT\nexport TMOUT\n' >> /etc/bash.bashrc

# Usuario intermedio para operaciones del backend
RUN useradd -m -s /bin/bash labadmin

# Configurar sudoers para labadmin
RUN echo 'labadmin ALL=(root) NOPASSWD: /usr/sbin/useradd, /usr/sbin/userdel, /usr/bin/passwd, /bin/mkdir, /bin/chown, /bin/chmod' \
    > /etc/sudoers.d/labadmin \
    && chmod 440 /etc/sudoers.d/labadmin

# Permisos seguros en /home
RUN chmod 755 /home

COPY scripts/entrypoint-entorno.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
CMD ["/entrypoint.sh"]