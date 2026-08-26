Antes de empezar, crea el directorio y muévete a él:

```bash
mkdir -p ~/actividades/tu-ficha-de-identidad
cd ~/actividades/tu-ficha-de-identidad
```

El sistema no te conoce por tu nombre sino por un número y por los grupos a los que perteneces. Vas a dejar esos datos en tres archivos, dentro de este directorio.

**Objetivos:**

1. Crea `identidad.txt` y guarda dentro tu identidad completa: tu número de usuario, tu grupo principal y todos los grupos a los que perteneces. Hay un solo comando que muestra las tres cosas de golpe.
2. Crea `cuenta.txt` y guarda dentro tu línea entera de la base de cuentas del sistema, tal cual sale, con sus siete campos separados por `:`.
3. Crea `shell.txt` y escribe dentro únicamente el shell con el que entras, recortado de esa línea. Una línea, sin nada más.

**Hint:**

Tu línea de cuenta no hay que buscarla a mano dentro de un archivo: existe un comando que la consulta directamente por nombre de usuario. Y para quedarte solo con el shell, hay un comando que corta un campo concreto indicando cuál es el separador y qué número de campo quieres. El shell es el séptimo, o sea el último.
