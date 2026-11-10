#!/usr/bin/env node
/**
 * dsh-compactui — 宿主侧（空壳）。
 *
 * 这个插件所有改动都发生在浏览器端：client.js 通过 window.__ModuleLoader__ 加载，
 * 往侧栏注入样式和少量代理控件。宿主侧必须导出一个 cordis 插件（function 或带 apply 的对象），
 * 否则会被判定为 invalid plugin 而整个 bundle 加载失败，所以这里保留一个空的 apply。
 */
export const name = 'compactui';

export function apply() {}
