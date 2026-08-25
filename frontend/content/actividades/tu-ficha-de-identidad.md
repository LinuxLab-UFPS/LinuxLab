El sistema no te conoce por tu nombre, sino por un número y por los grupos a los que perteneces. Esta actividad es dejar eso por escrito.

```bash
mkdir -p ~/actividades/tu-ficha-de-identidad
cd ~/actividades/tu-ficha-de-identidad
```

## Lo que hay que hacer

| Archivo | Qué tiene que quedar dentro |
|---|---|
| `identidad.txt` | Tu identidad completa: usuario, grupo primario y todos los grupos a los que perteneces |
| `cuenta.txt` | Tu línea entera de la base de cuentas del sistema |
| `shell.txt` | Solo el shell con el que entras, recortado de esa línea |

Tu línea de cuenta no hay que buscarla a mano en el archivo: existe un comando que la consulta directamente por nombre de usuario. Y esa línea tiene siete campos separados por `:`, de los cuales aquí interesa el último, así que hace falta cortarla por ese separador en vez de copiar el valor a ojo.
