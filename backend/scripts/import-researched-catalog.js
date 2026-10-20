import { connect, client } from '../src/db.js';
import { config } from '../src/config.js';
import { articleSchema, productSchema, slug } from '../src/schemas.js';
import { articles, products } from './researched-catalog-data.js';

const apply = process.argv.includes('--apply');
const checkedProducts = products.map((value) => ({
  ...productSchema.parse(value),
  id: slug(value.brand + ' ' + value.name),
}));
const checkedArticles = articles.map((value) => ({
  ...articleSchema.parse(value),
  id: slug(value.title),
}));
const productIds = new Set(checkedProducts.map((product) => product.id));
for (const article of checkedArticles) {
  const missing = article.productIds.filter((id) => !productIds.has(id));
  if (missing.length) throw new Error(`${article.title} references unknown products: ${missing.join(', ')}`);
}
if (checkedProducts.some((product) => product.priceSource || product.source || product.variants.some((variant) => variant.priceSource)))
  throw new Error('Purchase and retailer URLs must remain blank in this import.');

const categoryCounts = checkedProducts.reduce((counts, product) => {
  counts[product.type] = (counts[product.type] || 0) + 1;
  return counts;
}, {});
console.log(`Validated ${checkedProducts.length} products and ${checkedArticles.length} articles.`);
console.log('Products by category:', JSON.stringify(categoryCounts));
console.log('Purchase URLs attached: 0');
if (!apply) {
  console.log('Dry run only. Pass --apply to insert missing records into MongoDB.');
  process.exit(0);
}

const authority = config.mongoUri.match(/^mongodb(?:\+srv)?:\/\/(?:[^@/?]*@)?([^/?]+)/i)?.[1] || '';
const targetHosts = authority.split(',').map((entry) => entry.replace(/^\[|\]$/g, '').split(':')[0].toLowerCase());
if (!targetHosts.length || !targetHosts[0] || targetHosts.some((host) => ['localhost', '127.0.0.1', '::1'].includes(host)))
  throw new Error('Refusing to import into localhost. Set MONGODB_URI to the managed MongoDB database.');

try {
  const database = await connect();
  const timestamp = new Date();
  const productOps = checkedProducts.map((record) => ({
    updateOne: {
      filter: { id: record.id },
      update: { $setOnInsert: { ...record, createdAt: timestamp, updatedAt: timestamp, deletedAt: null } },
      upsert: true,
    },
  }));
  const productResult = await database.collection('products').bulkWrite(productOps, { ordered: true });
  const articleOps = checkedArticles.map((record) => ({
    updateOne: {
      filter: { id: record.id },
      update: {
        $setOnInsert: {
          ...record,
          createdAt: timestamp,
          updatedAt: timestamp,
          publishedAt: timestamp,
          deletedAt: null,
        },
      },
      upsert: true,
    },
  }));
  const articleResult = await database.collection('articles').bulkWrite(articleOps, { ordered: true });
  const liveProductCount = await database.collection('products').countDocuments({ deletedAt: null });
  const publishedArticleCount = await database.collection('articles').countDocuments({ status: 'published', deletedAt: null });
  console.log(JSON.stringify({
    insertedProducts: productResult.upsertedCount,
    existingProductsKept: productResult.matchedCount,
    insertedArticles: articleResult.upsertedCount,
    existingArticlesKept: articleResult.matchedCount,
    liveProductCount,
    publishedArticleCount,
  }, null, 2));
} finally {
  await client.close();
}
