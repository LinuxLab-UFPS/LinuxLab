## La línea de comandos

La **línea de comandos** es un sistema de entrada de texto donde le dices al computador exactamente qué quieres que haga. Puedes escribir desde un comando simple hasta un script completo de cien líneas. Es directa, sin capas visuales en el medio.

<!-- IMAGE: terminal-linux.png | Terminal de línea de comandos en Linux -->

## Cómo acceder a la terminal

En un sistema Linux con entorno gráfico hay dos formas de llegar a la terminal:

**Terminal de escritorio:** Es una aplicación dentro del entorno gráfico que abre una ventana con la línea de comandos. Según la distribución que uses, la encuentras buscando "terminal" en el menú de aplicaciones. En Ubuntu se llama GNOME Terminal, en KDE es Konsole. Todas hacen lo mismo.

**Terminal virtual:** Independiente del entorno gráfico. Se accede con las teclas **Ctrl + Alt + F2** hasta **F6**. Cada una es una sesión completamente separada. Para volver al entorno gráfico usas **Ctrl + Alt + F1** o **F7** dependiendo del sistema. Los servidores suelen arrancar directamente en una de estas, sin escritorio.

En LinuxLab trabajas desde la terminal integrada en la plataforma, que funciona igual que cualquiera de las dos anteriores.

## El shell

Cuando escribes un comando en la terminal y presionas Enter, la terminal no lo ejecuta directamente. Lo pasa al **shell**, que es el programa encargado de interpretar lo que escribiste y decirle al sistema operativo qué tiene que hacer. Si el comando produce una salida, el shell la muestra en pantalla. Si algo sale mal, muestra un error.

El shell es el puente entre tú y el kernel.

## Familias de shell

Linux ofrece varios shells para elegir. La mayoría difieren en lo que permiten personalizar y en la sintaxis de su lenguaje de scripting. Todos los shells modernos descienden de dos familias originales de los años 70:

**Familia Bourne:** Creado por Stephen Bourne en Bell Labs, el Bourne shell fue uno de los primeros en UNIX. Su descendiente moderno es **Bash** (Bourne Again Shell), que añade historial de comandos, autocompletado y scripting avanzado. Es el shell por defecto en la mayoría de distribuciones Linux.

**Familia C:** El C shell tomó su nombre de que su sintaxis se parece al lenguaje de programación C. Su versión moderna es **tcsh**. Aunque sigue disponible en muchos sistemas, es menos común que Bash.

A partir de estas dos familias, los programadores tomaron lo mejor de cada una para crear otros shells como el **Korn shell (ksh)** y el **Z shell (zsh)**. Zsh en particular ganó popularidad en años recientes y es el shell por defecto en macOS desde 2019.

La elección del shell es mayormente personal. Un usuario cómodo con Bash puede trabajar efectivamente en prácticamente cualquier sistema Linux, ya que es el estándar de facto.

## Bash

Bash lleva décadas siendo el shell por defecto en Linux. Más allá de ejecutar comandos, tiene características que lo hacen especialmente útil:

- **Historial de comandos:** Puedes navegar los comandos anteriores con las flechas del teclado sin tener que escribirlos de nuevo.
- **Scripting:** Puedes guardar una secuencia de comandos en un archivo y ejecutarlos todos de una sola vez. Bash incluye estructuras como condicionales y funciones, lo que lo convierte en un lenguaje de programación básico.
- **Alias:** Puedes crear nombres cortos para comandos largos que usas con frecuencia.
- **Variables:** Permiten guardar información que puedes reutilizar dentro de la sesión o en scripts.

Cuando abres una terminal y ves el símbolo `$`, significa que Bash está listo para recibir un comando.

```bash
usuario@linuxlab:~$
```

Ese texto antes del `$` es el **prompt**: te indica tu nombre de usuario, el nombre del equipo y el directorio donde estás. El `~` representa tu directorio de inicio (home).

---

**Fuentes**

- NDG Linux Essentials. Cisco Networking Academy, 2024.
- Shotts, W. *The Linux Command Line*, 2nd Ed. No Starch Press, 2019. linuxcommand.org
