# Identidad de LinuxLab en la terminal del estudiante.
# Se carga desde /etc/bash.bashrc, solo para shells interactivas.

if [ -n "$PS1" ]; then
  # Prompt en el rojo de la marca; la salida de los comandos queda en blanco.
  PS1='\[\e[1;38;2;255;84;112m\]\u@\h:\w\$\[\e[0m\] '

  # Saludo en ambar, una sola vez por sesion (no en cada subshell).
  if [ -z "$LINUXLAB_WELCOMED" ]; then
    export LINUXLAB_WELCOMED=1
    printf '\e[1;38;2;245;158;11m¡Bienvenido a LinuxLab!\e[0m\n'
  fi
fi
