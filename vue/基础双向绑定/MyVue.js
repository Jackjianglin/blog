let currentWatcher = null
/**
 * 对数据进行响应式处理
 * @param {Object} data 
 */
function observer(data) {
    if (typeof data !== "object" || data === null) {
        return data;
    }
    const dep = new Dep()
    const dataProxy = new Proxy(data, {
        get(target, property, proxyArr) {
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
    Object.keys(dataProxy).forEach(key => {
        dataProxy[key] = observer(dataProxy[key]);
    })
    return dataProxy;
}

/**
 * 遍历html，进行数据替换，并且触发依赖收集
 */
function compile(vm) {
    vm.$el = document.querySelector(vm.$options.el);
    // 在内存中操作，避免一点一点在实际dom 中操作，提升性能
    const fragment = document.createDocumentFragment();
    fragment.append(...vm.$el.children)

    // 获取 如add.a 的值 => this[add][a]
    function getValueFromVm(vm, path) {
        return path.split('.').reduce((object, key) => {
            return object[key]
        }, vm)
    }
    // 搜索{{}} 的正则
    const reg = /\{\{(.*?)\}\}/g
    // 替换 TEXT_NODE 中的值
    function replaceNode(node) {
        const txt = node.textContent
        if (node.nodeType === Node.TEXT_NODE && reg.test(txt)) {
            function replaceTxt() {
                node.textContent = txt.replace(reg, (match, placeholder) => {
                    const value = getValueFromVm(vm, placeholder)
                    return value;
                })
            }
            currentWatcher = new Watcher(replaceTxt)
            replaceTxt()
            currentWatcher = null;
        }
        if (node.childNodes && node.childNodes.length) {
            replaceNodes(node)
        }
    }
    // 搜索 nodes
    function replaceNodes(nodes) {
        Array.from(nodes.childNodes).forEach(node => {
            replaceNode(node);
        })
    }
    replaceNodes(fragment)
    // 将替换值的dom 节点重新放入dom 树
    vm.$el.appendChild(fragment)
}

/**
 * 存放事件，发布更新
 */
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
/**
 * 规范响应事件函数
 * @param {Function} fn 响应事件 
 */
function Watcher(fn) {
    this.fn = fn;
    this.update = () => {
        this.fn()
    }
}
/**
 * 入口
 * @param {Object} options 配置项
 */
function MyVue(options) {
    this.$options = options;
    this._data = this.$options.data;
    // 响应式处理
    this._data = observer(this._data);
    // 劫持data 的属性到vm 上
    Object.keys(this._data).forEach(key => {
        Object.defineProperty(this, key, {
            configurable: true,
            get() {
                return this._data[key];
            },
            set(newVal) {
                this._data[key] = newVal
            }
        })
    });
    compile(this);
}

const app = new MyVue({
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
window.app = app;