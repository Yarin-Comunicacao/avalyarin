#!/bin/bash
# Remove AppMenu import and usage from all pages

cd /home/ubuntu/avalia-bar/client/src/pages

for file in *.tsx; do
  # Remove import line for AppMenu
  sed -i '/^import AppMenu from/d' "$file"
  
  # Remove <AppMenu ... /> component usage (single line)
  sed -i '/<AppMenu[^>]*\/>/d' "$file"
  
  # Remove menuOpen state
  sed -i '/const \[menuOpen, setMenuOpen\] = useState(false);/d' "$file"
  
  # Remove onMenuOpen prop from Navbar
  sed -i 's/onMenuOpen={() => setMenuOpen(true)}//g' "$file"
done

echo "Done removing AppMenu from all pages"
