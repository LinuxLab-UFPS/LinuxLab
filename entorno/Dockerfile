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
    python3-minimal \
    openssh-server \
    && apt-get remove -y wget curl 2>/dev/null || true \
    && rm -rf /var/lib/apt/lists/*

# Script simulado de systemctl
RUN printf '#!/bin/bash\nCOMMAND=$1\nSERVICE=$2\ncase "$COMMAND" in\n  start)   echo "Started $SERVICE"  ;;\n  stop)    echo "Stopped $SERVICE"  ;;\n  status)  echo "$SERVICE is active (simulated)" ;;\n  enable)  echo "Enabled $SERVICE"  ;;\n  disable) echo "Disabled $SERVICE" ;;\n  restart) echo "Restarted $SERVICE" ;;\n  *)       echo "Usage: systemctl {start|stop|status|enable|disable|restart} service" ;;\nesac' > /usr/local/bin/systemctl \
    && chmod +x /usr/local/bin/systemctl

# Limites de recursos por usuario
RUN printf '\nulimit -u 512\nulimit -f 15360\nulimit -v 262144\n# Cierre por inactividad: 15 minutos\nTMOUT=900\nreadonly TMOUT\nexport TMOUT\n' >> /etc/bash.bashrc

# Identidad LinuxLab en la terminal (prompt rojo + saludo ambar).
COPY scripts/linuxlab-shell.sh /etc/linuxlab-shell.sh
RUN printf '\n. /etc/linuxlab-shell.sh\n' >> /etc/bash.bashrc

# Configurar SSH: solo clave publica, sin password
RUN echo 'PasswordAuthentication no' >> /etc/ssh/sshd_config \
    && echo 'PubkeyAuthentication yes' >> /etc/ssh/sshd_config \
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
    'labadmin ALL=(ALL) NOPASSWD: /usr/local/lib/linuxlab/checker.py' \
    > /etc/sudoers.d/labadmin \
    && chmod 440 /etc/sudoers.d/labadmin

# Evaluador de aserciones. Va horneado y no se copia en cada corrida: un script
# que se envia es un script que el estudiante podria reemplazar o interceptar.
COPY scripts/checker.py /usr/local/lib/linuxlab/checker.py
RUN chmod 755 /usr/local/lib/linuxlab/checker.py \
    && chown root:root /usr/local/lib/linuxlab/checker.py

COPY scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
CMD ["/entrypoint.sh"]
