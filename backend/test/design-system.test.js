import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const projectFile = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const flatDesignFiles = [
  'frontend/styles.css',
  'frontend/pages.css',
  'frontend/chat.css',
  'admin/styles.css',
  'frontend/public/assets/laptop.svg',
  'frontend/public/assets/phone.svg',
  'frontend/public/assets/pixel.svg',
  'frontend/public/assets/nothing.svg',
  'admin/public/assets/laptop.svg',
  'admin/public/assets/phone.svg',
  'admin/public/assets/pixel.svg',
  'admin/public/assets/nothing.svg',
];

function luminance(hex) {
  const channels = [1, 3, 5]
    .map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('public and CMS styles use flat fills without gradients or shadows', () => {
  for (const path of flatDesignFiles) {
    const source = projectFile(path);
    assert.doesNotMatch(
      source,
      /gradient|box-shadow|drop-shadow|feDropShadow|text-shadow|backdrop-filter/i,
      path,
    );
  }
});

test('the project does not depend on Lucide or React icon packages', () => {
  const dependencies = projectFile('package-lock.json');
  assert.doesNotMatch(dependencies, /lucide(?:-react)?|react-icons|fontawesome/i);
});

test('core text and interactive boundary colors meet WCAG AA contrast', () => {
  const textPairs = [
    ['#626d7d', '#ffffff'],
    ['#626d7d', '#f7f8fa'],
    ['#626d7d', '#edf3ff'],
    ['#9ba9bd', '#101e32'],
    ['#78a6ff', '#101e32'],
    ['#ffffff', '#1357d6'],
  ];
  for (const [foreground, background] of textPairs)
    assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background}`);
  const boundaryPairs = [
    ['#7f8b9c', '#ffffff'],
    ['#7f8b9c', '#f7f8fa'],
    ['#6a798f', '#101e32'],
    ['#6a798f', '#172e54'],
  ];
  for (const [boundary, background] of boundaryPairs)
    assert.ok(contrast(boundary, background) >= 3, `${boundary} on ${background}`);
});
