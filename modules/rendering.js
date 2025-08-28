/**
 * Rendering helpers will gradually move here.
 * Currently provides basic map layer drawing.
 */

/**
 * Draw pre-rendered floor and wall layers using camera offsets.
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement} floorLayer
 * @param {HTMLCanvasElement} wallLayer
 * @param {number} camX
 * @param {number} camY
 */
export function renderLayers(ctx, floorLayer, wallLayer, camX, camY) {
  ctx.drawImage(floorLayer, -camX, -camY);
  ctx.drawImage(wallLayer, -camX, -camY);
}
