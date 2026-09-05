---
title: 【LogicPro学习-01】:认识界面
date: 2022-11-12 23:05:31
tags: [音乐,编曲,mac,logic pro]
---

### 语言设置
因为我的mac设置的语言是英文，所以预装的logic pro也是英文界面。对于我这种编曲小白来说，本来入门就很困难了，英文界面简直是难上加难。所以需要设置成中文。

<img style="margin-left: 10px;box-shadow: 10px 10px 10px rgba(0,0,0,.5);" src="/posts/logicpro学习01/sys-version.jpg" width="1308" height="762" />

不知道是新版系统的问题还是新版Logic Pro的问题，我硬是从Logic没找到语言设置的入口。最后经过一番查询，发现可以从MAC系统设置里弄。具体操作如下：

首先进入系统设置，随后点击地区和语言设置
<table>
    <tr>
        <td><img src="/posts/logicpro学习01/sys-set-01.jpg" width="1560" height="1582" /></td>
        <td><img src="/posts/logicpro学习01/sys-set-02.jpg" style="max-height: 100%;" width="1560" height="1286" /></td>
    </tr>
</table>

从上面入口进入APP语言设置界面
<img style="margin-left: 10px;box-shadow: 5px 5px 5px rgba(0,0,0,.5);" src="/posts/logicpro学习01/sys-set-03.jpg" width="1472" height="1198" />
注意，如果APP列表中没有Logic Pro，点击左下角的加号，把APP加进去就可以了。

### 进入界面
点击APP打开logic pro，第一次打开会有一个工程引导界面。从这个界面中可以创建一个空白工程，或则创建一个实时循环乐段(这个不知道是啥)
除了工程创建引导，还有一些新手教程和demo演示菜单。对新手应该比较友好，虽然我还没有具体都进去操作。
<img style="margin-left: 10px;box-shadow: 5px 5px 5px rgba(0,0,0,.5);" src="/posts/logicpro学习01/logic-01.jpg" width="2220" height="1204" />

我们选择创建空白工程后，会进入工作空间。这时界面最前方会有个创建音轨的提示框。这几种音轨的具体介绍如下：

|音轨类型|说明|
|---|---|
|软件乐器|一般是外接音源，比如MIDI等，这个音轨目测比较常用，虽然我现在还没有MIDI|
|音频|就是直接输入的音频，如录制的声音，导入的音频文件等|
|鼓手|主要是一些架子鼓乐器的音轨|
|外部MIDI|不常用|
|吉他或则贝司|顾名思义，就是吉他这类乐器的音轨|
---
先说下我对这几个音轨的理解，这里设置这么多类型的初始音轨主要是为了给编曲人员快速适配一些系统资源。因为不同的音轨Logic会匹配不同的乐器资源，方便编曲人员取用。这里可以随便选一个，因为一首音乐一般不会只有一个音轨。我们创建好初始音轨之后，再工程中可以随时增删音轨。
<img style="margin-left: 10px;box-shadow: 5px 5px 5px rgba(0,0,0,.5);" src="/posts/logicpro学习01/logic-02.jpg" width="1588" height="1092" />

接下来进入工作区
<img src="/posts/logicpro学习01/logic-04.jpg" width="3016" height="1808" />
如上图所示：
1）为资源库，内置了很多音源套件资源。虽然目前还不知道这些资源怎么用，但是据说这部分是Logic最值钱的部分之一。
2)8)9)10) 检查器，点开检查器，会在logic左侧栏展示片段和音轨信息。片段不知道是做啥的，这里先不说。音轨信息比较有用。可以条件音轨的左右声道信息，比如音量，比如增益，添加均衡器(目测这个是核心)。当然通过这个工具栏也可以操作Mute某个音轨，或则对某个音轨独奏（M,S）按钮。也可以对选定音轨进行声音录制(R)按钮。
4) 音轨信息，音轨详细信息以及调节按钮在检查器中都有
5）节拍，速度等，这部分是一些音乐信息，我了解的不多，先不说。
6）节拍器，启动节拍器就会有节拍鼓点，帮助演唱人或则编曲人进行节拍控制
7）音频区，是音频录入后的可视化区间，用来对音频进行各种操作。比如调节，截切，复制等

最后，我们看一下Logic内置的Demo工程全貌，音乐很好听，但是音轨信息真心复杂。
<img src="/posts/logicpro学习01/logic-05.jpg" width="3016" height="1808" />
