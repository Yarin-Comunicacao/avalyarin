import mysql.connector
import re
import requests

db_url = "mysql://3o1KcwvkeAxCR1d.root:VZJWyUmn9hTODT1L@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/avalyarin"
match = re.match(r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', db_url)
user, password, host, port, database = match.groups()

conn = mysql.connector.connect(user=user, password=password, host=host, port=port, database=database)
cursor = conn.cursor(dictionary=True)
cursor.execute("SELECT id, name FROM establishments WHERE name LIKE '%Julinho%'")
estabs = cursor.fetchall()
print('Estabelecimentos Julinho:', estabs)

if estabs:
    estab_id = estabs[0]['id']
    cursor.execute("SELECT id, name, category, imageUrl FROM menu_items WHERE establishmentId = %s ORDER BY category, name", (estab_id,))
    items = cursor.fetchall()
else:
    items = []

print('Total de itens no cardápio:', len(items))
for item in items:
    if item['imageUrl']:
        try:
            response = requests.head(item['imageUrl'], timeout=15, allow_redirects=True)
            print(f"{item['id']} | {item['name']} | {item['category']} | {response.status_code} | {response.headers.get('content-type')} | {item['imageUrl']}")
        except Exception as exc:
            print(f"{item['id']} | {item['name']} | ERRO HTTP | {exc} | {item['imageUrl']}")

cursor.execute("SELECT COUNT(*) AS total FROM menu_items WHERE imageUrl LIKE '%r2.cloudflarestorage.com%'")
print('Itens ainda com domínio antigo:', cursor.fetchone()['total'])
cursor.close()
conn.close()
if not items:
    raise SystemExit('Nenhum item de menu encontrado para o Julinho.')

print('Verificação concluída.')
