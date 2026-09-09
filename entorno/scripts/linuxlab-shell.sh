# Identidad de LinuxLab en la terminal del estudiante.
# Se carga desde /etc/bash.bashrc, solo para shells interactivas.

if [ -n "$PS1" ]; then
  # Prompt en el rojo de la marca; la salida de los comandos queda en blanco.
  PS1='\[\e[1;38;2;255;84;112m\]\u@\h:\w\$\[\e[0m\] '

  # En cada prompt, la shell dice en que directorio esta (OSC 7, el estandar que
  # usan los emuladores para seguir el cwd). La plataforma lo lee para saber si
  # el estudiante esta dentro del directorio de la actividad que tiene abierta.
  #
  # Es una secuencia de control: el emulador la consume y no se ve en pantalla.
  # Va por aqui y no leyendo /proc porque el entorno monta hidepid=2 a proposito
  # y el sudoers es una lista blanca cerrada.
  #
  # Si el estudiante sobrescribe PROMPT_COMMAND deja de emitirse, y no pasa
  # nada: esto es comodidad de interfaz, no un control. Quien evalua mira los
  # archivos en el disco, no donde esta la shell.
  PROMPT_COMMAND='printf "\033]7;file://%s\033\\" "$PWD"'
  export PROMPT_COMMAND
fi
