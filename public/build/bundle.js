
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

    const file$8 = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (136:0) {#each timers as timer}
    function create_each_block(ctx) {
    	let div6;
    	let div0;
    	let h4;
    	let t0;
    	let t1_value = /*timer*/ ctx[12].tid + "";
    	let t1;
    	let t2;
    	let button;
    	let t3;
    	let div4;
    	let div1;
    	let t4;
    	let span0;
    	let t5_value = /*timer*/ ctx[12].maxminute + "";
    	let t5;
    	let t6;
    	let t7;
    	let div2;
    	let t8;
    	let span1;
    	let t9_value = /*timer*/ ctx[12].start_at + "";
    	let t9;
    	let t10;
    	let div3;
    	let t11;
    	let span2;
    	let t12_value = /*timer*/ ctx[12].finish_at + "";
    	let t12;
    	let t13;
    	let div5;
    	let mark;
    	let mark_id_value;
    	let countdwn_action;
    	let t14;
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
    			add_location(h4, file$8, 138, 6, 3786);
    			attr_dev(button, "class", "xprimary rmv svelte-4xzlv5");
    			add_location(button, file$8, 139, 6, 3822);
    			attr_dev(div0, "class", "section");
    			add_location(div0, file$8, 137, 4, 3758);
    			attr_dev(span0, "class", "justinfo svelte-4xzlv5");
    			add_location(span0, file$8, 146, 33, 3999);
    			add_location(div1, file$8, 145, 6, 3960);
    			attr_dev(span1, "class", "justinfo svelte-4xzlv5");
    			add_location(span1, file$8, 149, 32, 4110);
    			add_location(div2, file$8, 148, 6, 4072);
    			attr_dev(span2, "class", "justinfo svelte-4xzlv5");
    			add_location(span2, file$8, 152, 37, 4219);
    			add_location(div3, file$8, 151, 6, 4176);
    			attr_dev(div4, "class", "section");
    			add_location(div4, file$8, 144, 4, 3932);
    			attr_dev(mark, "id", mark_id_value = /*timer*/ ctx[12].tid);
    			add_location(mark, file$8, 157, 6, 4334);
    			attr_dev(div5, "class", "section to-center svelte-4xzlv5");
    			add_location(div5, file$8, 156, 4, 4296);
    			attr_dev(div6, "class", "card fluid svelte-4xzlv5");
    			add_location(div6, file$8, 136, 2, 3729);
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
    				listen_dev(button, "click", /*rmv*/ ctx[4], false, false, false),
    				action_destroyer(countdwn_action = /*countdwn*/ ctx[2].call(null, mark))
    			];
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*timers*/ 2) && t1_value !== (t1_value = /*timer*/ ctx[12].tid + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*timers*/ 2) && t5_value !== (t5_value = /*timer*/ ctx[12].maxminute + "")) set_data_dev(t5, t5_value);
    			if ((!current || dirty & /*timers*/ 2) && t9_value !== (t9_value = /*timer*/ ctx[12].start_at + "")) set_data_dev(t9, t9_value);
    			if ((!current || dirty & /*timers*/ 2) && t12_value !== (t12_value = /*timer*/ ctx[12].finish_at + "")) set_data_dev(t12, t12_value);

    			if (!current || dirty & /*timers*/ 2 && mark_id_value !== (mark_id_value = /*timer*/ ctx[12].tid)) {
    				attr_dev(mark, "id", mark_id_value);
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
    		source: "(136:0) {#each timers as timer}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let link;
    	let script;
    	let script_src_value;
    	let t0;
    	let main;
    	let h1;
    	let t2;
    	let centerx;
    	let div2;
    	let div1;
    	let div0;
    	let input;
    	let t3;
    	let button;
    	let t4;
    	let div3;
    	let t5;
    	let footer;
    	let center;
    	let p;
    	let current;
    	let dispose;
    	const pluscircleicon = new PlusCircleIcon({ props: { size: "30" }, $$inline: true });
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
    			link = element("link");
    			script = element("script");
    			t0 = space();
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Donut Timer";
    			t2 = space();
    			centerx = element("centerx");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t3 = space();
    			button = element("button");
    			create_component(pluscircleicon.$$.fragment);
    			t4 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			footer = element("footer");
    			center = element("center");
    			p = element("p");
    			p.textContent = "V8.C0d3 - 2020.05";
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://cdn.rawgit.com/Chalarangelo/mini.css/v3.0.1/dist/mini-default.min.css");
    			add_location(link, file$8, 1, 4, 18);
    			if (script.src !== (script_src_value = "https://code.responsivevoice.org/responsivevoice.js?key=rrTffgeB")) attr_dev(script, "src", script_src_value);
    			add_location(script, file$8, 3, 2, 130);
    			attr_dev(h1, "class", "svelte-4xzlv5");
    			add_location(h1, file$8, 116, 1, 3311);
    			attr_dev(main, "class", "svelte-4xzlv5");
    			add_location(main, file$8, 115, 0, 3303);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "id", "input_menit");
    			attr_dev(input, "placeholder", "minutes");
    			add_location(input, file$8, 123, 8, 3434);
    			attr_dev(button, "class", "xprimary svelte-4xzlv5");
    			add_location(button, file$8, 125, 8, 3536);
    			attr_dev(div0, "class", "col-sm");
    			add_location(div0, file$8, 122, 6, 3405);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file$8, 121, 4, 3381);
    			attr_dev(div2, "class", "container");
    			add_location(div2, file$8, 120, 2, 3353);
    			add_location(centerx, file$8, 119, 0, 3341);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$8, 134, 0, 3685);
    			add_location(p, file$8, 166, 4, 4459);
    			set_style(center, "color", "gray");
    			add_location(center, file$8, 165, 2, 4426);
    			add_location(footer, file$8, 164, 0, 4415);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, link);
    			append_dev(document.head, script);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, centerx, anchor);
    			append_dev(centerx, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*maxminutes*/ ctx[0]);
    			append_dev(div0, t3);
    			append_dev(div0, button);
    			mount_component(pluscircleicon, button, null);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div3, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			insert_dev(target, t5, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, center);
    			append_dev(center, p);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[11]),
    				listen_dev(button, "click", /*addTimer*/ ctx[3], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*maxminutes*/ 1 && to_number(input.value) !== /*maxminutes*/ ctx[0]) {
    				set_input_value(input, /*maxminutes*/ ctx[0]);
    			}

    			if (dirty & /*timers, rmv*/ 18) {
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
    						each_blocks[i].m(div3, null);
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
    			detach_dev(link);
    			detach_dev(script);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(centerx);
    			destroy_component(pluscircleicon);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t5);
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

    function instance$8($$self, $$props, $$invalidate) {
    	let { name } = $$props;
    	let count = 1;
    	let maxminutes = 40;
    	let timers = [];
    	let hours, minutes, seconds;

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
    						let elparent = el.parentNode.parentNode;
    						elparent.classList.add("error");
    						el.parentNode.remove();

    						//clearInterval(interval);
    						clearInterval(timerIntervalID[0]["timercontrol"]);

    						alertvoice(el.id);
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
    				el.innerHTML = minute_text + " " + seconds + " " + second_text + "";
    				seconds--;
    			},
    			1000
    		);
    	}

    	function countdwn(node) {
    		countdown(node, maxminutes, 0);
    	}

    	function addTimer() {
    		if (!maxminutes || maxminutes < 1) {
    			alert("max minutes harus lebih besar dari 0");
    			return;
    		}

    		let xstart_at = new Date();
    		let xfinish = new Date(xstart_at.getTime() + maxminutes * 60000);
    		let xstart = xstart_at;

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
    			done: false,
    			text: "Timer ke-" + count,
    			start_at: xstart,
    			finish_at: xfinish,
    			maxminute: maxminutes
    		}));

    		count += 1;
    	}

    	function rmv() {
    		let idtimer = this.parentNode.innerText.replace("Timer ke-", "");

    		var timerIntervalID = timers.filter(function (timer) {
    			return timer.tid == idtimer;
    		});

    		if (confirm("Hapus " + this.parentNode.innerText + "?")) {
    			clearInterval(timerIntervalID[0]["timercontrol"]);
    			this.parentNode.parentNode.remove();
    		}
    	}

    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function input_input_handler() {
    		maxminutes = to_number(this.value);
    		$$invalidate(0, maxminutes);
    	}

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(5, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		PlusCircleIcon,
    		PlusSquareIcon,
    		ChevronsDownIcon,
    		StopCircleIcon,
    		CheckCircleIcon,
    		ClockIcon,
    		TargetIcon,
    		Trash2Icon,
    		name,
    		count,
    		maxminutes,
    		timers,
    		hours,
    		minutes,
    		seconds,
    		alertvoice,
    		countdown,
    		countdwn,
    		addTimer,
    		rmv
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(5, name = $$props.name);
    		if ("count" in $$props) count = $$props.count;
    		if ("maxminutes" in $$props) $$invalidate(0, maxminutes = $$props.maxminutes);
    		if ("timers" in $$props) $$invalidate(1, timers = $$props.timers);
    		if ("hours" in $$props) hours = $$props.hours;
    		if ("minutes" in $$props) minutes = $$props.minutes;
    		if ("seconds" in $$props) seconds = $$props.seconds;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		maxminutes,
    		timers,
    		countdwn,
    		addTimer,
    		rmv,
    		name,
    		count,
    		hours,
    		minutes,
    		seconds,
    		countdown,
    		input_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { name: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[5] === undefined && !("name" in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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
