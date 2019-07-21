let currentWatcher = null;
/**
 * 遍历dom 节点，将vue data中的数值渲染
 */
function getValueFromVm(vm, path) {
    return path.split('.').reduce((object, key) => {
        return object[key]
    }, vm)
}
function Compile(vm) {
    vm.$el = document.querySelector(vm.$options.el);
    const fragment = document.createDocumentFragment();
    fragment.append(...vm.$el.children)
    const reg = /\{\{(.*?)\}\}/g
    function replaceNode(node) {
        const txt = node.textContent
        if (node.nodeType === Node.TEXT_NODE && reg.test(txt)) {
            function replaceTxt() {
                node.textContent = txt.replace(reg, (match, placeholder) => {
                    currentWatcher = new Watcher(replaceTxt)
                    const value = getValueFromVm(vm, placeholder)
                    currentWatcher = null;
                    return value;
                })
            }
            replaceTxt()
        }
        if (node.childNodes && node.childNodes.length) {
            replaceNodes(node)
        }
    }
    function replaceNodes(nodes) {
        Array.from(nodes.childNodes).forEach(node => {
            replaceNode(node);
        })
    }
    replaceNodes(fragment)
    vm.$el.appendChild(fragment)
}
/** 
 * 遍历vue 的data, 劫持set, get 属性 
 */
function observer(value) {
    if (typeof value === "object" && value !== null) {
        return Observer(value);
    }
    return value;
}

function Observer(value) {
    const dep = new Dep()
    value = new Proxy(value, {
        get(target, property, proxyArr) {
            console.log(target, property)
            if (currentWatcher) {
                dep.addSub(currentWatcher)
            }
            return target[property];
        },
        set(target, property, value, receiver) {
            target[property] = value;
            dep.notify();
            return true
        }
    });
    Object.keys(value).forEach(key => {
        value[key] = observer(value[key]);
    })
    return value;
}
function dataProxy(vm) {
    Object.keys(vm._data).forEach(key => {
        Object.defineProperty(vm, key, {
            configurable: true,
            get() {
                return vm._data[key];
            },
            set(newVal) {
                vm._data[key] = newVal
            }
        })
    })
}
function Vue(options) {
    this.$options = options;
    this._data = this.$options.data = observer(this.$options.data);
    dataProxy(this);
    Compile(this)
}

function Dep() {
    this.subs = [];
    this.addSub = (sub) => {
        this.subs.push(sub)
    }
    this.notify = () => {
        this.subs.forEach(sub => {
            sub.update()
        })
    }
}
function Watcher(fn) {
    currentWatcher = this;
    this.fn = fn;
    this.update = () => {
        this.fn()
    }
    currentWatcher = null;
}
const app = new Vue({
    el: '#app',
    data: {
        title: 'MVVM',

        add: {
            a: 1,
            b: 2,
            sum: 3
        }
    }
})
window.app = app
console.log(app)
