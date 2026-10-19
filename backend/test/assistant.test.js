import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAiMessages,
  parseAiPayload,
  productForAi,
  resolveAiProducts,
} from '../src/assistant.js';
import { assistantRequestSchema } from '../src/schemas.js';

const phoneA = {
  id: 'phone-a',
  brand: 'Example',
  name: 'A',
  type: 'Smartphones',
  variant: '8GB / 128GB',
  image: 'secret-image-data',
  display: '6.5-inch 120Hz AMOLED',
  processor: 'Example 8',
  battery: '5000mAh',
  memory: '8GB',
  storage: '128GB',
  camera: '50MP main',
  price: 49999,
  priceStatus: 'verified',
  priceSource: 'https://retailer.example/private-affiliate-link',
  priceCheckedAt: '2026-10-01',
  availability: 'in-stock',
  note: 'Internal note',
  description: 'Long description',
  review: 'Editorial review',
  reviewBlocks: [{ type: 'text', text: 'Detailed review block' }],
  variants: [{
    label: '12GB / 256GB',
    price: 55999,
    priceStatus: 'unverified',
    priceSource: 'https://retailer.example/variant',
    priceCheckedAt: '',
    availability: 'unverified',
  }],
};
const phoneB = { ...phoneA, id: 'phone-b', name: 'B', price: 52999 };

test('AI product context contains only the explicit public allowlist', () => {
  const safe = productForAi(phoneA);
  assert.deepEqual(Object.keys(safe), [
    'id', 'brand', 'name', 'type', 'variant', 'display', 'processor', 'battery', 'memory',
    'storage', 'camera', 'price', 'currency', 'priceStatus', 'priceCheckedAt', 'availability',
    'variants',
  ]);
  assert.equal(JSON.stringify(safe).includes('retailer.example'), false);
  assert.equal(JSON.stringify(safe).includes('Editorial review'), false);
  assert.equal(safe.currency, 'NPR');
  assert.equal(safe.variants[0].currency, 'NPR');
});

test('AI messages disable unsupported access and bound conversation history', () => {
  const history = Array.from({ length: 12 }, (_, index) => ({
    role: index % 2 ? 'assistant' : 'user',
    content: `message ${index}`,
  }));
  const messages = buildAiMessages('Compare them', history, [phoneA, phoneB]);
  assert.equal(messages.length, 10);
  assert.match(messages[0].content, /Web search, tools, functions, and access to Tekkatha systems are unavailable/);
  assert.match(messages[0].content, /Do not call camera quality, battery life, performance, or an overall product better or superior/);
  assert.equal(messages[0].content.includes(phoneA.priceSource), false);
  assert.equal(messages.at(-1).content, 'Compare them');
});

test('AI output accepts JSON fences and rejects invented product IDs', () => {
  const payload = parseAiPayload('```json\n{"message":"A is cheaper.","productIds":["phone-a","invented"],"comparisonIds":["phone-a","phone-b"]}\n```');
  const resolved = resolveAiProducts(payload, [phoneA, phoneB], { products: [phoneA, phoneB] });
  assert.deepEqual(resolved.products.map((product) => product.id), ['phone-a']);
  assert.deepEqual(resolved.comparison.map((product) => product.id), ['phone-a', 'phone-b']);
});

test('assistant requests reject oversized history and unknown fields', () => {
  assert.equal(assistantRequestSchema.safeParse({ question: 'Hello' }).success, true);
  assert.equal(assistantRequestSchema.safeParse({
    question: 'Hello',
    history: Array.from({ length: 9 }, () => ({ role: 'user', content: 'x' })),
  }).success, false);
  assert.equal(assistantRequestSchema.safeParse({ question: 'Hello', databaseQuery: {} }).success, false);
});
