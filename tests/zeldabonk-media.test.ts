import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { gameHeroes, gameRealms, gameScreens } from '../lib/zeldabonk-media.ts';

test('ZeldaBonk showcases all eight maps and eleven named heroes with unique real assets', () => {
  assert.equal(gameRealms.length, 8); assert.equal(gameHeroes.length, 11);
  assert.equal(new Set(gameRealms.map(realm => realm.id)).size, 8);
  assert.equal(new Set(gameHeroes.map(hero => hero.id)).size, 11);
  for (const item of [...gameScreens, ...gameRealms, ...gameHeroes]) {
    assert.ok(item.alt && item.caption && item.title);
    assert.ok(item.src.startsWith('/images/projects/zeldabonk/'));
    assert.ok(existsSync(new URL(`../public${item.src}`, import.meta.url)), item.src);
  }
});

test('game captures preserve their real viewport and character PNGs retain transparency', async () => {
  for (const item of [...gameScreens, ...gameRealms]) {
    const image = await sharp(fileURLToPath(new URL(`../public${item.src}`, import.meta.url))).metadata();
    assert.equal(image.width, 657); assert.equal(image.height, 559);
  }
  for (const hero of gameHeroes) {
    const image = await sharp(fileURLToPath(new URL(`../public${hero.src}`, import.meta.url))).metadata();
    assert.equal(image.format, 'png'); assert.equal(image.width, 112); assert.equal(image.height, 112); assert.equal(image.hasAlpha, true);
  }
});

test('every hero has an eight-frame transparent game walk sheet', async () => {
  for (const hero of gameHeroes) {
    const sheet = sharp(fileURLToPath(new URL(`../public/images/projects/zeldabonk/character-${hero.id}-walk.png`, import.meta.url)));
    const info = await sheet.metadata();
    assert.equal(info.width, 896); assert.equal(info.height, 112); assert.equal(info.hasAlpha, true);
    const frames = await Promise.all(Array.from({length: 8}, (_, index) => sheet.clone().extract({left:index*112,top:0,width:112,height:112}).raw().toBuffer()));
    assert.ok(frames.some(frame => !frame.equals(frames[0])), hero.id + ' walk frames must change');
  }
});
