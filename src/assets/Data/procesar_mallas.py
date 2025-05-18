import json
import pandas as pd

# Leer el archivo de códigos y materias
codigos_df = pd.read_csv('CodigosMaterias.csv')

# Crear un diccionario de códigos a nombres de materias
codigo_a_materia = dict(zip(codigos_df['Cod-materia'], codigos_df['Materia']))

# Leer el archivo FiecMallas.json
with open('FiecMallas.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Agregar el campo Materia a cada materia en el JSON
for carrera in data['Fiec']:
    for materia in carrera['materias']:
        codigo = materia['codigo']
        materia['Materia'] = codigo_a_materia.get(codigo, '')

# Guardar el resultado en un nuevo archivo
with open('FiecMallas_actualizado.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print("Proceso completado. Se ha creado el archivo FiecMallas_actualizado.json") 