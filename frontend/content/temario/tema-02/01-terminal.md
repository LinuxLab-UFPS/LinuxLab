## La línea de comandos

En el tema anterior quedaron nombradas las piezas: la terminal recoge lo que se teclea, la shell lo interpreta, las bibliotecas traducen la petición y el Kernel la ejecuta. Este tema se queda en las dos primeras, que son con las que se trabaja a diario.

La **línea de comandos** es un sistema de entrada de texto donde se le indica al computador exactamente qué debe hacer (NDG, 2024). Admite desde un comando simple hasta un script completo de cien líneas.

<!-- ILLUSTRATION: terminal -->

## Cómo acceder a la terminal

En un sistema Linux con entorno gráfico hay dos formas de llegar a la terminal:

**Terminal de escritorio:** Es una aplicación dentro del entorno gráfico que abre una ventana con la línea de comandos. Según la distribución que uses, la encuentras buscando "terminal" en el menú de aplicaciones. En Ubuntu se llama GNOME Terminal, en KDE es Konsole. Todas hacen lo mismo.

**Terminal virtual:** Independiente del entorno gráfico. Se accede con las teclas <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>F2</kbd> hasta <kbd>F6</kbd>. Cada una es una sesión completamente separada. Para volver al entorno gráfico se usa <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>F1</kbd> o <kbd>F7</kbd>, según el sistema. Los servidores suelen arrancar directamente en una de estas, sin escritorio.

La diferencia entre las dos no es cosmética. La de escritorio es una aplicación más: vive dentro del entorno gráfico y se cae con él. La virtual la ofrece el propio Kernel, que reserva unas cuantas y les da su archivo de dispositivo (`/dev/tty1`, `/dev/tty2` y así). Como no dependen del escritorio, siguen ahí cuando el escritorio se congela, y ese es el camino habitual para arreglarlo sin reiniciar la máquina.

En LinuxLab trabajas desde la terminal integrada en la plataforma, que funciona igual que cualquiera de las dos anteriores.

## Tu primer comando

Abre la terminal del laboratorio, escribe esto y pulsa <kbd>Enter</kbd>:

```bash
echo "Hello World!"
```

```
Hello World!
```

Eso es todo lo que hace `echo`: repite en pantalla lo que se le pasa. Y es todo lo que hace falta para ver el circuito completo funcionando, porque esa línea acaba de recorrer las cuatro capas del tema anterior y volver.

## El shell

Aquí está la confusión más común de todo el tema, y conviene despejarla de entrada: **la terminal y el shell no son lo mismo**. La terminal es la ventana, el marco que dibuja las letras y recoge las teclas. El shell es el programa que corre dentro de esa ventana y entiende lo que se escribió.

<!-- ILLUSTRATION: prompt-dollar -->

Ese `$` parpadeando lo pone el shell, no la terminal, y significa que terminó lo anterior y espera la siguiente orden. Al pulsar <kbd>Enter</kbd> la terminal no ejecuta nada: le entrega la línea al shell, que la interpreta y le dice al sistema operativo qué tiene que hacer (Free Software Foundation, 2025). Si el comando produce una salida, el shell la devuelve y la terminal la dibuja. Si algo sale mal, muestra un error.

La prueba de que son piezas separadas es que se combinan libremente. GNOME Terminal y Konsole, los que se nombraron arriba, son **terminales**, y las dos arrancan el mismo shell por debajo: Bash. Cambiar de escritorio cambia la ventana, no el programa que interpreta tus comandos.

## Familias de shell

Linux ofrece varios shells para elegir. La mayoría difieren en lo que permiten personalizar y en la sintaxis de su lenguaje de scripting. Todos los shells modernos descienden de dos familias originales de los años 70:

**Familia Bourne:** Creado por Stephen Bourne en Bell Labs en 1979, el Bourne shell (`sh`) fue el que venía en aquel Unix del que salió todo, y sigue existiendo hoy en cualquier sistema. Su descendiente moderno es **Bash** (Bourne Again Shell), que añade historial de comandos, autocompletado y scripting avanzado. Es el shell por defecto en la mayoría de distribuciones Linux.

**Familia C:** El C shell tomó su nombre de que su sintaxis se parece al lenguaje de programación C. Su versión moderna es **tcsh**. Aunque sigue disponible en muchos sistemas, es menos común que Bash.

A partir de estas dos familias, los programadores tomaron lo mejor de cada una para crear otros shells como el **Korn shell (ksh)** y el **Z shell (zsh)**. Zsh en particular ganó popularidad en años recientes y es el shell por defecto en macOS desde 2019.

La elección del shell es mayormente personal. Un usuario cómodo con Bash puede trabajar efectivamente en prácticamente cualquier sistema Linux, ya que es el estándar de facto.

## Bash

Bash lleva décadas siendo el shell por defecto en Linux. Más allá de ejecutar comandos, tiene características que lo hacen especialmente útil:

- **Historial de comandos:** las flechas <kbd>↑</kbd> y <kbd>↓</kbd> recuperan los comandos anteriores sin tener que escribirlos de nuevo.
- **Scripting:** una secuencia de comandos se guarda en un archivo y se ejecuta entera de una vez. Bash incluye estructuras como condicionales y funciones, lo que lo convierte en un lenguaje de programación básico.
- **Alias:** nombres cortos para comandos largos de uso frecuente.
- **Variables:** guardan información reutilizable dentro de la sesión o en scripts.

---

**Fuentes**

- Free Software Foundation. (2025). *Bash reference manual* (edición 5.3). https://www.gnu.org/software/bash/manual/bash.html
- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
- Shotts, W. (2026). *The Linux command line* (3.ª ed.). No Starch Press. https://linuxcommand.org/tlcl.php
