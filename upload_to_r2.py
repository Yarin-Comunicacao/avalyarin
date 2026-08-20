import boto3
import os

# Credenciais extraídas do .env
R2_ACCESS_KEY_ID = "18cf5db233fd7a255409a2e12f59ff3c"
R2_SECRET_ACCESS_KEY = "16e513949a299db7eee2afe87594f6937e13eff5904a315a4018f8e60ca2df8f"
R2_BUCKET_NAME = "avalyarin-assets"
R2_ACCOUNT_ID = "34bf9a273161d88cd7a18b69b4bd3e35"

s3 = boto3.client(
    's3',
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    region_name='auto'
)

def upload_files(source_dir, target_prefix):
    uploaded_urls = []
    for filename in os.listdir(source_dir):
        if filename.endswith(('.jpg', '.png', '.webp')):
            file_path = os.path.join(source_dir, filename)
            key = f"{target_prefix}/{filename}"
            try:
                content_type = 'image/jpeg'
                if filename.endswith('.png'): content_type = 'image/png'
                elif filename.endswith('.webp'): content_type = 'image/webp'
                
                s3.upload_file(file_path, R2_BUCKET_NAME, key, ExtraArgs={'ContentType': content_type})
                # A URL pública do R2 geralmente segue o padrão do domínio customizado ou o endpoint público se habilitado.
                # Como não temos o domínio customizado aqui, usaremos o formato de referência para o usuário.
                url = f"https://{R2_BUCKET_NAME}.{R2_ACCOUNT_ID}.r2.cloudflarestorage.com/{key}"
                uploaded_urls.append({"name": filename, "url": url, "key": key})
                print(f"Sucesso: {filename} enviado para {key}")
            except Exception as e:
                print(f"Erro ao enviar {filename}: {e}")
    return uploaded_urls

if __name__ == "__main__":
    results = upload_files('/home/ubuntu/avalyarin/r2_upload_600ml', 'defaults/beverages/beers/600ml')
    print("\nResumo do Upload:")
    for res in results:
        print(f"- {res['name']}: {res['url']}")
