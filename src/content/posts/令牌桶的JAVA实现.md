---
title: 令牌桶的JAVA实现
date: 2021-09-20 18:24:38
tags: [方案, 令牌桶, 算法]
---

<img src="https://cdn.nlark.com/yuque/0/2021/png/127227/1632132940851-c4983e33-27f8-49bd-8259-21236122b316.png#clientId=u8fe55d9d-ef9c-4&from=paste&height=459&id=ua2d4b410&margin=%5Bobject%20Object%5D&name=image.png&originHeight=918&originWidth=812&originalType=binary&ratio=1&size=121128&status=done&style=none&taskId=u7db862d2-903d-4e3d-9753-9e7325dbdd4&width=6" alt="图片替换文本" width="500" height="313" />



## 思想
定义一个令牌桶(Token_Bucket)，以一定的速度向桶里投掷令牌
(now - lastThrowTime) * rate
业务方在处理请求前先去令牌桶获取令牌(acquire)，如果获得令牌成功，则进行后续逻辑，否则就丢弃请求或者将请求放置到等待队列。
​

## 代码
```java
package cn.melonkid.commons.lang;

import java.lang.reflect.Field;
import java.util.concurrent.locks.ReentrantLock;
import sun.misc.Unsafe;

/**
 * 限流
 * 思想：使用令牌桶原理，实现限流操作
 *
 * @author imelonkid
 * @date 2021/09/20 13:09
 **/
public class RateLimiter {


    /** 令牌桶容量 */
    private int tokenVolume;

    /** 向令牌桶投递令牌速度 */
    private final int rate = 1;

    /** 上次刷新时间 */
    private long lastRefreshTime;

    /** 当前桶里的令牌数 */
    private long currTokens = 0;

    /** 当前桶里的令牌数 */
    private static long currTokensOffset;

    private ReentrantLock lock = new ReentrantLock();

    private static Unsafe unsafe;

    static {
        try {
            try {
                Field field = Unsafe.class.getDeclaredField("theUnsafe");
                field.setAccessible(true);
                unsafe = (Unsafe) field.get(null);
            } catch (NoSuchFieldException | IllegalAccessException e) {
                e.printStackTrace();
            }
            currTokensOffset = unsafe.objectFieldOffset(
                RateLimiter.class.getDeclaredField("currTokens"));
        } catch (NoSuchFieldException e) {
            e.printStackTrace();
        }
    }

	/**
    * 初始化令牌桶
    */
    public RateLimiter(int tokenVolume) {
        this.tokenVolume = tokenVolume;
        this.currTokens = tokenVolume;
        this.lastRefreshTime = System.currentTimeMillis();
    }

    /**
     * 获取令牌
     *
     * @return
     */
    public boolean acquire() {
        lock.lock();
        try {
            // 投掷令牌
            long currTimestamp = System.currentTimeMillis();
            int newTokens = (int) ((currTimestamp - lastRefreshTime) * rate / 1000);
            currTokens = Math.min(tokenVolume, (newTokens + currTokens));
            if (newTokens > 0) {
                // 积攒令牌，当令牌数大于1时刷新令牌桶
                lastRefreshTime = currTimestamp;
            }

            if (currTokens <= 0) {
                return false;
            }

            return compareAndSwap(currTokens, currTokens - 1);
        } finally {
            lock.unlock();
        }
    }


    public boolean compareAndSwap(long except, long target) {
        return unsafe.compareAndSwapLong(this, currTokensOffset, except, target);
    }

}

```
