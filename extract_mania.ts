import { categories } from "./server/lib/data_source";

function extract() {
  const slug = "bar-do-juarez-moema";
  for (const cat of categories) {
    const found = cat.establishments?.find((e: any) => e.id === slug);
    if (found) {
      console.log(JSON.stringify(found, null, 2));
      return;
    }
  }
}

extract();
