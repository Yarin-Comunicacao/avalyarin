import mysql from "mysql2/promise";

async function main() {
  const DATABASE_URL = "mysql://4LUtXE4vPqQU3CD.root:sCS5ECjAEZ66Z5MzGo25@gateway06.us-east-1.prod.aws.tidbcloud.com:4000/WG3U3sVg2ZrW6m8T99FRdE";
  
  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
    ssl: { rejectUnauthorized: true }
  });
  
  console.log("Restoring Soul Hops Berrini menu...");
  
  const [rows] = await connection.execute("SELECT id FROM establishments WHERE slug = ?", ["soul-hops-berrini"]);
  if (rows.length === 0) {
    console.error("Soul Hops Berrini not found in DB");
    process.exit(1);
  }
  const establishmentId = rows[0].id;

  const menuItems = [
    { name: "Pilsen Soul Hops", description: "Clássica Pilsen, leve e refrescante.", price: 14.00, category: "Chope" },
    { name: "IPA Soul Hops", description: "India Pale Ale com lúpulos americanos, notas cítricas e amargor equilibrado.", price: 18.00, category: "Chope" },
    { name: "Weiss Soul Hops", description: "Cerveja de trigo com notas de cravo e banana.", price: 16.00, category: "Chope" },
    { name: "Burger Soul", description: "Pão brioche, blend 160g, queijo prato, alface, tomate e maionese da casa.", price: 32.00, category: "Burger" },
    { name: "Soul Bacon", description: "Pão brioche, blend 160g, queijo cheddar, muito bacon crocante e maionese defumada.", price: 36.00, category: "Burger" },
    { name: "Batata Soul", description: "Porção de batatas fritas crocantes com tempero especial.", price: 22.00, category: "Petisco" },
    { name: "Coxinha de Costela", description: "6 unidades de coxinha recheada com costela desfiada e cream cheese.", price: 28.00, category: "Petisco" }
  ];

  for (let i = 0; i < menuItems.length; i++) {
    const item = menuItems[i];
    const code = `mi_sh_${i}`;
    await connection.execute(
      "INSERT IGNORE INTO menu_items (establishmentId, name, description, price, category, code) VALUES (?, ?, ?, ?, ?, ?)",
      [establishmentId, item.name, item.description, item.price, item.category, code]
    );
  }

  // Categories
  const categories = ["Chope", "Burger", "Petisco"];
  for (let i = 0; i < categories.length; i++) {
    await connection.execute(
      "INSERT IGNORE INTO menu_categories (establishmentId, name, sortOrder) VALUES (?, ?, ?)",
      [establishmentId, categories[i], i]
    );
  }

  console.log("✅ Soul Hops menu restored!");
  await connection.end();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
