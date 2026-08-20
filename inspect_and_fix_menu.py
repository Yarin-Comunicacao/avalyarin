import mysql.connector
import re

db_url = "mysql://3o1KcwvkeAxCR1d.root:VZJWyUmn9hTODT1L@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/avalyarin"
match = re.match(r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', db_url)
user, password, host, port, database = match.groups()

new_domain = "https://pub-bb18166d5e144b6ab0d3eaec567317d1.r2.dev"

mapping = {
    "spaten": f"{new_domain}/defaults/beverages/beers/600ml/spaten_600ml.jpg",
    "heineken": f"{new_domain}/defaults/beverages/beers/600ml/heineken_600ml.jpg",
    "amstel": f"{new_domain}/defaults/beverages/beers/600ml/amstel_600ml.jpg",
    "original": f"{new_domain}/defaults/beverages/beers/600ml/original_600ml.jpg",
    "brahma": f"{new_domain}/defaults/beverages/beers/600ml/brahma_600ml.jpg",
    "corona": f"{new_domain}/defaults/beverages/beers/600ml/corona_600ml.webp",
    "serramalte": f"{new_domain}/defaults/beverages/beers/600ml/serramalte_600ml.webp"
}

try:
    conn = mysql.connector.connect(user=user, password=password, host=host, port=port, database=database)
    cursor = conn.cursor(dictionary=True)
    
    # Buscar estabelecimentos para ver o ID do Julinho
    cursor.execute("SELECT id, name FROM establishments WHERE name LIKE '%Julinho%'")
    estabs = cursor.fetchall()
    print("Estabelecimentos encontrados:", estabs)
    
    # Listar itens de menu de cervejas 600ml ou similares
    cursor.execute("SELECT id, establishmentId, name, imageUrl FROM menu_items WHERE name LIKE '%600%' OR name LIKE '%Spaten%' OR name LIKE '%Heineken%' OR name LIKE '%Amstel%'")
    items = cursor.fetchall()
    print(f"\nItens encontrados ({len(items)}):")
    for item in items:
        print(f"ID: {item['id']} | Estab: {item['establishmentId']} | Nome: {item['name']} | Imagem atual: {item['imageUrl']}")
        
    # Atualizar cada item baseado no nome
    for key, url in mapping.items():
        cursor.execute("""
            UPDATE menu_items 
            SET imageUrl = %s 
            WHERE LOWER(name) LIKE %s 
            AND (LOWER(name) LIKE '%600%' OR LOWER(name) LIKE '%garrafa%' OR LOWER(name) LIKE '%ml%')
        """, (url, f"%{key}%"))
        conn.commit()
        if cursor.rowcount > 0:
            print(f"Atualizados {cursor.rowcount} itens para a marca {key} com URL {url}")
            
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Erro: {e}")
