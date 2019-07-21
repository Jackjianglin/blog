
function Observer(object) {
    let dep = new Dep()
    for (const key in object) {
        let val = object[key];
        observer(val);
        Object.defineProperty(object, key, {
            configurable: true,
            get() {
                Dep.target && dep.addSub(Dep.target);
                return val;
            },
            set(newVal) {
                if (newVal === val) {
                    return;
                }
                val = newVal;
                observer(newVal)
                dep.notify();
            }
        })
    }
}
function initComputed() {
    const vm = this;
    const computeds = this.$options.computed;
    Object.keys(computeds).forEach(key => {
        Object.defineProperty(vm, key, {
            get: typeof computeds[key] == "function" ? computeds[key] : computeds[key].get
        })
    })
}
function Mvvm(options = {}) {
    this.$options = options;
    let data = this._data = this.$options.data;
    observer(data);
    for (const key in data) {
        Object.defineProperty(this, key, {
            configurable: true,
            get() {
                return this._data[key];
            },
            set(newVal) {
                this._data[key] = newVal
            }
        })
    }
    initComputed.call(this);
    new Compile(this.$options.el, this);
    this.$options.mounted.call(this);
}
// function Mvvm(options = {}) {
//     console.log(this)
//     // vm.$options Vue上是将所有属性挂载到上面
//     // 所以我们也同样实现,将所有属性挂载到了$options
//     this.$options = options;
//     // this._data 这里也和Vue一样
//     let data = this._data = this.$options.data;

//     // 数据劫持
//     // observe(data);
// }

const observer = (data) => {
    if (!data || typeof data !== "object") {
        return
    }
    return new Observer(data);
}
function Compile(el, vm) {
    vm.$el = document.querySelector(el);
    const fragment = document.createDocumentFragment();
    while (child = vm.$el.firstChild) {
        fragment.appendChild(child);
    }

    function replace(frag) {
        Array.from(frag.childNodes).forEach(node => {
            const txt = node.textContent;
            let reg = /\{\{(.*?)\}\}/g
            if (node.nodeType === 3 && reg.test(txt)) {
                function replaceTxt() {
                    node.textContent = txt.replace(reg, (matched, placholder) => {
                        new Watcher(vm, placholder, replaceTxt)
                    })
                    return placholder.split('.').reduce((val, key) => {
                        return val[key]
                    }, vm)
                }
                replace()
            }
            if (node.nodeType === 1) {
                const nodeAttrs = node.attributes;
                Array.from(nodeAttrs).forEach(attr => {
                    const { name, value } = attr;
                    if (name === "v-model") {
                        node.value = vm[value];
                        new Watcher(vm, value, newVal => {
                            node.value = newVal
                        });

                        node.addEventListener('input', e => {
                            const newVal = e.target.value;
                            vm[value] = newVal;
                        })
                    }
                });


            }
            if (node.childNodes && node.childNodes.length) {
                replace(node)
            }
        })
    }
    replace(fragment)
    vm.$el.appendChild(fragment)
}
function Dep() {
    this.subs = [];
}
Dep.prototype = {
    addSub(sub) {
        this.subs.push(sub)
    },
    notify() {
        this.subs.forEach(res => res.update())
    }
}
function Watcher(vm, exp, fn) {
    this.fn = fn;
    this.vm = vm;
    this.exp = exp;

    Dep.target = this;
    let arr = exp.split('.');
    let val = vm;
    arr.forEach(res => {
        vl = val[res]
    })
    Dep.target = null;
}
Watcher.prototype.update = function () {
    let arr = this.exp.split('.');
    let val = this.vm;
    arr.forEach(key => {
        val = val[key];   // 通过get获取到新的值
    });
    this.fn(val);
}
const app = new Mvvm({
    el: '#app',
    data: {
        a: 1,
        b: 2,
        // c: { d: 2 }
    },
    mounted() {
        const vm = this;
        setTimeout(() => {
            vm.b = "初始化生命周期"
        }, 1000)
    },
    computed: {
        c() {
            return this.a + this.b
        }
    }
})

window.app = app