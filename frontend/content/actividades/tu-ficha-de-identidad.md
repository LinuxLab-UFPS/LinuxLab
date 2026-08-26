Antes de empezar, crea el directorio y muévete a él:

```bash
mkdir -p ~/actividades/tu-ficha-de-identidad
cd ~/actividades/tu-ficha-de-identidad
```

El sistema no te conoce por tu nombre, sino por un número y por los grupos a los que perteneces. Deja esos datos por escrito.

**Objetivos:**

| Archivo | Qué tiene que quedar dentro |
|---|---|
| `identidad.txt` | Tu identidad completa: usuario, grupo primario y todos los grupos a los que perteneces. |
| `cuenta.txt` | Tu línea entera de la base de cuentas del sistema. |
| `shell.txt` | Solo el shell con el que entras, recortado de esa línea. |

**Hint:**

Tu línea de cuenta no hay que buscarla a mano: existe un comando que la consulta directamente por nombre de usuario. Esa línea tiene siete campos separados por `:`, y aquí interesa el último.
