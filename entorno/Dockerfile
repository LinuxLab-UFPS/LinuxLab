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

# Cierre por inactividad: 15 minutos
RUN printf '\nTMOUT=900\nreadonly TMOUT\nexport TMOUT\n' >> /etc/bash.bashrc

# Configurar SSH: solo clave publica, sin password
RUN echo 'PasswordAuthentication no' >> /etc/ssh/sshd_config \
    && echo 'PubkeyAuthentication yes' >> /etc/ssh/sshd_config

# Quitar systemd de nsswitch (no hay systemd, cuelga NSS lookup)
RUN sed -i 's/^passwd:.*/passwd: files/' /etc/nsswitch.conf && \
    sed -i 's/^group:.*/group: files/' /etc/nsswitch.conf

# Usuario intermedio para operaciones del backend
RUN useradd -m -s /bin/bash labadmin

# Configurar sudoers para labadmin
RUN echo 'labadmin ALL=(root) NOPASSWD: /usr/sbin/useradd, /usr/sbin/userdel, /usr/sbin/usermod, /usr/sbin/groupadd, /usr/bin/passwd, /bin/mkdir, /bin/chown, /bin/chmod, /bin/rm, /usr/bin/su' \
    > /etc/sudoers.d/labadmin \
    && chmod 440 /etc/sudoers.d/labadmin

COPY scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
CMD ["/entrypoint.sh"]
