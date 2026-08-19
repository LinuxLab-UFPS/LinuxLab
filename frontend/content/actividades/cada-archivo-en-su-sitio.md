Dentro de `~/actividades/cada-archivo-en-su-sitio` hay cuatro archivos:

```bash
cd ~/actividades/cada-archivo-en-su-sitio
ls -l
```

Todos llegaron con los mismos permisos, los que el sistema pone por defecto. Ninguno de los cuatro los tiene como debería.

## Lo que hay que hacer

Dejar cada archivo con los permisos que pide su función:

| Archivo | Para qué es |
|---|---|
| `notas.txt` | Apuntes privados: solo tú puedes leerlo y modificarlo |
| `informe.txt` | Se entrega: cualquiera puede leerlo, solo tú modificarlo |
| `arranque.sh` | Es un programa: cualquiera puede leerlo y ejecutarlo, solo tú modificarlo |
| `plantilla.txt` | Documento oficial: cualquiera puede leerlo y nadie modificarlo, tú tampoco |

Cada descripción admite una única combinación. Traducirla a permisos es el ejercicio.

(Pista: `ls -l` muestra cómo están ahora, y comparar lo que hay con lo que se pide suele ser más rápido que calcular el número desde cero).
