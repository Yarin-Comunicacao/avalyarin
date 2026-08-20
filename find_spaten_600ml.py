import mysql.connector
import os

# Credenciais extraídas do .env
db_url = "mysql://3o1KcwvkeAxCR1d.root:VZJWyUmn9hTODT1L@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/avalyarin"

# Parsear a URL do banco
import re
match = re.match(r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', db_url)
user, password, host, port, database = match.groups()

try:
    conn = mysql.connector.connect(
        user=user,
        password=password,
        host=host,
        port=port,
        database=database
    )
    cursor = conn.cursor(dictionary=True)
    
    # Buscar itens que contenham variações de 600ml no nome
    query = "SELECT id, establishmentId, name, imageUrl FROM menu_items WHERE name LIKE '%600%' OR name LIKE '%600ml%' OR name LIKE '%600 ml%'"
    cursor.execute(query)
    items = cursor.fetchall()
    
    print(f"Encontrados {len(items)} itens:")
    for item in items:
        print(f"- ID: {item['id']}, Estalecimento: {item['establishmentId']}, Nome: {item['name']}, URL Atual: {item['imageUrl']}")
        
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Erro: {e}")
