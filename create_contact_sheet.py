import os
from PIL import Image, ImageDraw, ImageFont

def create_contact_sheet(image_dir, output_file, images_per_row=5):
    images = [f for f in os.listdir(image_dir) if f.endswith(('.jpg', '.png'))]
    if not images:
        print("Nenhuma imagem encontrada.")
        return

    thumb_size = (200, 200)
    rows = (len(images) + images_per_row - 1) // images_per_row
    sheet_width = images_per_row * thumb_size[0]
    sheet_height = rows * (thumb_size[1] + 30)
    
    sheet = Image.new('RGB', (sheet_width, sheet_height), (255, 255, 255))
    draw = ImageDraw.Draw(sheet)
    
    for i, img_name in enumerate(images):
        img_path = os.path.join(image_dir, img_name)
        try:
            with Image.open(img_path) as img:
                img.thumbnail(thumb_size)
                x = (i % images_per_row) * thumb_size[0]
                y = (i // images_per_row) * (thumb_size[1] + 30)
                sheet.paste(img, (x, y))
                draw.text((x + 5, y + thumb_size[1] + 5), img_name, fill=(0, 0, 0))
        except Exception as e:
            print(f"Erro ao processar {img_name}: {e}")

    sheet.save(output_file)
    print(f"Folha de contato salva em {output_file}")

if __name__ == "__main__":
    create_contact_sheet('/home/ubuntu/upload/search_images', '/home/ubuntu/avalyarin/contact_sheet.jpg')
