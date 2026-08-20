import mysql.connector
import re

db_url = "mysql://3o1KcwvkeAxCR1d.root:VZJWyUmn9hTODT1L@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/avalyarin"
match = re.match(r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', db_url)
user, password, host, port, database = match.groups()

# Domínio público correto do R2 (r2.dev)
old_domain = "https://avalyarin-assets.34bf9a273161d88cd7a18b69b4bd3e35.r2.cloudflarestorage.com"
new_domain = "https://pub-bb18166d5e144b6ab0d3eaec567317d1.r2.dev"

mapping = {
    "Spaten": f"{new_domain}/defaults/beverages/beers/600ml/spaten_600ml.jpg",
    "Heineken": f"{new_domain}/defaults/beverages/beers/600ml/heineken_600ml.jpg",
    "Amstel": f"{new_domain}/defaults/beverages/beers/600ml/amstel_600ml.jpg",
    "Original": f"{new_domain}/defaults/beverages/beers/600ml/original_600ml.jpg",
    "Brahma": f"{new_domain}/defaults/beverages/beers/600ml/brahma_600ml.jpg",
    "Corona": f"{new_domain}/defaults/beverages/beers/600ml/corona_600ml.webp",
    "Serramalte": f"{new_domain}/defaults/beverages/beers/600ml/serramalte_600ml.webp"
}

try:
    conn = mysql.connector.connect(
        user=user,
        password=password,
        host=host,
        port=port,
        database=database
    )
    cursor = conn.cursor()
    
    total_updated = 0
    
    # 1. Atualizar por correspondência exata de domínio antigo se houver
    cursor.execute("UPDATE menu_items SET imageUrl = REPLACE(imageUrl, %s, %s) WHERE imageUrl LIKE %s", (old_domain, new_domain, f"%{old_domain}%"))
    conn.commit()
    print(f"URLs com domínio antigo atualizadas: {cursor.rowcount}")

    # 2. Aplicar mapeamento por marca nas cervejas 600ml
    for brand, url in mapping.items():
        query = """
            UPDATE menu_items 
            SET imageUrl = %s 
            WHERE (name LIKE %s) 
            AND (name LIKE '%600%' OR name LIKE '%600ml%' OR name LIKE '%600 ml%')
        """
        like_pattern = f"%{brand}%"
        cursor.execute(query, (url, like_pattern))
        conn.commit()
        updated = cursor.rowcount
        total_updated += updated
        print(f"Marca {brand}: {updated} itens atualizados com URL pública r2.dev.")
        
    print(f"\nAtualização concluída com sucesso.")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Erro: {e}")
