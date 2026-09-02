---
title: leetcode53_最大和子序
date: 2021-09-20 10:59:26
tags: [leetcode, 算法, 子序, 动态规划]
---


### 问题
![image.png](/images/yuque/a42151859521.png)
### 解题
#### 贪心算法：
从数组第一个元素开始，第x个元素的和f(x)依赖f(x-1)的和的情况。如果f(x-1)<0，那么f(x)抛弃f(x-1)的值，使得
f(x)=nums[x]。否则，f(x) = nums + f(x - 1)。即：
![](/images/yuque/db3530f7c49c.png)


如下图：输入数组[-2, 1, -3, 4, -1, 2, 1, -5, 4]
![image.png](/images/yuque/d2984deaef15.png)

![image.png](/images/yuque/ce24d325b077.png)

![image.png](/images/yuque/169d6440859a.png)

```java
public int solution(int[] nums) {
	if(nums == null || nums.length < 1) {
    	return 0;
    }
    
    int preSum = 0;
    int maxSum = nums[0];
    for(int i = 0; i < nums.length; i++) {
    	if(preSum < 0) {
        	preSum = 0;
        }
        
        preSum += nums[i];
		maxSum = Math.max(preSum, nums[i]);
    }
    
    return maxSum;
}
```
#### 动态规划
数组的每个元素(状态)通过转移方程f(x)转移到另一个状态，并从转移状态中找到目标值。
f(x) = max(nums[x], f(x-1) + nums[x]);
![image.png](/images/yuque/0b4c45dc9d0a.png)![image.png](/images/yuque/3e4db326085c.png)
![image.png](/images/yuque/ff031644b425.png)
```java
public int solution(int[] nums) {
	int[] transArr = new int[nums.length];
    int transStatus = 0;
    
    // 状态转移
    for(int i = 0; i < nums.length; i++) {
        transStatus += nums[i];
        transStatus = Math.max(transStatus, nums[i]);
        transArr[i] = transStatus;
    }
    
    // 找最优解
    int bestStatus = transArr[0];
    for(int i = 0; i < transArr.length; i++) {
    	bestStatus = Math.max(bestStatus, transArr[i]);
    }
    
    return bestStatus;
}
```
优化：
```java
public int solution(int[] nums) {
    
    int bestStatus = 0;
    int transStatus = 0;
    
    // 状态转移
    for(int i = 0; i < nums.length; i++) {
        transStatus += nums[i];
        transStatus = Math.max(transStatus, nums[i]);
        
        if(i == 0) {
        	bestStatus = transStatus;
        }
        bestStatus = Math.max(bestStatus, transStatus);
    }
    
    return bestStatus;
}
```
