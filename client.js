window.__ModuleLoader__.load({
	id: 'dsh-compactui',
	factory: function (require) {
		var module = { exports: {} };
		var exports = module.exports;

		var PLUGIN_ID = 'dsh-compactui';
		var STYLE_ID = PLUGIN_ID + ':style';
		var ATTR = 'data-dsh-compactui';
		/* 置顶列表持久化：折叠项目会把会话行从 DOM 卸载，仅靠扫描会丢条目 */
		var STORE_KEY = 'dsh-compactui:pinned';
		var PROMOTE_KEY = 'dsh-compactui:promoted';

		/* 宿主 class 带构建期哈希，全部按稳定局部片段匹配 */
		var S = {
			root: 'div:has(> nav[class*="_panelList"])',
			logo: '[class*="_logoRow"]',
			nav: 'nav[class*="_panelList"]',
			panelRow: '[class*="_panelRow"]',
			foot: '[class*="_footArea"]',
			region: '[class*="_regionArea"]',
			sessionRow: '[class*="_sessionRow"]',
			searchBtn: 'button[aria-label="搜索会话"]',
		};

		var CSS = [
			/* 顶部品牌行：大鲸鱼 + 右侧工具 */
			'[class*="_logoRow"]{',
			'height:56px!important;',
			'display:flex!important;',
			'align-items:center!important;',
			'gap:8px!important;',
			'padding:0 4px!important;',
			'margin:0!important;',
			'}',
			/* 宿主在 brand 之后还会重挂载节点，DOM 顺序不可信：用 order 固定「品牌在左、按钮在右」 */
			'[class*="_logoRow"]>[class*="_brand"]{order:0!important;}',
			/* macOS 的 topStrip 是给窗口红绿灯预留的 52px 空带，压到 30px 并把品牌行贴上去，Windows 不受影响 */
			'html[data-platform="darwin"] [class*="_topStrip"]{height:36px!important;padding:0 12px 0!important;}',
			'html[data-platform="darwin"] [class*="_logoRow"]{height:38px!important;margin-top:0!important;}',
			/* 宿主折叠态行高 36px、无内边距，不要被上面的 56px 顶开 */
			'html[data-platform="darwin"] [class*="_collapsed"] [class*="_logoRow"]{height:36px!important;margin-top:0!important;padding:0!important;}',
			'[class*="_logoRow"] [class*="_brandIdentity"]{transform:none!important;}',
			'[class*="_logoRow"] [class*="_brandMark"] svg{width:26px!important;height:26px!important;}',
			'[class*="_logoRow"] [class*="_brandName"]{',
			'font-size:16px!important;font-weight:600!important;letter-spacing:.2px!important;',
			'}',
			/* 品牌行右侧工具条 */
			'.cs-topbar{order:1;flex:none;margin-left:auto;display:flex;align-items:center;gap:2px;-webkit-app-region:no-drag;}',
			'.cs-iconbtn{',
			'width:28px;height:28px;border:0;background:transparent;border-radius:6px;',
			'display:inline-flex;align-items:center;justify-content:center;cursor:pointer;',
			'color:var(--dsw-alias-label-secondary,#6b7280);',
			'}',
			'.cs-iconbtn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06));}',
			/* 新聊天按钮：贴左、细一点 */
			'button[class*="_newSession"]{',
			'height:34px!important;margin-top:6px!important;border-radius:8px!important;',
			'justify-content:flex-start!important;padding-left:12px!important;',
			'}',
			/* 宿主自带的面板导航整行隐藏（改由底部浮层提供） */
			'nav[class*="_panelList"]{display:none!important;}',
			/* 置顶区 */
			'.cs-pinned{margin:2px 0 6px;}',
			'.cs-pinned-head{',
			'display:flex;align-items:center;gap:6px;width:100%;border:0;background:transparent;',
			'font-size:12px;color:var(--dsw-alias-label-secondary,#6b7280);cursor:pointer;',
			'padding:4px 6px;border-radius:6px;font-weight:600;letter-spacing:.2px;',
			'}',
			'.cs-pinned-head:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05));}',
			'.cs-pinned-caret{display:inline-flex;align-items:center;}',
			'.cs-pinned-caret svg{width:14px;height:14px;transition:transform .15s ease;}',
			'.cs-pinned[data-collapsed="1"] .cs-pinned-caret svg{transform:rotate(-90deg);}',
			'.cs-pinned[data-collapsed="1"] .cs-pinned-body{display:none;}',
			'.cs-pinned-body{display:flex;flex-direction:column;gap:0;}',
			'.cs-pinned-row{display:flex;align-items:center;gap:2px;border-radius:6px;padding-right:2px;}',
			'.cs-pinned-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06));}',
			'.cs-pinned-item{',
			'flex:1;min-width:0;display:block;text-align:left;border:0;background:transparent;',
			'padding:4px 8px;border-radius:6px;font-size:13px;cursor:pointer;',
			'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
			'color:var(--dsw-alias-label-primary,#111);',
			'}',
			'.cs-unpin{',
			'width:22px;height:22px;border:0;background:transparent;border-radius:5px;',
			'display:inline-flex;align-items:center;justify-content:center;cursor:pointer;',
			'color:var(--dsw-alias-label-secondary,#6b7280);opacity:.5;transition:opacity .12s ease;',
			'}',
			'.cs-pinned-row:hover .cs-unpin{opacity:1;}',
			'.cs-unpin:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.10));}',
			/* 底部菜单浮层 */
			'.cs-nav-toggle{',
			'width:28px;height:28px;border:0;background:transparent;border-radius:6px;',
			'display:inline-flex;align-items:center;justify-content:center;cursor:pointer;',
			'color:var(--dsw-alias-label-secondary,#6b7280);',
			'}',
			'.cs-nav-toggle:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06));}',
			'.cs-navpop{',
			'position:fixed;z-index:9999;min-width:196px;padding:6px;-webkit-app-region:no-drag;',
			'border-radius:12px;background:var(--dsw-alias-bg-popover,#fff);',
			'box-shadow:0 0 0 1px rgba(0,0,0,.06);',
			'display:flex;flex-direction:column;gap:2px;',
			'}',
			'.cs-navpop[hidden]{display:none!important;}',
			/* 浮层打开时把顶部拖拽带临时改成可点：-webkit-app-region:drag 会吞掉鼠标事件，点它上面浮层关不掉 */
			'html:has(.cs-navpop:not([hidden])) [data-window-drag]{-webkit-app-region:no-drag!important;}',
			/* Windows 没有 data-window-drag，拖拽带挂在 frame 的 ::before 上，浮层开着时也要放行点击 */
			'html[data-windows-titlebar]:has(.cs-navpop:not([hidden])) [class*="_frame"]::before{-webkit-app-region:no-drag!important;}',
			'.cs-navitem{',
			'box-sizing:border-box;',
			'display:flex;align-items:center;gap:8px;width:100%;text-align:left;border:0;',
			'background:transparent;padding:7px 10px;border-radius:8px;font-size:13px;cursor:pointer;',
			'color:var(--dsw-alias-label-primary,#111);',
			'}',
			'.cs-navitem:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06));}',
			'.cs-navitem.is-active{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06));}',
			/* 内联搜索框（占用左侧 logo 位置） */
			'.cs-searchbox{',
			'flex:1;min-width:0;display:flex;align-items:center;gap:4px;height:30px;',
			'padding:0 6px 0 8px;border-radius:8px;',
			'background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06));',
			'}',
			'.cs-search-input{',
			'flex:1;min-width:0;border:0;outline:none;background:transparent;',
			'font-size:13px;color:var(--dsw-alias-label-primary,#111);',
			'}',
			'.cs-search-input::placeholder{color:var(--dsw-alias-label-tertiary,#9ca3af);}',
			'html[data-cs-search="1"] [class*="_logoRow"] [class*="_brand"]{display:none!important;}',
			'html[data-cs-search="1"] [class*="_logoRow"] .cs-topbar{display:none!important;}',
			'html[data-cs-search="1"] .cs-searchbox{margin-left:0;}',
			/* 从浮层「添加」回侧栏的常驻导航行 */
			'.cs-navlist{display:flex;flex-direction:column;gap:0;margin:4px 0 2px;}',
			'.cs-navrow{',
			'box-sizing:border-box;',
			'display:flex;align-items:center;gap:8px;width:100%;border:0;background:transparent;',
			'padding:5px 6px;border-radius:6px;font-size:13px;text-align:left;cursor:pointer;',
			'color:var(--dsw-alias-label-primary,#111);',
			'}',
			'.cs-navrow:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06));}',
			'.cs-navrow>svg{width:16px;height:16px;flex:none;color:var(--dsw-alias-label-secondary,#6b7280);}',
			'.cs-navrow-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
			'.cs-navrow-minus{',
			'width:20px;height:20px;border:0;background:transparent;border-radius:5px;',
			'display:inline-flex;align-items:center;justify-content:center;cursor:pointer;',
			'color:#e5484d;opacity:.55;transition:opacity .12s ease;',
			'}',
			'.cs-navrow:hover .cs-navrow-minus{opacity:1;}',
			'.cs-navrow-minus:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.10));}',
			/* 浮层条目右侧的「+」 */
			'.cs-navitem-add{',
			'margin-left:8px;margin-right:14px;flex:none;border:0;background:transparent;',
			'width:22px;height:22px;border-radius:6px;',
			'display:inline-flex;align-items:center;justify-content:center;cursor:pointer;',
			'color:#2f6fed;',
			'}',
			'.cs-navitem-add>svg{width:14px;height:14px;}',
			'.cs-navitem-add:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.10));}',
			'.cs-navitem-add[disabled]{opacity:.35;cursor:default;color:#9aa1ab;}',
			'.cs-navitem-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
			/* 宿主自带的二级菜单（例如「更多」）被挪到浮层下方：与浮层连成一整块 */
			'.cs-navpop.has-dock{',
			'border-bottom-left-radius:0!important;border-bottom-right-radius:0!important;',
			'}',
			'.cs-dockedmenu{',
			'position:fixed!important;z-index:9999!important;margin:0!important;box-sizing:border-box!important;',
			'padding:6px!important;border-radius:0 0 12px 12px!important;',
			'background:var(--dsw-alias-bg-popover,#fff)!important;',
			'box-shadow:none!important;',
			'overflow:visible!important;',
			'}',
			/* 宿主菜单有多层包裹（material/viewport/content/itemWrap），全部抹平，只留按钮本身 */
			'.cs-dockedmenu [class*="material"],.cs-dockedmenu [class*="viewport"],.cs-dockedmenu [class*="content"]{',
			'background:transparent!important;box-shadow:none!important;border:0!important;',
			'padding:0!important;margin:0!important;min-width:0!important;width:100%!important;',
			'}',
			'.cs-dockedmenu [class*="itemWrap"]{width:100%!important;margin:0!important;padding:0!important;}',
			'.cs-dockedmenu button{',
			'display:flex!important;align-items:center!important;gap:8px!important;',
			'width:100%!important;box-sizing:border-box!important;',
			'padding:7px 10px!important;margin:0!important;border:0!important;border-radius:8px!important;',
			'background:transparent;box-shadow:none!important;',
			'font-size:13px!important;line-height:20px!important;text-align:left!important;',
			'color:var(--dsw-alias-label-primary,#111)!important;cursor:pointer!important;',
			'}',
			'.cs-dockedmenu button:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06))!important;}',
			'.cs-dockedmenu svg{width:16px!important;height:16px!important;flex:none!important;color:var(--dsw-alias-label-secondary,#6b7280)!important;}',
			/* ---- 紧凑尺寸（原 dsh-compact-ui 合并进来）：只压间距与按钮，不动布局骨架 ---- */
			':root{--dsh-composer-stack-gap:4px!important;--dsh-chat-flow-gap:10px!important;--dsh-composer-dock-inset:6px!important;--dsh-tab-hit-inline:6px!important;--dsh-trajectory-toolbar-height:28px!important;}',
			'div:has(> nav[class*="_panelList"]){--dsh-sidebar-row-padding:8px!important;--dsh-sidebar-inline-padding:6px!important;--dsh-sidebar-label-gap:4px!important;padding:4px 6px!important;}',
			'nav[class*="_panelList"]{gap:1px!important;margin-bottom:4px!important;}',
			'[class*="_panelRow"]{min-height:28px!important;padding-top:3px!important;padding-bottom:3px!important;line-height:18px!important;border-radius:6px!important;}',
			'[class*="_projectRow"]{height:28px!important;}',
			'[class*="_sessionRow"]{height:26px!important;}',
			'[class*="_rowActions"]{height:16px!important;}',
			'button[class*="_md_"]{height:28px!important;}',
			'button[class*="_sm_"]{height:22px!important;padding-left:7px!important;padding-right:7px!important;font-size:11px!important;line-height:16px!important;border-radius:4px!important;}',
			'[class*="_card"]{padding-top:6px!important;}',
		].join('');

		function injectCSS() {
			if (document.getElementById(STYLE_ID) !== null) return;
			var style = document.createElement('style');
			style.id = STYLE_ID;
			style.textContent = CSS;
			document.head.appendChild(style);
			document.documentElement.setAttribute(ATTR, '1');
		}

		function el(tag, cls, text) {
			var node = document.createElement(tag);
			if (cls) node.className = cls;
			if (text != null) node.textContent = text;
			return node;
		}

		function icon(path) {
			var ns = 'http://www.w3.org/2000/svg';
			var svg = document.createElementNS(ns, 'svg');
			svg.setAttribute('viewBox', '0 0 24 24');
			svg.setAttribute('width', '16');
			svg.setAttribute('height', '16');
			svg.setAttribute('fill', 'none');
			svg.setAttribute('stroke', 'currentColor');
			svg.setAttribute('stroke-width', '1.7');
			svg.setAttribute('stroke-linecap', 'round');
			svg.setAttribute('stroke-linejoin', 'round');
			path.forEach(function (d) {
				var p = document.createElementNS(ns, 'path');
				p.setAttribute('d', d);
				svg.appendChild(p);
			});
			return svg;
		}

		var ICON_SEARCH = ['M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z', 'M20 20l-4.2-4.2'];
		var ICON_MENU = ['M4 7h16', 'M4 12h16', 'M4 17h16'];
		var ICON_CARET = ['M6 9l6 6 6-6'];
		var ICON_CLOSE = ['M6 6l12 12', 'M18 6L6 18'];
		var ICON_MINUS = ['M6 12h12'];
		var ICON_PLUS = ['M12 6v12', 'M6 12h12'];
		var ICON_CHECK = ['M5 12.5l4.5 4.5L19 7'];

		var state = {
			root: null,
			navPopover: null,
			searchBox: null,
			pinnedKey: '',
			promotedKey: '',
			dockedMenus: [],
			activeLabel: '',
		lastDockLabel: '',
		lastDockAt: 0,
			docking: false,
			dockUntil: 0,
			seeded: false,
			observer: null,
			frame: 0,
		};

		/* ---------- 内联搜索：占用左侧 logo 位置 ---------- */
		function applyFilter(query) {
			var q = (query || '').trim().toLowerCase();
			var rows = [].slice.call(document.querySelectorAll(S.sessionRow));
			rows.forEach(function (row) {
				if (row.closest('.cs-pinned') !== null) return;
				var hit = q === '' || rowTitle(row).toLowerCase().indexOf(q) >= 0;
				row.style.display = hit ? '' : 'none';
			});
			var pinned = [].slice.call(document.querySelectorAll('.cs-pinned-item'));
			pinned.forEach(function (item) {
				var hit = q === '' || (item.textContent || '').toLowerCase().indexOf(q) >= 0;
				item.parentNode.style.display = hit ? '' : 'none';
			});
		}

		function firstVisibleSession() {
			var rows = [].slice.call(document.querySelectorAll(S.sessionRow));
			for (var i = 0; i < rows.length; i++) {
				if (rows[i].style.display !== 'none') return rows[i];
			}
			return null;
		}

		function closeSearch() {
			var sb = state.searchBox;
			if (sb === null) return;
			sb.box.remove();
			state.searchBox = null;
			document.documentElement.removeAttribute('data-cs-search');
			applyFilter('');
		}

		function openSearch(logo) {
			if (state.searchBox !== null) {
				state.searchBox.input.focus();
				return;
			}
			var box = el('div', 'cs-searchbox');
			var input = el('input', 'cs-search-input');
			input.type = 'text';
			input.placeholder = '搜索会话';
			input.addEventListener('input', function () {
				applyFilter(input.value);
			});
			input.addEventListener('keydown', function (event) {
				if (event.key === 'Escape') {
					event.stopPropagation();
					closeSearch();
					return;
				}
				if (event.key === 'Enter') {
					var row = firstVisibleSession();
					closeSearch();
					if (row !== null) row.click();
				}
			});
			var close = el('button', 'cs-iconbtn cs-search-close');
			close.type = 'button';
			close.title = '退出搜索';
			close.setAttribute('aria-label', '退出搜索');
			close.appendChild(icon(ICON_CLOSE));
			close.addEventListener('click', closeSearch);
			box.appendChild(input);
			box.appendChild(close);
			logo.appendChild(box);
			document.documentElement.setAttribute('data-cs-search', '1');
			state.searchBox = { box: box, input: input };
			try {
				input.focus();
			} catch (error) {
				/* 忽略焦点异常 */
			}
		}

		/* 拖拽带里的按钮有时收不到 click（窗口拖拽区会吞事件），pointerdown 与 click 都挂上，400ms 内只算一次 */
		function bindToggleButton(button) {
			var last = 0;
			var fire = function (event) {
				event.preventDefault();
				event.stopPropagation();
				var now = Date.now();
				if (now - last < 400) return;
				last = now;
				toggleNavPopover(button);
			};
			button.addEventListener('pointerdown', fire);
			button.addEventListener('click', fire);
		}

		/* ---------- 顶部工具条：搜索 + 设置/菜单 ---------- */
		function ensureTopbar(logo) {
			var bar = logo.querySelector('.cs-topbar');
			if (bar === null) {
				bar = el('div', 'cs-topbar');

				var search = el('button', 'cs-iconbtn');
				search.type = 'button';
				search.title = '搜索会话';
				search.setAttribute('aria-label', '搜索会话');
				search.appendChild(icon(ICON_SEARCH));
				search.addEventListener('click', function (event) {
					event.stopPropagation();
					openSearch(logo);
				});

				var menu = el('button', 'cs-iconbtn cs-nav-toggle');
				menu.type = 'button';
				menu.title = '插件与工具';
				menu.setAttribute('aria-label', '插件与工具');
				menu.appendChild(icon(ICON_MENU));
				bindToggleButton(menu);

				bar.appendChild(search);
				bar.appendChild(menu);
				logo.appendChild(bar);
			}
			return bar;
		}

		/* 旧版底部菜单按钮：清掉，统一放在顶部搜索右侧 */
		function disposeFootMenu(root) {
			var foot = root.querySelector(S.foot);
			if (foot === null) return;
			var old = foot.querySelector('.cs-nav-toggle');
			if (old !== null) old.remove();
		}

		/* ---------- 导航：浮层 + 从浮层「添加」回侧栏的常驻行 ---------- */
		function ensureNavPopover() {
			if (state.navPopover !== null && state.navPopover.isConnected) return state.navPopover;
			var pop = el('div', 'cs-navpop');
			state.activeLabel = '';
			pop.hidden = true;
			document.body.appendChild(pop);
			state.navPopover = pop;
			return pop;
		}

		function loadPromoted() {
			try {
				var raw = localStorage.getItem(PROMOTE_KEY);
				var list = raw === null ? [] : JSON.parse(raw);
				if (!Array.isArray(list)) return [];
				return list.filter(function (item) {
					return typeof item === 'string' && item !== '';
				});
			} catch (error) {
				return [];
			}
		}

		function savePromoted(list) {
			try {
				localStorage.setItem(PROMOTE_KEY, JSON.stringify(list));
			} catch (error) {
				/* 存储失败就退化成当次有效 */
			}
		}

		function isPromoted(label) {
			return loadPromoted().indexOf(label) >= 0;
		}

		function promote(label) {
			var list = loadPromoted();
			if (list.indexOf(label) < 0) list.push(label);
			savePromoted(list);
		}

		function demote(label) {
			savePromoted(loadPromoted().filter(function (item) {
				return item !== label;
			}));
		}

		function navLabels() {
			var nav = document.querySelector(S.nav);
			if (nav === null) return [];
			return [].slice.call(nav.querySelectorAll(S.panelRow)).map(function (row) {
				return (row.innerText || '').trim();
			}).filter(function (label) {
				return label !== '';
			});
		}

		/* 点击任何一份克隆 → 交给宿主导航里那个活的原始行 */
		function clickNavLabel(label) {
			var live = [].slice.call(document.querySelectorAll(S.panelRow));
			for (var i = 0; i < live.length; i++) {
				if ((live[i].innerText || '').trim() === label) {
					live[i].click();
					return true;
				}
			}
			return false;
		}

		/* ---------- 宿主自带的二级菜单（如「更多」）：挪到浮层下方展开 ---------- */
		function bodyPopups() {
			var list = [];
			[].slice.call(document.body.children).forEach(function (node) {
				if (node === state.navPopover) return;
				var tag = node.tagName;
				if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'LINK' || tag === 'TEMPLATE') return;
				var rect = node.getBoundingClientRect();
				if (rect.width < 80 || rect.height < 18) return;
				if (rect.height > 520) return;
				var style = window.getComputedStyle(node);
				if (style.display === 'none' || style.visibility === 'hidden') return;
				list.push(node);
			});
			return list;
		}

		function dockPopup(node, itemRect, popRect, label) {
			state.lastDockLabel = label;
			state.lastDockAt = Date.now();
			if (itemRect === null) return;
			var joined = popRect !== null && popRect.width > 0;
			var left = joined ? popRect.left : itemRect.left;
			node.classList.add('cs-dockedmenu');
			node.dataset.csLabel = label;
			node.style.setProperty('position', 'fixed', 'important');
			node.style.setProperty('left', left + 'px', 'important');
			node.style.setProperty('top', (joined ? popRect.bottom : itemRect.bottom + 4) + 'px', 'important');
			node.style.setProperty('right', 'auto', 'important');
			node.style.setProperty('bottom', 'auto', 'important');
			if (joined) {
				node.style.setProperty('width', popRect.width + 'px', 'important');
				if (state.navPopover !== null) state.navPopover.classList.add('has-dock');
			}
			if (state.dockedMenus.indexOf(node) < 0) state.dockedMenus.push(node);
		}

		function closeDocked() {
			state.activeLabel = '';
			if (state.navPopover !== null) state.navPopover.classList.remove('has-dock');
			if (state.dockedMenus.length === 0) return;
			state.dockedMenus = [];
			try {
				var fire = function (type) {
					var ev = new MouseEvent(type, { bubbles: true });
					ev.__csSynthetic = true;
					document.body.dispatchEvent(ev);
				};
				fire('mousedown');
				fire('mouseup');
				fire('click');
			} catch (error) {
				/* 忽略 */
			}
		}

		/* 宿主二级菜单可能是「新建容器」也可能是「复用旧容器」，统一按 role=menuitem 反查最外层块 */
		function hostMenuBlocks() {
			var blocks = [];
			var items = document.querySelectorAll('[role="menuitem"]');
			[].slice.call(items).forEach(function (item) {
				if (state.navPopover !== null && state.navPopover.contains(item)) return;
				var node = item;
				while (node.parentElement !== null && node.parentElement !== document.body) {
					node = node.parentElement;
				}
				var rect = node.getBoundingClientRect();
				if (rect.width < 80 || rect.height < 18) return;
				if (blocks.indexOf(node) < 0) blocks.push(node);
			});
			return blocks;
		}

		/* 点浮层条目：宿主一旦插入二级菜单，立刻先藏起来，摆好位置再显示，避免闪一下 */
		function activateNavItem(item, label) {
			/* 这一条已经有二级菜单挂着：再点一次就是把它收回去 */
			var dockedSame = null;
			for (var qi = 0; qi < state.dockedMenus.length; qi++) {
				if (state.dockedMenus[qi].dataset.csLabel === label) {
					dockedSame = state.dockedMenus[qi];
					break;
				}
			}
			if (dockedSame === null && state.lastDockLabel === label) dockedSame = true;
			if (dockedSame !== null) {
				/* 收起二级菜单时先压住所有关闭路径，避免正在跑的 settle 顺手把浮层关掉 */
				state.dockUntil = Date.now() + 1200;
				state.docking = false;
				state.lastDockLabel = '';
				state.lastDockAt = 0;
				closeDocked();
				if (state.navPopover !== null) state.navPopover.hidden = false;
				return;
			}
			window.__csLastActivate = { label: label, docking: state.docking, dockUntil: state.dockUntil, t: Date.now() };
			var pop = state.navPopover;
			if (pop === null) return;
			if (state.docking) return;
			var sameDock = document.querySelector('.cs-dockedmenu[data-cs-label="' + label + '"]');
			if (sameDock !== null) {
				window.__csGuardHit = label;
				state.dockUntil = Date.now() + 900;
				state.activeLabel = '';
				closeDocked();
				if (pop !== null) pop.hidden = false;
				return;
			}
			var itemRect = item.getBoundingClientRect();
			var handled = [];
			state.docking = true;
				state.dockUntil = Date.now() + 700;
			var grab = function () {
				var added = hostMenuBlocks().filter(function (node) {
					return handled.indexOf(node) < 0;
				});
				added.forEach(function (node) {
					handled.push(node);
					node.style.setProperty('visibility', 'hidden', 'important');
				});
				if (added.length === 0) return false;
				state.docking = true;
				state.dockUntil = Date.now() + 700;
				window.requestAnimationFrame(function () {
					pop.hidden = false;
					var popRect = pop.getBoundingClientRect();
					handled.forEach(function (node) {
						dockPopup(node, itemRect, popRect, label);
						node.style.removeProperty('visibility');
					state.activeLabel = label;
					});
					window.setTimeout(function () {
						state.docking = false;
						if (state.dockedMenus.length > 0) keepNavPopoverShown();
					}, 140);
					var guard = window.setInterval(function () {
						if (state.dockedMenus.length === 0) {
							window.clearInterval(guard);
							return;
						}
						if (pop.hidden) keepNavPopoverShown();
					}, 40);
					window.setTimeout(function () {
						window.clearInterval(guard);
					}, 2000);
				});
				return true;
			};
			var observer = new MutationObserver(function () {
				grab();
			});
			observer.observe(document.body, { childList: true });
			clickNavLabel(label);
			var tries = 0;
			var settle = function () {
				if (grab()) {
					observer.disconnect();
					return;
				}
				tries += 1;
				if (tries < 20) {
					window.setTimeout(settle, 30);
					return;
				}
				observer.disconnect();
				state.docking = false;
				if (state.dockedMenus.length === 0) {
					state.activeLabel = '';
			pop.hidden = true;
					closeDocked();
				}
			};
			window.setTimeout(settle, 0);
		}

		function rebuildNav() {
			var pop = state.navPopover;
			if (pop === null) return;
			closeDocked();
			pop.textContent = '';
			var nav = document.querySelector(S.nav);
			if (nav === null) return;
			var rows = [].slice.call(nav.querySelectorAll(S.panelRow));
			rows.forEach(function (row) {
				var label = (row.innerText || '').trim();
				if (label === '') return;
				var item = el('div', 'cs-navitem');
				item.setAttribute('role', 'button');
				item.setAttribute('tabindex', '0');
				var glyph = row.querySelector('svg');
				if (glyph !== null) item.appendChild(glyph.cloneNode(true));
				item.appendChild(el('span', 'cs-navitem-label', label));
				if (row.getAttribute('aria-current') !== null || /Active/.test(row.className)) {
					item.classList.add('is-active');
				}
				item.addEventListener('click', function (event) {
					if (event.target.closest('.cs-navitem-add') !== null) return;
					event.preventDefault();
					event.stopPropagation();
					activateNavItem(item, label);
				});

				var pinned = isPromoted(label);
				var add = el('button', 'cs-navitem-add');
				add.type = 'button';
				add.title = pinned ? '已经在侧栏显示' : '添加到侧栏';
				add.setAttribute('aria-label', pinned ? '已经在侧栏显示' : '添加到侧栏');
				add.appendChild(icon(pinned ? ICON_CHECK : ICON_PLUS));
				if (pinned) add.disabled = true;
				add.addEventListener('click', function (event) {
					event.stopPropagation();
					promote(label);
					state.promotedKey = '';
					rebuildNav();
					try {
						ensurePromotedNav(state.root);
					} catch (error) {
						/* 忽略 */
					}
				});
				item.appendChild(add);
				pop.appendChild(item);
			});
		}

		/* 浮层是否"真的开着"：没被本插件定位过、或在视口外，都当作没开，否则点按钮会像没反应 */
		function popoverOnScreen(pop) {
			if (pop === null || pop.hidden) return false;
			if (pop.style.left === '' || pop.style.top === '') return false;
			var r = pop.getBoundingClientRect();
			if (r.width < 8 || r.height < 20) return false;
			return r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
		}

		function placeNavPopover(anchor) {
			var pop = ensureNavPopover();
			var rect = anchor.getBoundingClientRect();
			pop.hidden = false;
			var box = pop.getBoundingClientRect();
			var x = Math.max(8, rect.left);
			var y = rect.top - box.height - 8;
			if (y < 8) y = rect.bottom + 8;
			if (x + box.width > window.innerWidth - 8) x = window.innerWidth - box.width - 8;
			pop.style.left = x + 'px';
			pop.style.top = y + 'px';
			return pop;
		}

		function toggleNavPopover(anchor) {
			var pop = ensureNavPopover();
			if (pop.hidden === false && popoverOnScreen(pop)) {
				state.activeLabel = '';
			pop.hidden = true;
				closeDocked();
				return;
			}
			rebuildNav();
			placeNavPopover(anchor);
		}

		/* 宿主的二级菜单被挂到浮层下面时，浮层必须在位；旧的 hidden=false 会让浮层停在视口外 */
		function keepNavPopoverShown() {
			var pop = state.navPopover;
			if (pop === null) return;
			if (pop.hidden === false && pop.style.left !== '') return;
			var anchor = document.querySelector('.cs-nav-toggle');
			if (anchor !== null) {
				placeNavPopover(anchor);
				return;
			}
			pop.hidden = false;
		}

		/* 侧栏里「新会话」下方的常驻导航行（由浮层点「添加」而来） */
		function ensurePromotedNav(root) {
			if (root === null) return;
			var live = navLabels();
			var promoted = loadPromoted().filter(function (label) {
				return live.indexOf(label) >= 0;
			});
			var existing = root.querySelector('.cs-navlist');
			var key = promoted.join('\u0001');
			var settled = key === state.promotedKey && (promoted.length === 0 ? existing === null : existing !== null);
			if (settled) return;
			state.promotedKey = key;

			if (promoted.length === 0) {
				if (existing !== null) existing.remove();
				return;
			}

			var list = existing;
			if (list === null) {
				list = el('div', 'cs-navlist');
				var anchor = root.querySelector('button[class*="_newSession"]');
				if (anchor === null) anchor = root.querySelector('[class*="_newSession"]');
				if (anchor !== null && anchor.parentNode !== null) {
					anchor.parentNode.insertBefore(list, anchor.nextSibling);
				} else {
					root.insertBefore(list, root.firstChild);
				}
			}

			list.textContent = '';
			var nav = document.querySelector(S.nav);
			promoted.forEach(function (label) {
				var item = el('div', 'cs-navrow');
				item.setAttribute('role', 'button');
				item.setAttribute('tabindex', '0');
				item.title = label;
				var source = null;
				if (nav !== null) {
					var rows = [].slice.call(nav.querySelectorAll(S.panelRow));
					for (var i = 0; i < rows.length; i++) {
						if ((rows[i].innerText || '').trim() === label) {
							source = rows[i];
							break;
						}
					}
				}
				var glyph = source === null ? null : source.querySelector('svg');
				if (glyph !== null) item.appendChild(glyph.cloneNode(true));
				item.appendChild(el('span', 'cs-navrow-label', label));
				item.addEventListener('click', function (event) {
					if (event.target.closest('.cs-navrow-minus') !== null) return;
					clickNavLabel(label);
				});

				var minus = el('button', 'cs-navrow-minus');
				minus.type = 'button';
				minus.title = '收进菜单';
				minus.setAttribute('aria-label', '收进菜单');
				minus.appendChild(icon(ICON_MINUS));
				minus.addEventListener('click', function (event) {
					event.stopPropagation();
					demote(label);
					state.promotedKey = '';
					ensurePromotedNav(state.root);
					if (state.navPopover !== null && state.navPopover.hidden === false) rebuildNav();
				});
				item.appendChild(minus);
				list.appendChild(item);
			});
		}

		/* ---------- 置顶区：列表持久化，折叠项目也不会丢 ---------- */
		function isPinnedRow(row) {
			var label = row.getAttribute('aria-label') || '';
			if (label.indexOf('已置顶') >= 0) return true;
			if (row.querySelector('[aria-label="已置顶"]') !== null) return true;
			return false;
		}

		function rowTitle(row) {
			var label = row.getAttribute('aria-label') || '';
			var clean = label.replace(/已置顶|取消置顶|置顶会话/g, '').trim();
			if (clean !== '') return clean;
			return (row.innerText || '').trim().split('\n')[0] || '未命名会话';
		}

		function nodeText(node) {
			return ((node && node.innerText) || '').trim().split('\n')[0] || '';
		}

		function loadStore() {
			try {
				var raw = localStorage.getItem(STORE_KEY);
				var list = raw === null ? [] : JSON.parse(raw);
				if (!Array.isArray(list)) return [];
				return list.filter(function (item) {
					return item !== null && typeof item === 'object' && typeof item.t === 'string' && item.t !== '';
				});
			} catch (error) {
				return [];
			}
		}

		function saveStore(list) {
			try {
				localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(0, 100)));
			} catch (error) {
				/* 禁止 localStorage 时静默失败，功能降级为只扫 DOM */
			}
		}

		function storeKey(list) {
			return list.map(function (item) {
				return item.t + '\u0001' + (item.p || '');
			}).join('\u0002');
		}

		function liveRows(region) {
			return [].slice.call(region.querySelectorAll(S.sessionRow)).filter(function (row) {
				return row.closest('.cs-pinned') === null;
			});
		}

		function findLiveRow(title) {
			var rows = liveRows(state.root || document);
			for (var i = 0; i < rows.length; i++) {
				if (rowTitle(rows[i]) === title) return rows[i];
			}
			return null;
		}

		function findProjectRow(name) {
			var rows = [].slice.call(document.querySelectorAll('[class*="_projectRow"]'));
			for (var i = 0; i < rows.length; i++) {
				if (nodeText(rows[i]) === name) return rows[i];
			}
			return null;
		}

		/* 条目对应的会话行不在 DOM 里（所在项目被折叠）→ 展开折叠项目后再点 */
		function expandCollapsedProjects() {
			var projects = [].slice.call(document.querySelectorAll('[class*="_projectRow"]'));
			var changed = 0;
			projects.forEach(function (project) {
				if (project.getAttribute('aria-expanded') === 'true') return;
				project.click();
				changed += 1;
			});
			return changed;
		}

		function openPinnedEntry(entry) {
			var row = findLiveRow(entry.t);
			if (row !== null) {
				row.click();
				return;
			}
			if (expandCollapsedProjects() === 0) return;
			var tries = 0;
			var timer = setInterval(function () {
				tries += 1;
				var live = findLiveRow(entry.t);
				if (live !== null) {
					clearInterval(timer);
					live.click();
					return;
				}
				if (tries > 25) clearInterval(timer);
			}, 80);
		}

		function ensurePinned(region) {
			var rows = liveRows(region);
				var pins = rows.filter(isPinnedRow);
			var byTitle = new Map();
			loadStore().forEach(function (item) {
				if (!byTitle.has(item.t)) byTitle.set(item.t, item);
			});
			var pinnedTitles = new Set();
			pins.forEach(function (row) {
				var title = rowTitle(row);
				if (title === '') return;
				pinnedTitles.add(title);
				byTitle.set(title, { t: title, p: '' });
			});
			/* 宿主里被取消置顶且行还在 DOM → 从持久化列表删掉 */
			rows.forEach(function (row) {
				if (isPinnedRow(row)) return;
				var title = rowTitle(row);
				if (title !== '' && byTitle.has(title) && !pinnedTitles.has(title)) byTitle.delete(title);
			});
			var entries = Array.from(byTitle.values());
			saveStore(entries);

			var key = storeKey(entries);
			if (key === state.pinnedKey && region.querySelector('.cs-pinned') !== null) return;
			state.pinnedKey = key;

			var existing = region.querySelector('.cs-pinned');
			if (entries.length === 0) {
				if (existing !== null) existing.remove();
				return;
			}

			var box = existing;
			if (box === null) {
				box = el('div', 'cs-pinned');
				var head = el('button', 'cs-pinned-head');
				head.type = 'button';
				var caret = el('span', 'cs-pinned-caret');
				caret.appendChild(icon(ICON_CARET));
				head.appendChild(caret);
				head.appendChild(el('span', 'cs-pinned-label', '置顶'));
				head.addEventListener('click', function () {
					box.setAttribute('data-collapsed', box.getAttribute('data-collapsed') === '1' ? '0' : '1');
				});
				box.appendChild(head);
				box.appendChild(el('div', 'cs-pinned-body'));
				region.insertBefore(box, region.firstChild);
			}

			var body = box.querySelector('.cs-pinned-body');
			body.textContent = '';
			entries.forEach(function (entry) {
				var item = el('div', 'cs-pinned-row');
				var open = el('button', 'cs-pinned-item', entry.t);
				open.type = 'button';
				open.title = entry.p ? entry.t + ' · ' + entry.p : entry.t;
				open.addEventListener('click', function () {
					openPinnedEntry(entry);
				});
				var unpin = el('button', 'cs-unpin');
				unpin.type = 'button';
				unpin.title = '取消置顶';
				unpin.setAttribute('aria-label', '取消置顶');
				unpin.appendChild(icon(ICON_CLOSE));
				unpin.addEventListener('click', function (event) {
					event.stopPropagation();
					var live = findLiveRow(entry.t);
					if (live !== null) {
						var button = live.querySelector('[aria-label*="取消置顶"]');
						if (button === null) button = live.querySelector('[aria-label*="置顶"]');
						if (button !== null) button.click();
					}
					var next = loadStore().filter(function (item) {
						return item.t !== entry.t;
					});
					saveStore(next);
					state.pinnedKey = '';
					ensurePinned(region);
				});
				item.appendChild(open);
				item.appendChild(unpin);
				body.appendChild(item);
			});
		}

		/* ---------- 编排 ---------- */
		function ensure() {
			var root = document.querySelector(S.root);
			if (root === null) return;
			state.root = root;
			var logo = root.querySelector(S.logo);
			if (logo !== null) ensureTopbar(logo);
			disposeFootMenu(root);
			ensureNavPopover();
			/* 宿主把自己的菜单收掉时（点空白关闭），浮层要一起收，别让用户点第二次 */
			if (state.dockedMenus.length > 0) {
				var anyAlive = false;
				for (var di = 0; di < state.dockedMenus.length; di++) {
					if (state.dockedMenus[di].isConnected) {
						anyAlive = true;
						break;
					}
				}
				if (!anyAlive && (state.navPopover === null || state.navPopover.hidden)) {
					state.dockedMenus = [];
					state.activeLabel = '';
					if (state.navPopover !== null) state.navPopover.classList.remove('has-dock');
				}
			}
			/* 有二级菜单挂在外面时，浮层必须保持展开（宿主开菜单会顺手关掉它） */
			if (state.navPopover !== null && state.dockedMenus.length > 0 && state.navPopover.hidden) {
				keepNavPopoverShown();
			}
			try {
				ensurePromotedNav(root);
			} catch (error) {
				/* 常驻行失败不影响其它改动 */
			}
			var region = root.querySelector(S.region);
			if (region !== null) {
				try {
					ensurePinned(region);
				} catch (error) {
					/* 置顶区失败不影响其它改动 */
				}
				try {
					seedPinned(region);
				} catch (error) {
					/* 播种失败就退化成只扫 DOM */
				}
			}
			if (state.searchBox !== null) {
				try {
					applyFilter(state.searchBox.input.value);
				} catch (error) {
					/* 忽略 */
				}
			}
		}

		function schedule() {
			if (state.frame !== 0) return;
			state.frame = window.requestAnimationFrame(function () {
				state.frame = 0;
				try {
					ensure();
				} catch (error) {
					/* 侧栏结构变化绝不能打断应用 */
				}
			});
		}

		exports.apply = function apply(ctx) {
			if (typeof document === 'undefined') return;
			injectCSS();
			schedule();

			state.observer = new MutationObserver(function () {
				schedule();
			});
			state.observer.observe(document.body, { childList: true, subtree: true });

			document.addEventListener(
				'click',
				function (event) {
					var pop = state.navPopover;
					if (event.__csSynthetic) return;
					if (state.docking || Date.now() < state.dockUntil) return;
					if (pop === null || pop.hidden) return;
					if (event.target === null || event.target.closest === undefined) return;
					if (pop.contains(event.target)) return;
					if (event.target.closest('.cs-nav-toggle') !== null) return;
					var docked = false;
					for (var i = 0; i < state.dockedMenus.length; i++) {
						if (state.dockedMenus[i].contains(event.target)) {
							docked = true;
							break;
						}
					}
					if (docked) {
						window.setTimeout(function () {
							if (state.navPopover !== null) state.navPopover.hidden = true;
							state.dockedMenus = [];
						}, 160);
						return;
					}
					state.activeLabel = '';
			pop.hidden = true;
					closeDocked();
				},
				true,
			);

			/* 宿主有些区域会在 window 捕获阶段 stopPropagation，document 收不到 click，这里再兜一层 */
			window.addEventListener(
				'pointerdown',
				function (event) {
					var pop = state.navPopover;
					if (event.__csSynthetic) return;
					if (state.docking || Date.now() < state.dockUntil) return;
					if (pop === null || pop.hidden) return;
					if (event.target === null || event.target.closest === undefined) return;
					if (pop.contains(event.target)) return;
					if (event.target.closest('.cs-nav-toggle') !== null) return;
					for (var i = 0; i < state.dockedMenus.length; i++) {
						if (state.dockedMenus[i].contains(event.target)) return;
					}
					state.activeLabel = '';
			pop.hidden = true;
					closeDocked();
				},
				true,
			);

			var dispose = function () {
				if (state.observer !== null) state.observer.disconnect();
				state.observer = null;
				if (state.frame !== 0) window.cancelAnimationFrame(state.frame);
				state.frame = 0;
				var style = document.getElementById(STYLE_ID);
				if (style !== null) style.remove();
				if (state.navPopover !== null) state.navPopover.remove();
				state.navPopover = null;
				state.dockedMenus.forEach(function (node) {
					node.classList.remove('cs-dockedmenu');
				});
				state.dockedMenus = [];
				document.documentElement.removeAttribute(ATTR);
			};

			if (typeof ctx.effect === 'function') {
				ctx.effect(function () {
					return dispose;
				}, PLUGIN_ID + ': codex sidebar');
			}
		};

		return module.exports;
	},
});
