---
layout: post
title:  "锁·可重入锁"
date:   2017-03-01 08:00:57 +0800
categories: jekyll update
---
#### 锁
每一个java对象都有一个监视器，通过监视器，当有线程获进入到对象的特殊区域时，其他线程就不可以继续进入这个区域。其他线程会进入一个等待区，当特殊区域的线程消费完毕，等待线程中的某个线程可以进入特殊区域。

一个简单的锁demo

```java

//定义锁对象
class Lock{

    //是否锁定标识
    private boolean isLocked = false;

    public synchronized void lock() throws InterruptedException {
        while(isLocked){
            //调用lock的线程开始阻塞
            wait();
        }
        isLocked = true;
    }

    public synchronized void unlock(){
        isLocked = false;
        //将调用unlock方法的线程唤醒
        notify();
    }
}

public class LockDemo {

    private Lock lock = new Lock();
    private int count = 0;

    public int inc() throws InterruptedException {
        lock.lock();
        this.count++;
        lock.unlock();
        return  count;
    }


    public static void main(String[] args) throws InterruptedException {
        LockDemo demo = new LockDemo();
        demo.inc();
    }


}
```

代码说明：
当线程执行lock.lock();后，这个线程如果是第一个线程，那么可以继续执行，并标记isLocked=true。在第一个线程没有执行unlock之前，其他线程如果同样进入临界区，将会挂起(wait())。这些被挂起的线程进入等待队列。当第一个线程执行结束，调用了unlock()方法，等待队列中的一个线程被唤醒，开始执行临界区代码，后续执行与第一个线程类似。


#### 重入锁
同一个线程可以多次获取，之前获取到的锁。
在上面的例子中，加一个判断逻辑，如果是当前线程，就放行，其他线程就继续阻塞

```java
/**
 * 重入锁
 */
class ReenLock{

    //是否锁定标识
    private boolean isLocked = false;
    private Thread lockedThread = null;
    private int count = 0;

    public synchronized void lock() throws InterruptedException {
        Thread callingThread = Thread.currentThread();
        //锁定非锁定线程的其他线程
        while(isLocked&&lockedThread!=callingThread){
            //调用lock的线程开始阻塞
            wait();
        }
        lockedThread =  callingThread;
        isLocked = true;
        count++;
    }

    public synchronized void unlock(){
        if(lockedThread==Thread.currentThread()){
            count--;
            if(count==0){
                isLocked = false;
                //将调用unlock方法的线程唤醒
                notify();
            }
        }

    }
}
```

