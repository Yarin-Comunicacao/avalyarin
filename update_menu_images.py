import mysql.connector
import re

# Credenciais extraídas do .env
db_url = "mysql://3o1KcwvkeAxCR1d.root:VZJWyUmn9hTODT1L@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/avalyarin"
match = re.match(r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', db_url)
user, password, host, port, database = match.groups()

# Mapeamento de termos para URLs
mapping = {
    "Spaten": "https://avalyarin-assets.34bf9a273161d88cd7a18b69b4bd3e35.r2.cloudflarestorage.com/defaults/beverages/beers/600ml/spaten_600ml.jpg",
    "Heineken": "https://avalyarin-assets.34bf9a273161d88cd7a18b69b4bd3e35.r2.cloudflarestorage.com/defaults/beverages/beers/600ml/heineken_600ml.jpg",
    "Amstel": "https://avalyarin-assets.34bf9a273161d88cd7a18b69b4bd3e35.r2.cloudflarestorage.com/defaults/beverages/beers/600ml/amstel_600ml.jpg",
    "Original": "https://avalyarin-assets.34bf9a273161d88cd7a18b69b4bd3e35.r2.cloudflarestorage.com/defaults/beverages/beers/600ml/original_600ml.jpg",
    "Brahma": "https://avalyarin-assets.34bf9a273161d88cd7a18b69b4bd3e35.r2.cloudflarestorage.com/defaults/beverages/beers/600ml/brahma_600ml.jpg",
    "Corona": "https://avalyarin-assets.34bf9a273161d88cd7a18b69b4bd3e35.r2.cloudflarestorage.com/defaults/beverages/beers/600ml/corona_600ml.webp",
    "Serramalte": "https://avalyarin-assets.34bf9a273161d88cd7a18b69b4bd3e35.r2.cloudflarestorage.com/defaults/beverages/beers/600ml/serramalte_600ml.webp"
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
    
    for brand, url in mapping.items():
        # Atualizar itens que contenham a marca e 600ml, e que ainda não tenham imagem ou tenham imagem vazia
        query = """
            UPDATE menu_items 
            SET imageUrl = %s 
            WHERE (name LIKE %s) 
            AND (name LIKE '%600%' OR name LIKE '%600ml%' OR name LIKE '%600 ml%')
            AND (imageUrl IS NULL OR imageUrl = '' OR imageUrl LIKE 'http://localhost%')
        """
        like_pattern = f"%{brand}%"
        cursor.execute(query, (url, like_pattern))
        conn.commit()
        
        updated = cursor.rowcount
        total_updated += updated
        print(f"Marca {brand}: {updated} itens atualizados.")
        
    print(f"\nTotal de itens atualizados: {total_updated}")
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Erro: {e}")
