# Vue 源码阅读周记(一)

​	好多次想系统的看下`Vue` 源码， 但每次都是看个开头就看不下去了，![](http://wx4.sinaimg.cn/mw690/6a04b428gy1fykn6hpilag204q03twf3.gif)这次希望不会半途而废。

​	在后续的一段时间里，系统的把`Vue` 源码阅读一遍，把阅读的收获记录下来，希望能每周出一篇文章，不对自己拖更，断更。

​	这第一篇文章，并不是系统完整的开始，而是一些最近学到的关于`MVVM`原理的实现。

![](http://ww4.sinaimg.cn/bmiddle/6af89bc8gw1f8qo64mk0dg204602w74b.gif)

## 数据驱动

​	`MVVM` 这个东西，相信现代的前端er 都非常熟悉，毕竟 `jQuery`的时代早已经过去，现在的前端处于框架时代。

​	`MVVM` 是怎么把我们的具体数据映射到视图上的？ 又是怎么做到改变数据，视图跟着就被改变的？且听我一一道来，这篇文章对每个步骤介绍的极其详细，对初学者极其友好。

​	来吧，让我们开始写我们的实例吧，边看边写，效果更棒哦！

​	![](http://wx4.sinaimg.cn/mw690/6a04b428gy1g0zywc31z3g204g0564bj.gif)

### 一个简单的大纲

​	首先，一个入口，名字就叫 `MyVue` 吧，我们把一些配置项传进去，现阶段，配置项中只需要有数据就可以了。

​	接着，我们对配置项中的数据遍历，进行响应式处理。

​	然后，对我们的`html` 视图遍历，将视图中的预留数据位置，进行数据填充。

​	最后构造一个发布订阅模式，在第一次视图中数据填充时，将数据填充事件放在事件池中，当响应式数据变动时发布事件。

​	代码大纲如下：

```javascript

/**
 * 对数据进行响应式处理
 * @param {Object} data 
 */
function observer(data) {}

/**
 * 遍历html，进行数据替换，并且触发依赖收集
 */
function compile() {}

/**
 * 存放事件，发布更新
 */
function Dep() {}

/**
 * 入口
 * @param {Object} options 配置项
 */
function MyVue(options) {
    this.$options = options;
    this._data = this.$options.data;
    observer(this._data);
    compile();
}
```

### 详细步骤

​	 1. 创建一个文件夹，文件夹中新建一个`html` 文件，和`js` 文件，`html`中引入`js`，打开浏览器，把`html` 丢进去，效果还是在浏览器中看比较实在。`html` 中放入一些如下内容，像用Vue 时一样。

```html
<body>
    <div id="app">
        <h1>{{title}}</h1>
        <div>
           {{add.a}} + {{add.b}} = {{add.sum}}
        </div>
    </div>
    <script src="./MyVue.js"></script>
</body>
```

​	这个就是过会我们想实现的简单视图。

 2. 我们把我们上面的代码大纲拷贝到`js` 文件中，可以开始动手实践了，先来 `new` 一个 `MyVue`

    ```javascript
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
    ```

    把`MyVue`实例挂在`window`上，过会好操作，便于看到，数据变动后的视图情况。

    这里有一个知识点，`new` 一个函数，就不止是普通的函数调用，反而变成了`new` 一个`class` , 而这个函数就是`class` 的构造函数。

	3. 这一步，我们开始对数据进行响应式处理了，简单来说就是劫持数据，就用`es6` 提供的`Proxy`，多多学习，多多收获。

```javascript

/**
 * 对数据进行响应式处理
 * @param {Object} data 
 */
function observer(data) {
    if (typeof data !== "object" || data === null) {
        return data;
    }
    const dataProxy = new Proxy(data, {
        get(target, property, pduiroxyArr) {
            return target[property];
        },
        set(target, property, value, receiver) {
            target[property] = value;
            return true
        }
    });
    Object.keys(dataProxy).forEach(key => {
        dataProxy[key] = observer(dataProxy[key]);
    })
    return dataProxy;
}
```

`Proxy` 只能对对象进行代理，我们通过递归，来做到给对象进行完全彻底的劫持。

4. 然后我们再将`data` 中的属性映射到`MyVue` 上，方便后续操作，就像在`Vue` 中通过`this` 去访问`props`,`data`,以及其他属性一样

   ```JavaScript
   
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
       compile();
   }
   ```

   5. 接下来是视图层面的替换了，无论过去的`jQuery` 还是现代的响应式框架，最终的还是要输出`html` 给浏览器，`html` + `js` + `css` 从来都没有落伍。

      ```javascript
      
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
                  replaceTxt()
              }
              if (node.childNodes && node.childNodes.length) {
                  replaceNodes(node)
              }
          }
          // 遍历 nodes
          function replaceNodes(nodes) {
              Array.from(nodes.childNodes).forEach(node => {
                  replaceNode(node);
              })
          }
          replaceNodes(fragment)
          // 将替换值的dom 节点重新放入dom 树
          vm.$el.appendChild(fragment)
      }
      ```

      在这一步我们遍历我们的dom 树， 遇到 text node ，就将符合{{*}} 写法的值给替换上去。

      这个时候我们再将我们的html 放在浏览器中发现，视图已经被渲染了如下

       ![start](https://raw.githubusercontent.com/Jackjianglin/blog/master/vue/%E5%9F%BA%E7%A1%80%E5%8F%8C%E5%90%91%E7%BB%91%E5%AE%9A/image/start.png)



但是这个时候我们的视图还不是响应式的，我们只是进行了初始化的视图渲染，在数据改变时，视图并不会发生变化。 

我们接下来需要收集依赖，发布数据改变事件，视图相应。

6 我们定义一个依赖收集的类，在数据劫持的位置，在 get 时，收集依赖，set 时发射更新事件。

```javascript
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
```

更新我们的observer 函数

```javascript
let currentWatcher = null

function observer(data) {
    ......
    const dep = new Dep()
    ......
    const dataProxy = new Proxy(data, {
        get(target, property, proxyArr) {
          	......
            if (currentWatcher) {
                dep.addSub(currentWatcher)
            }
            ......
            return target[property];
        },
        set(target, property, value, receiver) {
            target[property] = value;
            .......
            dep.notify();
            ......
            return true
        }
    });
}
```

更新我们的compile 函数

```javascript
function Compile(vm) {
    ......
            currentWatcher = new Watcher(replaceTxt)
            replaceTxt()
            currentWatcher = null;
    ......
}
```

在这一步的难点在于怎么做才可以，把observer 和compile 联合起来，去收集视图中的依赖，仔细想想，单线程代码都是逐行执行，在视图中数据替换时，必然要访问劫持数据中的get ，这样用一个全局变量 `currentWatcher`

来做数据传递，就水到渠成了。

![](http://wx4.sinaimg.cn/mw690/6a04b428gy1fzy78qjmomg206o06ojsg.gif)

这个时候，我们再直接更改数据，就会导致视图的刷新，做到数据驱动了。如下图

![end](https://raw.githubusercontent.com/Jackjianglin/blog/master/vue/%E5%9F%BA%E7%A1%80%E5%8F%8C%E5%90%91%E7%BB%91%E5%AE%9A/image/end.png)

### 完整JS 代码

```javascript
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
```



## 结语

这篇文章只是一个初步的开始，还有很多值得探索优化的地方，比如依赖收集是挂在父级节点上的，当我们修改一个值时，会导致同级节点的更新等等。

> 纸上得来终觉浅，绝知此事要躬行

最后，希望自己下周不要托更。

## 参考

[不好意思！耽误你的十分钟，让MVVM原理还给你](https://juejin.im/post/5abdd6f6f265da23793c4458#heading-13)

