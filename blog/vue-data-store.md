# vue前进刷新，后退缓存的一二三四五种想法

		在单页应用中，尤其在移动设备中，经常会有保持页面状态的情况，最佳效果是实现类似于原生应用中的前进刷新，后退保存页面状态。如果能解决路由回退传参，那就更妙了。

### vuex: 纯手工操作

### keep-alive： 手动版

	只要在activated 的生命周期处，分流好不同页面过来的对应处理，效果是很棒的。
	
	这个组件的主要目的应该是为了组件的复用，用内存换性能，单单为了保存页面数据，有一种杀鸡用牛刀的感觉。现在的设备性能都那么强，vue 的优化又这么棒，用起来也无妨。

### keep-alive： 自动版

	配合vue-router 让组件动态的keep-alive
	
	这个也是用搜索引擎搜索vue 前进刷新，后退缓存，经常搜到的实现方式，但我写出来的总有bug，进而感觉逻辑都有问题，根据keep-alive 的生命周期来看，动态设置keep-alive 时，生效的时机应该在activated 之前。
	
	假设有A->B->C 这样一个页面跳转，在进入B 页面的初始化生命周期时，是把keep alive的属性设为true 还是false，肯定是true 了，不然去了C 页面，再回B 页面就没有B 页面的缓存效果了， 如果缓存了B 页面，返回A页面后，再去B页面是true 还是false, 是true 的话，页面用了上一次的页面，测试要来提bug了， false的话，去了C 页面就回不来了

### 手写缓存data 的mixins

	在页面destroyed 的时候，保存页面的$data， 在页面created 的时候把保存的数据还回去，这种写法和上面的keep-alive 手动版相比，只缓存了数据，在组件初始化的时候也要做不同页面的分流处理。
	
	缺陷是给组件的\$data 直接赋值会报错，通过Object.assign($data,data)的方式可以赋值成功，并且在测试中可以完美运行，但是总感觉有隐藏bug

### 手写mixins 组件配合vue-router 

	这个和上面的vue-router  配合keep-alive 不一样。

## 其他

### 关于如何判断页面是前进还是后退

	在用vue-router 时，用一个对象缓存beforeRouteEnter 中to.name, 值为from.name,  比如cache[to.name] = from.name;
	
	一开始如果cache[to.name]的值是undefined，就代表第一次进入这个组件，是前进，否则是后退。另外还可以提供一个由组件页面说，那些页面到我这是前进，那些页面到我这是后退的接口。

### 关于更妙了的路由回退传参。

​	通过这样的mixins配合vue-router ，约定一个对象，应该也能解决吧。

