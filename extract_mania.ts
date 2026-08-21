import { categories } from "./server/lib/data_source";

function extract() {
  const ids = [];
  for (const cat of categories) {
    if (cat.establishments) {
      for (const est of cat.establishments) {
        ids.push({ id: est.id, name: est.name });
      }
    }
  }
  console.log(JSON.stringify(ids, null, 2));
}

extract();
