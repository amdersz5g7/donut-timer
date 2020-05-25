
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(html, anchor = null) {
            this.e = element('div');
            this.a = anchor;
            this.u(html);
        }
        m(target, anchor = null) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(target, this.n[i], anchor);
            }
            this.t = target;
        }
        u(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        p(html) {
            this.d();
            this.u(html);
            this.m(this.t, this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.22.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* node_modules/svelte-feather-icons/src/icons/CheckCircleIcon.svelte generated by Svelte v3.22.3 */

    const file = "node_modules/svelte-feather-icons/src/icons/CheckCircleIcon.svelte";

    function create_fragment(ctx) {
    	let svg;
    	let path;
    	let polyline;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			polyline = svg_element("polyline");
    			attr_dev(path, "d", "M22 11.08V12a10 10 0 1 1-5.93-9.14");
    			add_location(path, file, 12, 237, 493);
    			attr_dev(polyline, "points", "22 4 12 14.01 9 11.01");
    			add_location(polyline, file, 12, 289, 545);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", /*size*/ ctx[0]);
    			attr_dev(svg, "height", /*size*/ ctx[0]);
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", svg_class_value = "feather feather-check-circle " + /*customClass*/ ctx[1]);
    			add_location(svg, file, 12, 0, 256);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    			append_dev(svg, polyline);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "width", /*size*/ ctx[0]);
    			}

    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "height", /*size*/ ctx[0]);
    			}

    			if (dirty & /*customClass*/ 2 && svg_class_value !== (svg_class_value = "feather feather-check-circle " + /*customClass*/ ctx[1])) {
    				attr_dev(svg, "class", svg_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { size = "100%" } = $$props;
    	let { class: customClass = "" } = $$props;

    	if (size !== "100%") {
    		size = size.slice(-1) === "x"
    		? size.slice(0, size.length - 1) + "em"
    		: parseInt(size) + "px";
    	}

    	const writable_props = ["size", "class"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CheckCircleIcon> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("CheckCircleIcon", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("class" in $$props) $$invalidate(1, customClass = $$props.class);
    	};

    	$$self.$capture_state = () => ({ size, customClass });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("customClass" in $$props) $$invalidate(1, customClass = $$props.customClass);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, customClass];
    }

    class CheckCircleIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { size: 0, class: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CheckCircleIcon",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get size() {
    		throw new Error("<CheckCircleIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<CheckCircleIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<CheckCircleIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<CheckCircleIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-feather-icons/src/icons/ChevronsDownIcon.svelte generated by Svelte v3.22.3 */

    const file$1 = "node_modules/svelte-feather-icons/src/icons/ChevronsDownIcon.svelte";

    function create_fragment$1(ctx) {
    	let svg;
    	let polyline0;
    	let polyline1;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			polyline0 = svg_element("polyline");
    			polyline1 = svg_element("polyline");
    			attr_dev(polyline0, "points", "7 13 12 18 17 13");
    			add_location(polyline0, file$1, 12, 238, 494);
    			attr_dev(polyline1, "points", "7 6 12 11 17 6");
    			add_location(polyline1, file$1, 12, 285, 541);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", /*size*/ ctx[0]);
    			attr_dev(svg, "height", /*size*/ ctx[0]);
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", svg_class_value = "feather feather-chevrons-down " + /*customClass*/ ctx[1]);
    			add_location(svg, file$1, 12, 0, 256);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, polyline0);
    			append_dev(svg, polyline1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "width", /*size*/ ctx[0]);
    			}

    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "height", /*size*/ ctx[0]);
    			}

    			if (dirty & /*customClass*/ 2 && svg_class_value !== (svg_class_value = "feather feather-chevrons-down " + /*customClass*/ ctx[1])) {
    				attr_dev(svg, "class", svg_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { size = "100%" } = $$props;
    	let { class: customClass = "" } = $$props;

    	if (size !== "100%") {
    		size = size.slice(-1) === "x"
    		? size.slice(0, size.length - 1) + "em"
    		: parseInt(size) + "px";
    	}

    	const writable_props = ["size", "class"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ChevronsDownIcon> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ChevronsDownIcon", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("class" in $$props) $$invalidate(1, customClass = $$props.class);
    	};

    	$$self.$capture_state = () => ({ size, customClass });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("customClass" in $$props) $$invalidate(1, customClass = $$props.customClass);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, customClass];
    }

    class ChevronsDownIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { size: 0, class: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ChevronsDownIcon",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get size() {
    		throw new Error("<ChevronsDownIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<ChevronsDownIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<ChevronsDownIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<ChevronsDownIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-feather-icons/src/icons/ClockIcon.svelte generated by Svelte v3.22.3 */

    const file$2 = "node_modules/svelte-feather-icons/src/icons/ClockIcon.svelte";

    function create_fragment$2(ctx) {
    	let svg;
    	let circle;
    	let polyline;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			circle = svg_element("circle");
    			polyline = svg_element("polyline");
    			attr_dev(circle, "cx", "12");
    			attr_dev(circle, "cy", "12");
    			attr_dev(circle, "r", "10");
    			add_location(circle, file$2, 12, 230, 486);
    			attr_dev(polyline, "points", "12 6 12 12 16 14");
    			add_location(polyline, file$2, 12, 270, 526);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", /*size*/ ctx[0]);
    			attr_dev(svg, "height", /*size*/ ctx[0]);
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", svg_class_value = "feather feather-clock " + /*customClass*/ ctx[1]);
    			add_location(svg, file$2, 12, 0, 256);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, circle);
    			append_dev(svg, polyline);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "width", /*size*/ ctx[0]);
    			}

    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "height", /*size*/ ctx[0]);
    			}

    			if (dirty & /*customClass*/ 2 && svg_class_value !== (svg_class_value = "feather feather-clock " + /*customClass*/ ctx[1])) {
    				attr_dev(svg, "class", svg_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { size = "100%" } = $$props;
    	let { class: customClass = "" } = $$props;

    	if (size !== "100%") {
    		size = size.slice(-1) === "x"
    		? size.slice(0, size.length - 1) + "em"
    		: parseInt(size) + "px";
    	}

    	const writable_props = ["size", "class"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ClockIcon> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ClockIcon", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("class" in $$props) $$invalidate(1, customClass = $$props.class);
    	};

    	$$self.$capture_state = () => ({ size, customClass });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("customClass" in $$props) $$invalidate(1, customClass = $$props.customClass);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, customClass];
    }

    class ClockIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { size: 0, class: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ClockIcon",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get size() {
    		throw new Error("<ClockIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<ClockIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<ClockIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<ClockIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-feather-icons/src/icons/PlusCircleIcon.svelte generated by Svelte v3.22.3 */

    const file$3 = "node_modules/svelte-feather-icons/src/icons/PlusCircleIcon.svelte";

    function create_fragment$3(ctx) {
    	let svg;
    	let circle;
    	let line0;
    	let line1;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			circle = svg_element("circle");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			attr_dev(circle, "cx", "12");
    			attr_dev(circle, "cy", "12");
    			attr_dev(circle, "r", "10");
    			add_location(circle, file$3, 12, 236, 492);
    			attr_dev(line0, "x1", "12");
    			attr_dev(line0, "y1", "8");
    			attr_dev(line0, "x2", "12");
    			attr_dev(line0, "y2", "16");
    			add_location(line0, file$3, 12, 276, 532);
    			attr_dev(line1, "x1", "8");
    			attr_dev(line1, "y1", "12");
    			attr_dev(line1, "x2", "16");
    			attr_dev(line1, "y2", "12");
    			add_location(line1, file$3, 12, 320, 576);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", /*size*/ ctx[0]);
    			attr_dev(svg, "height", /*size*/ ctx[0]);
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", svg_class_value = "feather feather-plus-circle " + /*customClass*/ ctx[1]);
    			add_location(svg, file$3, 12, 0, 256);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, circle);
    			append_dev(svg, line0);
    			append_dev(svg, line1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "width", /*size*/ ctx[0]);
    			}

    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "height", /*size*/ ctx[0]);
    			}

    			if (dirty & /*customClass*/ 2 && svg_class_value !== (svg_class_value = "feather feather-plus-circle " + /*customClass*/ ctx[1])) {
    				attr_dev(svg, "class", svg_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { size = "100%" } = $$props;
    	let { class: customClass = "" } = $$props;

    	if (size !== "100%") {
    		size = size.slice(-1) === "x"
    		? size.slice(0, size.length - 1) + "em"
    		: parseInt(size) + "px";
    	}

    	const writable_props = ["size", "class"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PlusCircleIcon> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PlusCircleIcon", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("class" in $$props) $$invalidate(1, customClass = $$props.class);
    	};

    	$$self.$capture_state = () => ({ size, customClass });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("customClass" in $$props) $$invalidate(1, customClass = $$props.customClass);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, customClass];
    }

    class PlusCircleIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { size: 0, class: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PlusCircleIcon",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get size() {
    		throw new Error("<PlusCircleIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<PlusCircleIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<PlusCircleIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<PlusCircleIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-feather-icons/src/icons/PlusSquareIcon.svelte generated by Svelte v3.22.3 */

    const file$4 = "node_modules/svelte-feather-icons/src/icons/PlusSquareIcon.svelte";

    function create_fragment$4(ctx) {
    	let svg;
    	let rect;
    	let line0;
    	let line1;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			rect = svg_element("rect");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			attr_dev(rect, "x", "3");
    			attr_dev(rect, "y", "3");
    			attr_dev(rect, "width", "18");
    			attr_dev(rect, "height", "18");
    			attr_dev(rect, "rx", "2");
    			attr_dev(rect, "ry", "2");
    			add_location(rect, file$4, 12, 236, 492);
    			attr_dev(line0, "x1", "12");
    			attr_dev(line0, "y1", "8");
    			attr_dev(line0, "x2", "12");
    			attr_dev(line0, "y2", "16");
    			add_location(line0, file$4, 12, 298, 554);
    			attr_dev(line1, "x1", "8");
    			attr_dev(line1, "y1", "12");
    			attr_dev(line1, "x2", "16");
    			attr_dev(line1, "y2", "12");
    			add_location(line1, file$4, 12, 342, 598);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", /*size*/ ctx[0]);
    			attr_dev(svg, "height", /*size*/ ctx[0]);
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", svg_class_value = "feather feather-plus-square " + /*customClass*/ ctx[1]);
    			add_location(svg, file$4, 12, 0, 256);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, rect);
    			append_dev(svg, line0);
    			append_dev(svg, line1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "width", /*size*/ ctx[0]);
    			}

    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "height", /*size*/ ctx[0]);
    			}

    			if (dirty & /*customClass*/ 2 && svg_class_value !== (svg_class_value = "feather feather-plus-square " + /*customClass*/ ctx[1])) {
    				attr_dev(svg, "class", svg_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { size = "100%" } = $$props;
    	let { class: customClass = "" } = $$props;

    	if (size !== "100%") {
    		size = size.slice(-1) === "x"
    		? size.slice(0, size.length - 1) + "em"
    		: parseInt(size) + "px";
    	}

    	const writable_props = ["size", "class"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PlusSquareIcon> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PlusSquareIcon", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("class" in $$props) $$invalidate(1, customClass = $$props.class);
    	};

    	$$self.$capture_state = () => ({ size, customClass });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("customClass" in $$props) $$invalidate(1, customClass = $$props.customClass);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, customClass];
    }

    class PlusSquareIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { size: 0, class: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PlusSquareIcon",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get size() {
    		throw new Error("<PlusSquareIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<PlusSquareIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<PlusSquareIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<PlusSquareIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-feather-icons/src/icons/StopCircleIcon.svelte generated by Svelte v3.22.3 */

    const file$5 = "node_modules/svelte-feather-icons/src/icons/StopCircleIcon.svelte";

    function create_fragment$5(ctx) {
    	let svg;
    	let circle;
    	let rect;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			circle = svg_element("circle");
    			rect = svg_element("rect");
    			attr_dev(circle, "cx", "12");
    			attr_dev(circle, "cy", "12");
    			attr_dev(circle, "r", "10");
    			add_location(circle, file$5, 12, 236, 492);
    			attr_dev(rect, "x", "9");
    			attr_dev(rect, "y", "9");
    			attr_dev(rect, "width", "6");
    			attr_dev(rect, "height", "6");
    			add_location(rect, file$5, 12, 276, 532);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", /*size*/ ctx[0]);
    			attr_dev(svg, "height", /*size*/ ctx[0]);
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", svg_class_value = "feather feather-stop-circle " + /*customClass*/ ctx[1]);
    			add_location(svg, file$5, 12, 0, 256);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, circle);
    			append_dev(svg, rect);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "width", /*size*/ ctx[0]);
    			}

    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "height", /*size*/ ctx[0]);
    			}

    			if (dirty & /*customClass*/ 2 && svg_class_value !== (svg_class_value = "feather feather-stop-circle " + /*customClass*/ ctx[1])) {
    				attr_dev(svg, "class", svg_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { size = "100%" } = $$props;
    	let { class: customClass = "" } = $$props;

    	if (size !== "100%") {
    		size = size.slice(-1) === "x"
    		? size.slice(0, size.length - 1) + "em"
    		: parseInt(size) + "px";
    	}

    	const writable_props = ["size", "class"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<StopCircleIcon> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("StopCircleIcon", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("class" in $$props) $$invalidate(1, customClass = $$props.class);
    	};

    	$$self.$capture_state = () => ({ size, customClass });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("customClass" in $$props) $$invalidate(1, customClass = $$props.customClass);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, customClass];
    }

    class StopCircleIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { size: 0, class: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StopCircleIcon",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get size() {
    		throw new Error("<StopCircleIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<StopCircleIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<StopCircleIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<StopCircleIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-feather-icons/src/icons/TargetIcon.svelte generated by Svelte v3.22.3 */

    const file$6 = "node_modules/svelte-feather-icons/src/icons/TargetIcon.svelte";

    function create_fragment$6(ctx) {
    	let svg;
    	let circle0;
    	let circle1;
    	let circle2;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			circle0 = svg_element("circle");
    			circle1 = svg_element("circle");
    			circle2 = svg_element("circle");
    			attr_dev(circle0, "cx", "12");
    			attr_dev(circle0, "cy", "12");
    			attr_dev(circle0, "r", "10");
    			add_location(circle0, file$6, 12, 231, 487);
    			attr_dev(circle1, "cx", "12");
    			attr_dev(circle1, "cy", "12");
    			attr_dev(circle1, "r", "6");
    			add_location(circle1, file$6, 12, 271, 527);
    			attr_dev(circle2, "cx", "12");
    			attr_dev(circle2, "cy", "12");
    			attr_dev(circle2, "r", "2");
    			add_location(circle2, file$6, 12, 310, 566);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", /*size*/ ctx[0]);
    			attr_dev(svg, "height", /*size*/ ctx[0]);
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", svg_class_value = "feather feather-target " + /*customClass*/ ctx[1]);
    			add_location(svg, file$6, 12, 0, 256);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, circle0);
    			append_dev(svg, circle1);
    			append_dev(svg, circle2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "width", /*size*/ ctx[0]);
    			}

    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "height", /*size*/ ctx[0]);
    			}

    			if (dirty & /*customClass*/ 2 && svg_class_value !== (svg_class_value = "feather feather-target " + /*customClass*/ ctx[1])) {
    				attr_dev(svg, "class", svg_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { size = "100%" } = $$props;
    	let { class: customClass = "" } = $$props;

    	if (size !== "100%") {
    		size = size.slice(-1) === "x"
    		? size.slice(0, size.length - 1) + "em"
    		: parseInt(size) + "px";
    	}

    	const writable_props = ["size", "class"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TargetIcon> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TargetIcon", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("class" in $$props) $$invalidate(1, customClass = $$props.class);
    	};

    	$$self.$capture_state = () => ({ size, customClass });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("customClass" in $$props) $$invalidate(1, customClass = $$props.customClass);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, customClass];
    }

    class TargetIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { size: 0, class: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TargetIcon",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get size() {
    		throw new Error("<TargetIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<TargetIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<TargetIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<TargetIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-feather-icons/src/icons/Trash2Icon.svelte generated by Svelte v3.22.3 */

    const file$7 = "node_modules/svelte-feather-icons/src/icons/Trash2Icon.svelte";

    function create_fragment$7(ctx) {
    	let svg;
    	let polyline;
    	let path;
    	let line0;
    	let line1;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			polyline = svg_element("polyline");
    			path = svg_element("path");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			attr_dev(polyline, "points", "3 6 5 6 21 6");
    			add_location(polyline, file$7, 12, 232, 488);
    			attr_dev(path, "d", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2");
    			add_location(path, file$7, 12, 275, 531);
    			attr_dev(line0, "x1", "10");
    			attr_dev(line0, "y1", "11");
    			attr_dev(line0, "x2", "10");
    			attr_dev(line0, "y2", "17");
    			add_location(line0, file$7, 12, 371, 627);
    			attr_dev(line1, "x1", "14");
    			attr_dev(line1, "y1", "11");
    			attr_dev(line1, "x2", "14");
    			attr_dev(line1, "y2", "17");
    			add_location(line1, file$7, 12, 416, 672);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", /*size*/ ctx[0]);
    			attr_dev(svg, "height", /*size*/ ctx[0]);
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", svg_class_value = "feather feather-trash-2 " + /*customClass*/ ctx[1]);
    			add_location(svg, file$7, 12, 0, 256);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, polyline);
    			append_dev(svg, path);
    			append_dev(svg, line0);
    			append_dev(svg, line1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "width", /*size*/ ctx[0]);
    			}

    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "height", /*size*/ ctx[0]);
    			}

    			if (dirty & /*customClass*/ 2 && svg_class_value !== (svg_class_value = "feather feather-trash-2 " + /*customClass*/ ctx[1])) {
    				attr_dev(svg, "class", svg_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { size = "100%" } = $$props;
    	let { class: customClass = "" } = $$props;

    	if (size !== "100%") {
    		size = size.slice(-1) === "x"
    		? size.slice(0, size.length - 1) + "em"
    		: parseInt(size) + "px";
    	}

    	const writable_props = ["size", "class"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Trash2Icon> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Trash2Icon", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("class" in $$props) $$invalidate(1, customClass = $$props.class);
    	};

    	$$self.$capture_state = () => ({ size, customClass });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("customClass" in $$props) $$invalidate(1, customClass = $$props.customClass);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, customClass];
    }

    class Trash2Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { size: 0, class: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Trash2Icon",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get size() {
    		throw new Error("<Trash2Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Trash2Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Trash2Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Trash2Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.22.3 */

    const { console: console_1, document: document_1 } = globals;

    const file$8 = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	return child_ctx;
    }

    // (218:4) {#if timeractive > 0 }
    function create_if_block(ctx) {
    	let div2;
    	let div0;
    	let h60;
    	let small0;
    	let t1;
    	let t2;
    	let t3;
    	let div1;
    	let h61;
    	let small1;
    	let t5;
    	let t6;
    	let t7;
    	let div5;
    	let div3;
    	let h62;
    	let small2;
    	let t9;
    	let html_tag;
    	let t10;
    	let div4;
    	let h63;
    	let small3;
    	let t12;
    	let html_tag_1;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h60 = element("h6");
    			small0 = element("small");
    			small0.textContent = "First Start";
    			t1 = space();
    			t2 = text(/*firststart*/ ctx[2]);
    			t3 = space();
    			div1 = element("div");
    			h61 = element("h6");
    			small1 = element("small");
    			small1.textContent = "Timer Active";
    			t5 = space();
    			t6 = text(/*timeractive*/ ctx[4]);
    			t7 = space();
    			div5 = element("div");
    			div3 = element("div");
    			h62 = element("h6");
    			small2 = element("small");
    			small2.textContent = "Early Finish";
    			t9 = space();
    			t10 = space();
    			div4 = element("div");
    			h63 = element("h6");
    			small3 = element("small");
    			small3.textContent = "Last Finish";
    			t12 = space();
    			add_location(small0, file$8, 220, 12, 6636);
    			add_location(h60, file$8, 220, 8, 6632);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$8, 219, 6, 6601);
    			add_location(small1, file$8, 225, 12, 6752);
    			add_location(h61, file$8, 225, 8, 6748);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$8, 224, 6, 6717);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$8, 218, 4, 6577);
    			add_location(small2, file$8, 233, 12, 6904);
    			html_tag = new HtmlTag(/*earlyfinish*/ ctx[5], null);
    			add_location(h62, file$8, 233, 8, 6900);
    			attr_dev(div3, "class", "col-sm-6");
    			add_location(div3, file$8, 232, 6, 6869);
    			add_location(small3, file$8, 238, 12, 7028);
    			html_tag_1 = new HtmlTag(/*lastfinish*/ ctx[3], null);
    			add_location(h63, file$8, 238, 8, 7024);
    			attr_dev(div4, "class", "col-sm-6");
    			add_location(div4, file$8, 237, 6, 6993);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$8, 231, 4, 6845);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h60);
    			append_dev(h60, small0);
    			append_dev(h60, t1);
    			append_dev(h60, t2);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, h61);
    			append_dev(h61, small1);
    			append_dev(h61, t5);
    			append_dev(h61, t6);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div3);
    			append_dev(div3, h62);
    			append_dev(h62, small2);
    			append_dev(h62, t9);
    			html_tag.m(h62);
    			append_dev(div5, t10);
    			append_dev(div5, div4);
    			append_dev(div4, h63);
    			append_dev(h63, small3);
    			append_dev(h63, t12);
    			html_tag_1.m(h63);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*firststart*/ 4) set_data_dev(t2, /*firststart*/ ctx[2]);
    			if (dirty & /*timeractive*/ 16) set_data_dev(t6, /*timeractive*/ ctx[4]);
    			if (dirty & /*earlyfinish*/ 32) html_tag.p(/*earlyfinish*/ ctx[5]);
    			if (dirty & /*lastfinish*/ 8) html_tag_1.p(/*lastfinish*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(218:4) {#if timeractive > 0 }",
    		ctx
    	});

    	return block;
    }

    // (250:0) {#each timers as timer}
    function create_each_block(ctx) {
    	let div6;
    	let div0;
    	let h4;
    	let t0;
    	let t1_value = /*timer*/ ctx[16].tid + "";
    	let t1;
    	let t2;
    	let button;
    	let button_class_value;
    	let t3;
    	let div4;
    	let div1;
    	let t4;
    	let span0;
    	let t5_value = /*timer*/ ctx[16].maxminute + "";
    	let t5;
    	let t6;
    	let t7;
    	let div2;
    	let t8;
    	let span1;
    	let t9_value = /*timer*/ ctx[16].start_at + "";
    	let t9;
    	let t10;
    	let div3;
    	let t11;
    	let span2;
    	let t12_value = /*timer*/ ctx[16].finish_at + "";
    	let t12;
    	let t13;
    	let div5;
    	let mark;
    	let mark_class_value;
    	let mark_id_value;
    	let countdwn_action;
    	let t14;
    	let div6_id_value;
    	let div6_class_value;
    	let current;
    	let dispose;
    	const trash2icon = new Trash2Icon({ props: { size: "16" }, $$inline: true });
    	const targeticon = new TargetIcon({ props: { size: "20" }, $$inline: true });
    	const clockicon = new ClockIcon({ props: { size: "20" }, $$inline: true });
    	const stopcircleicon = new StopCircleIcon({ props: { size: "20" }, $$inline: true });

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			t0 = text("Timer ke-");
    			t1 = text(t1_value);
    			t2 = space();
    			button = element("button");
    			create_component(trash2icon.$$.fragment);
    			t3 = space();
    			div4 = element("div");
    			div1 = element("div");
    			create_component(targeticon.$$.fragment);
    			t4 = space();
    			span0 = element("span");
    			t5 = text(t5_value);
    			t6 = text(" menit");
    			t7 = space();
    			div2 = element("div");
    			create_component(clockicon.$$.fragment);
    			t8 = space();
    			span1 = element("span");
    			t9 = text(t9_value);
    			t10 = space();
    			div3 = element("div");
    			create_component(stopcircleicon.$$.fragment);
    			t11 = space();
    			span2 = element("span");
    			t12 = text(t12_value);
    			t13 = space();
    			div5 = element("div");
    			mark = element("mark");
    			t14 = space();
    			set_style(h4, "margin-left", "0px");
    			add_location(h4, file$8, 252, 6, 7337);
    			attr_dev(button, "class", button_class_value = "xprimary rmv " + (/*timer*/ ctx[16].remove ? "" : "secondary") + " svelte-gopu2q");
    			add_location(button, file$8, 253, 6, 7399);
    			attr_dev(div0, "class", "section");
    			add_location(div0, file$8, 251, 4, 7309);
    			attr_dev(span0, "class", "justinfo svelte-gopu2q");
    			add_location(span0, file$8, 260, 33, 7628);
    			add_location(div1, file$8, 259, 6, 7589);
    			attr_dev(span1, "class", "justinfo svelte-gopu2q");
    			add_location(span1, file$8, 263, 32, 7739);
    			add_location(div2, file$8, 262, 6, 7701);
    			attr_dev(span2, "class", "justinfo svelte-gopu2q");
    			add_location(span2, file$8, 266, 37, 7848);
    			add_location(div3, file$8, 265, 6, 7805);
    			attr_dev(div4, "class", "section");
    			add_location(div4, file$8, 258, 4, 7561);
    			attr_dev(mark, "class", mark_class_value = "tertiary timer-" + /*timer*/ ctx[16].tid + " svelte-gopu2q");
    			attr_dev(mark, "id", mark_id_value = /*timer*/ ctx[16].tid);
    			add_location(mark, file$8, 271, 6, 7964);
    			attr_dev(div5, "class", "section to-center  svelte-gopu2q");
    			add_location(div5, file$8, 270, 4, 7925);
    			attr_dev(div6, "id", div6_id_value = "card-" + /*timer*/ ctx[16].tid);
    			attr_dev(div6, "class", div6_class_value = "card fluid " + (/*timer*/ ctx[16].remove ? "remove_timer" : "") + " svelte-gopu2q");
    			add_location(div6, file$8, 250, 2, 7220);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div0);
    			append_dev(div0, h4);
    			append_dev(h4, t0);
    			append_dev(h4, t1);
    			append_dev(div0, t2);
    			append_dev(div0, button);
    			mount_component(trash2icon, button, null);
    			append_dev(div6, t3);
    			append_dev(div6, div4);
    			append_dev(div4, div1);
    			mount_component(targeticon, div1, null);
    			append_dev(div1, t4);
    			append_dev(div1, span0);
    			append_dev(span0, t5);
    			append_dev(span0, t6);
    			append_dev(div4, t7);
    			append_dev(div4, div2);
    			mount_component(clockicon, div2, null);
    			append_dev(div2, t8);
    			append_dev(div2, span1);
    			append_dev(span1, t9);
    			append_dev(div4, t10);
    			append_dev(div4, div3);
    			mount_component(stopcircleicon, div3, null);
    			append_dev(div3, t11);
    			append_dev(div3, span2);
    			append_dev(span2, t12);
    			append_dev(div6, t13);
    			append_dev(div6, div5);
    			append_dev(div5, mark);
    			append_dev(div6, t14);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*timer*/ ctx[16].remove ? null : /*rmv*/ ctx[8])) (/*timer*/ ctx[16].remove ? null : /*rmv*/ ctx[8]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				),
    				action_destroyer(countdwn_action = /*countdwn*/ ctx[6].call(null, mark))
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*timers*/ 2) && t1_value !== (t1_value = /*timer*/ ctx[16].tid + "")) set_data_dev(t1, t1_value);

    			if (!current || dirty & /*timers*/ 2 && button_class_value !== (button_class_value = "xprimary rmv " + (/*timer*/ ctx[16].remove ? "" : "secondary") + " svelte-gopu2q")) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if ((!current || dirty & /*timers*/ 2) && t5_value !== (t5_value = /*timer*/ ctx[16].maxminute + "")) set_data_dev(t5, t5_value);
    			if ((!current || dirty & /*timers*/ 2) && t9_value !== (t9_value = /*timer*/ ctx[16].start_at + "")) set_data_dev(t9, t9_value);
    			if ((!current || dirty & /*timers*/ 2) && t12_value !== (t12_value = /*timer*/ ctx[16].finish_at + "")) set_data_dev(t12, t12_value);

    			if (!current || dirty & /*timers*/ 2 && mark_class_value !== (mark_class_value = "tertiary timer-" + /*timer*/ ctx[16].tid + " svelte-gopu2q")) {
    				attr_dev(mark, "class", mark_class_value);
    			}

    			if (!current || dirty & /*timers*/ 2 && mark_id_value !== (mark_id_value = /*timer*/ ctx[16].tid)) {
    				attr_dev(mark, "id", mark_id_value);
    			}

    			if (!current || dirty & /*timers*/ 2 && div6_id_value !== (div6_id_value = "card-" + /*timer*/ ctx[16].tid)) {
    				attr_dev(div6, "id", div6_id_value);
    			}

    			if (!current || dirty & /*timers*/ 2 && div6_class_value !== (div6_class_value = "card fluid " + (/*timer*/ ctx[16].remove ? "remove_timer" : "") + " svelte-gopu2q")) {
    				attr_dev(div6, "class", div6_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(trash2icon.$$.fragment, local);
    			transition_in(targeticon.$$.fragment, local);
    			transition_in(clockicon.$$.fragment, local);
    			transition_in(stopcircleicon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(trash2icon.$$.fragment, local);
    			transition_out(targeticon.$$.fragment, local);
    			transition_out(clockicon.$$.fragment, local);
    			transition_out(stopcircleicon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			destroy_component(trash2icon);
    			destroy_component(targeticon);
    			destroy_component(clockicon);
    			destroy_component(stopcircleicon);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(250:0) {#each timers as timer}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let meta0;
    	let meta1;
    	let meta2;
    	let meta3;
    	let link;
    	let script;
    	let script_src_value;
    	let t0;
    	let main;
    	let h1;
    	let t2;
    	let centerx;
    	let div3;
    	let div2;
    	let div0;
    	let input;
    	let t3;
    	let div1;
    	let button;
    	let span0;
    	let t4;
    	let span1;
    	let t6;
    	let t7;
    	let div5;
    	let div4;
    	let t8;
    	let footer;
    	let center;
    	let p;
    	let current;
    	let dispose;
    	const pluscircleicon = new PlusCircleIcon({ props: { size: "20" }, $$inline: true });
    	let if_block = /*timeractive*/ ctx[4] > 0 && create_if_block(ctx);
    	let each_value = /*timers*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			meta0 = element("meta");
    			meta1 = element("meta");
    			meta2 = element("meta");
    			meta3 = element("meta");
    			link = element("link");
    			script = element("script");
    			t0 = space();
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Donut Timer";
    			t2 = space();
    			centerx = element("centerx");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t3 = space();
    			div1 = element("div");
    			button = element("button");
    			span0 = element("span");
    			create_component(pluscircleicon.$$.fragment);
    			t4 = space();
    			span1 = element("span");
    			span1.textContent = "Add Timer";
    			t6 = space();
    			if (if_block) if_block.c();
    			t7 = space();
    			div5 = element("div");
    			div4 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			footer = element("footer");
    			center = element("center");
    			p = element("p");
    			p.textContent = "V8.C0d3 - 2020.05";
    			document_1.title = "::Donut Timer::";
    			attr_dev(meta0, "name", "description");
    			attr_dev(meta0, "content", "multi timer countdown apps");
    			add_location(meta0, file$8, 3, 2, 52);
    			attr_dev(meta1, "name", "keywords");
    			attr_dev(meta1, "content", "multi timer, countdown, donut");
    			add_location(meta1, file$8, 4, 2, 119);
    			attr_dev(meta2, "name", "author");
    			attr_dev(meta2, "content", "amdersz5g7");
    			add_location(meta2, file$8, 5, 2, 186);
    			attr_dev(meta3, "name", "robots");
    			attr_dev(meta3, "content", "index, nofollow");
    			add_location(meta3, file$8, 6, 2, 232);
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://cdn.rawgit.com/Chalarangelo/mini.css/v3.0.1/dist/mini-default.min.css");
    			add_location(link, file$8, 8, 2, 284);
    			if (script.src !== (script_src_value = "https://code.responsivevoice.org/responsivevoice.js?key=rrTffgeB")) attr_dev(script, "src", script_src_value);
    			add_location(script, file$8, 10, 2, 398);
    			attr_dev(h1, "class", "svelte-gopu2q");
    			add_location(h1, file$8, 202, 1, 6065);
    			attr_dev(main, "class", "svelte-gopu2q");
    			add_location(main, file$8, 201, 0, 6057);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "id", "input_menit");
    			attr_dev(input, "placeholder", "minutes");
    			attr_dev(input, "class", "svelte-gopu2q");
    			add_location(input, file$8, 209, 8, 6191);
    			attr_dev(div0, "class", "col-sm-7");
    			add_location(div0, file$8, 208, 6, 6160);
    			set_style(span0, "position", "relative");
    			set_style(span0, "top", "3px");
    			add_location(span0, file$8, 213, 10, 6401);
    			add_location(span1, file$8, 213, 90, 6481);
    			attr_dev(button, "class", "xprimary primary shadowed svelte-gopu2q");
    			add_location(button, file$8, 212, 8, 6328);
    			attr_dev(div1, "class", "col-sm-5");
    			add_location(div1, file$8, 211, 6, 6297);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$8, 207, 4, 6136);
    			attr_dev(div3, "class", "containerx");
    			add_location(div3, file$8, 206, 2, 6107);
    			add_location(centerx, file$8, 205, 0, 6095);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$8, 248, 0, 7176);
    			attr_dev(div5, "class", "containerd");
    			add_location(div5, file$8, 247, 0, 7151);
    			add_location(p, file$8, 280, 4, 8128);
    			set_style(center, "color", "gray");
    			add_location(center, file$8, 279, 2, 8095);
    			add_location(footer, file$8, 278, 0, 8084);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document_1.head, meta0);
    			append_dev(document_1.head, meta1);
    			append_dev(document_1.head, meta2);
    			append_dev(document_1.head, meta3);
    			append_dev(document_1.head, link);
    			append_dev(document_1.head, script);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, centerx, anchor);
    			append_dev(centerx, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*maxminutes*/ ctx[0]);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, button);
    			append_dev(button, span0);
    			mount_component(pluscircleicon, span0, null);
    			append_dev(button, t4);
    			append_dev(button, span1);
    			append_dev(div3, t6);
    			if (if_block) if_block.m(div3, null);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div4, null);
    			}

    			insert_dev(target, t8, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, center);
    			append_dev(center, p);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[15]),
    				listen_dev(button, "click", /*addTimer*/ ctx[7], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*maxminutes*/ 1 && to_number(input.value) !== /*maxminutes*/ ctx[0]) {
    				set_input_value(input, /*maxminutes*/ ctx[0]);
    			}

    			if (/*timeractive*/ ctx[4] > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div3, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*timers, rmv*/ 258) {
    				each_value = /*timers*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div4, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pluscircleicon.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pluscircleicon.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(meta0);
    			detach_dev(meta1);
    			detach_dev(meta2);
    			detach_dev(meta3);
    			detach_dev(link);
    			detach_dev(script);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(centerx);
    			destroy_component(pluscircleicon);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div5);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(footer);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function alertvoice(id) {
    	responsiveVoice.speak("Timer ke " + id + ", sudah habis waktu", "Indonesian Female", { pitch: 1, rate: 1, volume: 1 });
    }

    /*
    https://www.educative.io/edpresso/how-to-sort-an-array-of-objects-in-javascript
    */
    function dynamicsort(property, order) {
    	var sort_order = 1;

    	if (order === "desc") {
    		sort_order = -1;
    	}

    	return function (a, b) {
    		// a should come before b in the sorted order
    		if (a[property] < b[property]) {
    			return -1 * sort_order;
    		} else if (a[property] > b[property]) {
    			return 1 * sort_order; // a should come after b in the sorted order
    		} else {
    			return 0 * sort_order; // a and b are the same
    		}
    	};
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let count = 1;
    	let maxminutes = 40;
    	let timers = [];
    	let hours, minutes, seconds;
    	let firststart = "-", lastfinish = "-", timeractive = "-", earlyfinish = "-";

    	function countdown(element, minutes, seconds) {
    		// Fetch the display element
    		var el = element; //document.getElementById(element);

    		var timerIntervalID = timers.filter(function (timer) {
    			return timer.tid == el.id;
    		});

    		timerIntervalID[0]["timercontrol"] = setInterval(
    			function () {
    				// Set the timer
    				//var interval = setInterval(function() {
    				if (seconds == 0) {
    					if (minutes == 0) {
    						document.getElementById("card-" + el.id).scrollIntoView();
    						let elparent = el.parentNode.parentNode;
    						elparent.classList.add("error");
    						el.parentNode.remove();

    						//clearInterval(interval);
    						clearInterval(timerIntervalID[0]["timercontrol"]);

    						alertvoice(el.id);

    						timers.forEach(function (a, b) {
    							if (a.tid == el.id) {
    								$$invalidate(1, timers[b].done = true, timers);
    								TimeInfo();
    							}
    						});

    						return;
    					} else {
    						minutes--;
    						seconds = 60;
    					}
    				}

    				if (minutes > 0) {
    					var minute_text = minutes + (minutes > 1 ? " minutes" : " minute");
    				} else {
    					var minute_text = "";
    				}

    				var second_text = seconds > 1 ? "" : "";

    				//el.innerHTML = minute_text + ' ' + seconds + ' ' + second_text + '';
    				let timerun = document.getElementsByClassName("timer-" + el.id);

    				let timertext = minute_text + " " + seconds + " " + second_text + "";

    				for (let i = 0; i < timerun.length; i++) {
    					timerun[i].innerHTML = timertext;
    				}

    				seconds--;
    			},
    			1000
    		);
    	}

    	function countdwn(node) {
    		countdown(node, maxminutes, 0);
    	}

    	function TimeInfo() {
    		$$invalidate(4, timeractive = "-");
    		$$invalidate(2, firststart = "-");
    		$$invalidate(3, lastfinish = "-");
    		$$invalidate(5, earlyfinish = "-");

    		let timeractive_ = timers.filter(function (timer) {
    			return timer.remove == false && timer.done == false;
    		});

    		if (!!timeractive_ && timeractive_.length > 0) {
    			let ds = timeractive_.sort(dynamicsort("start_full", "asc"));
    			console.log(ds);
    			$$invalidate(2, firststart = ds[0].start_at + " (" + ds[0].text + ")");
    			ds = timeractive_.sort(dynamicsort("finish_full", "desc"));
    			$$invalidate(3, lastfinish = ds[0].finish_at + " (" + ds[0].text + ")" + "<br /> <span class=\"timer-" + ds[0].tid + "\"></span>");
    			ds = timeractive_.sort(dynamicsort("finish_full", "asc"));
    			$$invalidate(5, earlyfinish = ds[0].finish_at + " (" + ds[0].text + ")" + "<br /> <span class=\"timer-" + ds[0].tid + "\"></span>");
    			$$invalidate(4, timeractive = ds.length);
    		} else {
    			count = 1;
    		}
    	}

    	function addTimer() {
    		if (!maxminutes || maxminutes < 1) {
    			alert("max minutes harus lebih besar dari 0");
    			return;
    		}

    		let xstart_at = new Date();
    		let xfinish_at = new Date(xstart_at.getTime() + maxminutes * 60000);
    		let xstart = xstart_at;
    		let xfinish = xfinish_at;

    		xstart = (xstart.getHours() < 10
    		? "0" + xstart.getHours()
    		: xstart.getHours()) + ":" + (xstart.getMinutes() < 10
    		? "0" + xstart.getMinutes()
    		: xstart.getMinutes()) + ":" + (xstart.getSeconds() < 10
    		? "0" + xstart.getSeconds()
    		: xstart.getSeconds());

    		xfinish = (xfinish.getHours() < 10
    		? "0" + xfinish.getHours()
    		: xfinish.getHours()) + ":" + (xfinish.getMinutes() < 10
    		? "0" + xfinish.getMinutes()
    		: xfinish.getMinutes()) + ":" + (xfinish.getSeconds() < 10
    		? "0" + xfinish.getSeconds()
    		: xfinish.getSeconds());

    		$$invalidate(1, timers = timers.concat({
    			tid: count,
    			remove: false,
    			text: "Timer ke-" + count,
    			start_at: xstart,
    			finish_at: xfinish,
    			maxminute: maxminutes,
    			start_full: xstart_at,
    			finish_full: xfinish_at,
    			done: false
    		}));

    		count += 1;
    		console.log(timers);
    		TimeInfo();
    	}

    	function rmv() {
    		let idtimer = this.parentNode.innerText.replace("Timer ke-", "");

    		var timerIntervalID = timers.filter(function (timer) {
    			return timer.tid == idtimer;
    		});

    		console.log(timerIntervalID);

    		if (confirm("Hapus " + this.parentNode.innerText + "?")) {
    			clearInterval(timerIntervalID[0]["timercontrol"]);

    			//this.parentNode.parentNode.remove();
    			timers.forEach(function (a, b) {
    				if (a.tid == idtimer) {
    					$$invalidate(1, timers[b].remove = true, timers);
    					TimeInfo();
    				}
    			});
    		} //console.log(timers_rmv_arr, timers)
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function input_input_handler() {
    		maxminutes = to_number(this.value);
    		$$invalidate(0, maxminutes);
    	}

    	$$self.$capture_state = () => ({
    		PlusCircleIcon,
    		PlusSquareIcon,
    		ChevronsDownIcon,
    		StopCircleIcon,
    		CheckCircleIcon,
    		ClockIcon,
    		TargetIcon,
    		Trash2Icon,
    		count,
    		maxminutes,
    		timers,
    		hours,
    		minutes,
    		seconds,
    		firststart,
    		lastfinish,
    		timeractive,
    		earlyfinish,
    		alertvoice,
    		countdown,
    		countdwn,
    		dynamicsort,
    		TimeInfo,
    		addTimer,
    		rmv
    	});

    	$$self.$inject_state = $$props => {
    		if ("count" in $$props) count = $$props.count;
    		if ("maxminutes" in $$props) $$invalidate(0, maxminutes = $$props.maxminutes);
    		if ("timers" in $$props) $$invalidate(1, timers = $$props.timers);
    		if ("hours" in $$props) hours = $$props.hours;
    		if ("minutes" in $$props) minutes = $$props.minutes;
    		if ("seconds" in $$props) seconds = $$props.seconds;
    		if ("firststart" in $$props) $$invalidate(2, firststart = $$props.firststart);
    		if ("lastfinish" in $$props) $$invalidate(3, lastfinish = $$props.lastfinish);
    		if ("timeractive" in $$props) $$invalidate(4, timeractive = $$props.timeractive);
    		if ("earlyfinish" in $$props) $$invalidate(5, earlyfinish = $$props.earlyfinish);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		maxminutes,
    		timers,
    		firststart,
    		lastfinish,
    		timeractive,
    		earlyfinish,
    		countdwn,
    		addTimer,
    		rmv,
    		count,
    		hours,
    		minutes,
    		seconds,
    		countdown,
    		TimeInfo,
    		input_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
