---
title: Mock服务的原理和实现
date: 2022-12-05 17:10:41
tags: [java,mock,jdk,双亲委派,classloader]
---

### Java Agent
Java agent本质上可以理解为一个插件，该插件就是一个精心提供的jar包，这个jar包通过JVMTI完成加载。核心是Instrument，开发者可以使用Instrument构建一个代理，从而检测运行在JVM上的程序。
Instrument包里面的ClassFileTransformer提供transform方法，通过这个方法对已加载类的字节码进行修改。

> Instrument提供了Java语言插入代码的服务，实在方法中添加字节码，以便收集使用的数据。Instrument只提供插入代码服务，在方法中添加字节码，至于具体的字节码操作，有由字节码操作工具来实现的。常见的字节码操作工具包括：CGLIB，javassist, ASM等。

Java-Agent、Instrument、ASM工具之间的关系如下：
![image](/images/Java-Instrument.png)

### Proxy-Agent
Proxy-Agent是一个常驻内存的程序，启动后通过Attach API动态Attach到目标业务进程中。Proxy-Agent的事件监听模块会接收Mock指令，并从已加载的类中找到对应的代理对象，然后利用Java Agent改写代码。

### 双亲委派
站在java虚拟机的角度看，JVM支持两种加载器，分别为引导类加载器（BootstrapClassLoader）和自定义类加载器。从概念上来说自定义加载器一般是程序中由开发人员定义的一类加载器，然而java虚拟机规范中并没有这样定义，而是将所有派生于抽象类ClassLoader的类加载器都划分为自定义加载器。

一般来说在java8以及以前的版本都会用到如下三种加载器：
启动类加载器（Bootstrap Class Loader）
扩展类加载器（Extension Class Loader）
应用类加载器（Application Class Loader)

#### 启动类加载器
该加载器使用C++实现（不会继承ClassLoader），是虚拟机自身的一部分。该类加载器主要是负责加载存放在JAVA_HOME\lib目录，或者被-Xbootclasspath参数指定路径存放的，并且是java虚拟机能识别的类库加载到虚拟机内存中。（eg:主要是加载java的核心类库，即加载lib目录下的所有class）

#### 扩展类加载器
 这个类加载器主要是负责加载JAVA_HOME\lib\ext目录中，或者被java.ext.dirs系统变量所指定的路径中所有类库

#### 应用类加载器
这个类的加载器是由sun.misc.Launcher$AppClassLoader来实现，因为该加载器是ClassLoader类中的getSystemClassLoader()方法的返回值，所以一般也称为该加载器为系统类加载器。该加载器主要是加载用户类路径上所有的类库，如果应用程序中没有定义过自己的类加载器，一般情况下这个就是程序的默认加载器。

> 线程上下文类加载器（context class loader）是从 JDK 1.2 开始引入的。类 java.lang.Thread中的方法 getContextClassLoader()和 setContextClassLoader(ClassLoader cl)用来获取和设置线程的上下文类加载器。如果没有通过 setContextClassLoader(ClassLoader cl)方法进行设置的话，线程将继承其父线程的上下文类加载器。Java 应用运行的初始线程的上下文类加载器是应用类加载器。在线程中运行的代码可以通过此类加载器来加载类和资源。

类加载过程如下图所示
![image](/images/double-parent.jpg)


#### 打破双亲委派
就是不按照如上委派父加载器加载的执行逻辑，由业务自己加载自己的代码，或则由父加载器委派子加载器加载指定类的行为。
JDBC是JAVA定义的规范。MYSQL，Oracle等公司基于JDBC实现自己的业务包。业务调用JDBC的类加载过程为：Biz逐层委派到启动加载器加载JDBC业务实现代码，启动类加载器从jrt.jar找不到，通过ThreadLocal获取到ApplicationClassLoad实例，并通过ACL去加载JDBC实现类。这样业务代码只需要将具体要用到的DB JDBC连接包包含到自己的业务代码下就能被JVM加载并识别。

### 代码隔离
#### 为什么需哟隔离
Proxy-Agent代码与业务代码可能存在冲突，为不干扰业务代码，引擎的代码要与业务代码进行隔离

#### 怎么隔离
通过打破双亲委派机制做，具体方法是定义引擎自己得类加载器，然后只让引擎classLoader自己加载引擎代码，不需要继续向上查找。由于同样签名的类被不同的类加载器加载时会被识别为不同的类。所以这与Proxy-Agent中的代码和Biz的代码实现完全隔离，如下图所示：
![image](/images/double-parent-break.jpg)

#### 业务代码无法识别ProxyAgent类
在实际的代码中，业务代码中可能要插入ProxyAgent的代码，按上面设计，业务代码会找不到ProxyAgent代码。怎么解决呢？
解决方案参考JDBC，我们定义的ProxyAgent也可以参考上面方法，首先定义一个proxyagent-spy.jar。这个jar中定义了可能会被业务代码用到的各种方法。然后Agent通过反射动态修改spy中的实现。业务代码可以看到spy中的代码，所以可以直接使用相关的方法。

#### ProxyAgent识别不了业务代码的类
在某些场景下，Agent需要识别业务代码，比如需要获取是否有压测标等信息。这时Agent就需要识别到业务代码。怎么做？
还是参考JDBC，我们可以通过ThreadLocal方式去加载业务代码。具体过程是，业务代码在执行到Agent逻辑时，将当前线程上下文加载器放入ThreadLocal。随后Agent加载业务代码时，从ThreadLocal获取加载器加载对应的类即可。

### 热插拔机制
对于业务而言，故障演练可以随时进行，进行后也可以随时恢复。最好是故障演练结束后要让系统恢复到最开始的状态。这就要求Agent具备热插拔机制。也就是按需加载和卸载的能力。
按需加载：Agent在接收到命令后才开始Attach业务进程
按需卸载：Agent收到卸载命令后，会将自己卸载掉。具体过程如下：
1. 恢复代码：Agent在修改代码之前会先把原始代码保存，等卸载时，会将原始代码恢复。
2. 资源回收：代理期间用到的网络，端口，缓存等释放
3. 内存释放：直接关闭AgentClassLoader就可以将涉及的类释放。
