La carpeta de un proyecto está lista para entregarse, pero nadie ha revisado sus permisos:

```bash
cd ~/actividades/cerrar-el-proyecto
ls -l
```

```
config/  desplegar.sh  leeme.txt  respaldo.tmp
```

## Lo que hay que hacer

Dejar cada cosa como corresponde antes de entregar:

| Objeto | Lo que se espera de él |
|---|---|
| `desplegar.sh` | Tiene que poder ejecutarse: cualquiera lo lee y lo ejecuta, sólo tú lo modificas |
| `leeme.txt` | Cualquiera puede leerlo, sólo tú modificarlo |
| `config` | Nadie más entra ni ve qué contiene; tú sí trabajas dentro |
| `config/credenciales.txt` | Sólo tú, ni leerlo pueden los demás |
| `respaldo.tmp` | Una copia temporal que no debe quedar en la entrega |

Al mirar `config` con `ls -l` aparece una `s` en el bloque de grupo: es el bit heredado que se explicó en la lección de directorios. Un `chmod` de tres dígitos deja la carpeta exactamente en el modo pedido y de paso se lleva ese bit, que aquí no hace falta.

Un directorio no se protege con el mismo criterio que un archivo, y sus permisos no dicen nada de los del archivo que hay dentro: las dos últimas filas son cosas distintas y hay que resolverlas por separado.
