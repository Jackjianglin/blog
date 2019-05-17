# flutter 3D 卡片 翻转

## 预览

![](https://github.com/Jackjianglin/blog/blob/master/static/img/flipcard/flipcard.gif?raw=true)

## 原理

![](https://github.com/Jackjianglin/blog/blob/master/static/img/flipcard/code.png?raw=true)

用 `Matrix4.identity()..setEntry(3, 2, 0.002)` 配出透视效果。

大力感谢 [使用 Flutter 制作 3D 翻转动画](https://juejin.im/post/5b5534c951882562b9248294) 这篇文章。

整个动画翻转了 `PI` 角度，为了达到，翻转后不是镜像画面效果，我把动画分成了  `0 -> PI/2` 和 `1.5PI -> 2PI` 角度

[源代码](https://github.com/Jackjianglin/blog/blob/master/code/flip-card-component.dart)

