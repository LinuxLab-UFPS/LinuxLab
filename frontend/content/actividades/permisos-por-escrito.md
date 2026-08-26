Antes de empezar, muévete al directorio `~/actividades/permisos-por-escrito`:

```bash
cd ~/actividades/permisos-por-escrito
```

Cada día que pasa te das cuenta de que tus compañeros de trabajo en LinuxLab TM no son muy competentes.

El colega Mauricio necesita cambiar los permisos de unos archivos a los que solo él tiene acceso, pero no sabe nada del tema y está convencido de que los permisos solo se pueden escribir de forma simbólica. Para salir del paso armó un script con ChatJP que lee `permisos.txt` de tu directorio y aplica lo que encuentre ahí.

Solo tienes que rellenar el campo de cada archivo. **No cambies nada más**, ni una sola línea: si el formato no es exactamente el que su script espera, no sabrá qué hacer.

**Objetivo:**

Escribir los permisos de los siguientes archivos, en forma simbólica, dentro de `permisos.txt`:

| Archivo | Modificación |
|---|---|
| `desplegar.sh` | Tiene que poder ejecutarse: cualquiera lo lee y lo ejecuta, solo tú lo modificas. |
| `leeme.txt` | Cualquiera puede leerlo, solo tú modificarlo. |
| `config` | Nadie más entra ni ve qué contiene; tú sí trabajas dentro. |

**Hint:**

La forma simbólica son diez caracteres: el primero dice qué tipo de archivo es, y los nueve siguientes van en tres bloques de tres. `ls -l` los muestra así para todo lo que hay en la carpeta.
