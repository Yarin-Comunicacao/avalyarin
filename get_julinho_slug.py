import mysql.connector
import re

db_url = "mysql://3o1KcwvkeAxCR1d.root:VZJWyUmn9hTODT1L@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/avalyarin"
match = re.match(r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', db_url)
user, password, host, port, database = match.groups()
conn = mysql.connector.connect(user=user, password=password, host=host, port=port, database=database)
cursor = conn.cursor(dictionary=True)
cursor.execute("SELECT id, name, slug, address FROM establishments WHERE name LIKE '%Julinho%'")
for row in cursor.fetchall():
    print(row)
cursor.close()
conn.close()
