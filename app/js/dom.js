const SVG_NS = 'http://www.w3.org/2000/svg';
const PROPERTIES = new Set(['value', 'checked', 'disabled', 'selected']);
const HANDLERS = Symbol('handlers');
const PROPS = Symbol('props');

function listen(event) {
  this[HANDLERS]?.[event.type]?.call(this, event);
}

function build(el, props, children) {
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null) continue;
    if (PROPERTIES.has(key)) {
      el[PROPS] = { ...el[PROPS], [key]: value };
      el[key] = value;
    } else if (value === false) {
      continue;
    } else if (key.startsWith('on')) {
      const type = key.slice(2).toLowerCase();
      el[HANDLERS] = { ...el[HANDLERS], [type]: value };
      el.addEventListener(type, listen);
    } else if (key === 'style') {
      for (const [prop, v] of Object.entries(value)) el.style.setProperty(prop, v);
    } else {
      el.setAttribute(key === 'className' ? 'class' : key, value === true ? '' : value);
    }
  }
  el.append(...children.flat(Infinity).filter((c) => c != null && c !== false));
  return el;
}

export const h = (tag, props, ...children) => build(document.createElement(tag), props, children);

export const s = (tag, props, ...children) => build(document.createElementNS(SVG_NS, tag), props, children);

const keyOf = (node) => (node.nodeType === Node.ELEMENT_NODE ? node.getAttribute('data-key') : null);

function syncElement(from, to) {
  for (const { name } of [...from.attributes]) if (!to.hasAttribute(name)) from.removeAttribute(name);
  for (const { name, value } of to.attributes) {
    // The CSP blocks style attributes set via setAttribute; CSSOM writes are allowed.
    if (name === 'style') from.style.cssText = to.style.cssText;
    else if (from.getAttribute(name) !== value) from.setAttribute(name, value);
  }

  from[HANDLERS] = to[HANDLERS];
  for (const type of Object.keys(to[HANDLERS] ?? {})) from.addEventListener(type, listen);

  from[PROPS] = to[PROPS];
  for (const [key, value] of Object.entries(to[PROPS] ?? {})) {
    if (key === 'value' && from === document.activeElement) continue;
    if (from[key] !== value) from[key] = value;
  }
}

function morph(from, to) {
  const compatible = from.nodeType === to.nodeType && from.nodeName === to.nodeName && keyOf(from) === keyOf(to);
  if (!compatible) {
    from.replaceWith(to);
    return to;
  }
  if (from.nodeType === Node.TEXT_NODE) {
    if (from.data !== to.data) from.data = to.data;
    return from;
  }
  syncElement(from, to);
  patch(from, ...to.childNodes);
  return from;
}

// Updates `parent` in place to match `children`, so surviving elements keep focus and run CSS transitions.
export function patch(parent, ...children) {
  const next = children.flat(Infinity).filter((c) => c != null && c !== false);
  const keyed = new Map();
  const unkeyed = [];
  for (const node of parent.childNodes) {
    const key = keyOf(node);
    if (key) keyed.set(key, node);
    else unkeyed.push(node);
  }

  next.forEach((target, index) => {
    const key = keyOf(target);
    const match = key ? keyed.get(key) : unkeyed.shift();
    if (key) keyed.delete(key);
    const node = match ? morph(match, target) : target;
    const current = parent.childNodes[index];
    if (current !== node) parent.insertBefore(node, current ?? null);
  });

  while (parent.childNodes.length > next.length) parent.lastChild.remove();
}
