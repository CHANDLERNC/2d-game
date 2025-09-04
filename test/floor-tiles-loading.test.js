import test from 'node:test';
import assert from 'node:assert/strict';

test('loadFloorTileSet falls back when image fails to load', async () => {
  globalThis.window = {};
  globalThis.__noGenSprites = true;
  globalThis.document = {
    createElement(tag) {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext() {
            return {
              imageSmoothingEnabled: false,
              drawImage() {},
              fillStyle: '',
              strokeStyle: '',
              lineWidth: 0,
              fillRect() {},
              strokeRect() {},
              clearRect() {}
            };
          }
        };
      }
      return {};
    }
  };
  class FakeImage {
    set onload(fn) { this._onload = fn; }
    set onerror(fn) { this._onerror = fn; }
    set src(value) {
      if (this._onerror) this._onerror(new Error('fail'));
    }
  }
  globalThis.Image = FakeImage;

  await import('../assets/sprites.js');

  assert.equal(globalThis.__floorTileQueue.length, 5);
  assert.equal(Object.keys(globalThis.ASSETS.textures.floorTileSets).length, 5);

  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.Image;
});
