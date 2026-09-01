---
title: leetcode53_最大和子序
date: 2021-09-20 10:59:26
tags: [leetcode, 算法, 子序, 动态规划]
---


### 问题
![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1632100311402-0dc7d88b-537f-4efa-9641-15e0756d04dc.png#clientId=uaef0fc2c-b6dd-4&from=paste&height=601&id=u3ecba6d6&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1202&originWidth=1134&originalType=binary&ratio=1&size=102857&status=done&style=none&taskId=udbbb8d80-9b5e-4e31-8a48-9224a0d1f51&width=567)
### 解题
#### 贪心算法：
从数组第一个元素开始，第x个元素的和f(x)依赖f(x-1)的和的情况。如果f(x-1)<0，那么f(x)抛弃f(x-1)的值，使得
f(x)=nums[x]。否则，f(x) = nums + f(x - 1)。即：
![](https://cdn.nlark.com/yuque/__latex/48c3844d7f492dade0d3a51e23a43486.svg#card=math&code=f%28x%29%20%3D%0A%5Cbegin%7Bcases%7D%0Anums%5Bx%5D%2C%20%20f%28x%20-%201%29%20%3C%200%20%5C%5C%0Anums%5Bx%5D%20%2B%20f%28x%20-%201%29%2C%20f%28x%20-%201%29%20%3E%3D%200%0A%5Cend%7Bcases%7D&id=JH5Nl)


如下图：输入数组[-2, 1, -3, 4, -1, 2, 1, -5, 4]
![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1632104096277-b6042c47-985f-475d-be2e-01cb3d553ac9.png#clientId=uaef0fc2c-b6dd-4&from=paste&height=461&id=ua4445c46&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1036&originWidth=840&originalType=binary&ratio=1&size=103467&status=done&style=none&taskId=u5e4af402-0fc1-40b3-a94d-5b466cdbfd1&width=10)

![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1632104121655-73ea4ddc-44e4-4771-aef1-c19c43ff3828.png#clientId=uaef0fc2c-b6dd-4&from=paste&height=457&id=u941e6fa6&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1066&originWidth=770&originalType=binary&ratio=1&size=102802&status=done&style=none&taskId=u9e875546-cc27-419f-889b-f3eab34249b&width=10)

![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1632104200845-ac2c493d-4d9b-47b1-a42a-fed726783ef8.png#clientId=uaef0fc2c-b6dd-4&from=paste&height=451&id=u17c308e0&margin=%5Bobject%20Object%5D&name=image.png&originHeight=948&originWidth=754&originalType=binary&ratio=1&size=92766&status=done&style=none&taskId=ubb39f718-b2ca-4c43-8133-23f148b874e&width=10)

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
![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1632105957082-a4ab5bcb-b36f-4dc1-bb76-bfcc9c06927c.png#clientId=uaef0fc2c-b6dd-4&from=paste&height=425&id=ub9705cab&margin=%5Bobject%20Object%5D&name=image.png&originHeight=954&originWidth=792&originalType=binary&ratio=1&size=91455&status=done&style=none&taskId=u76d4623b-d09a-4d66-a1aa-68c2929d8ba&width=353)![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1632105988643-d5a41934-f494-4e92-9a3f-eb86d1e21020.png#clientId=uaef0fc2c-b6dd-4&from=paste&height=431&id=u53559481&margin=%5Bobject%20Object%5D&name=image.png&originHeight=998&originWidth=730&originalType=binary&ratio=1&size=88689&status=done&style=none&taskId=u40c6697e-c789-4c62-861a-b8e93089604&width=315)
![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1632106021716-34a8a3e8-2eb9-4ce1-93ca-8701f86673de.png#clientId=uaef0fc2c-b6dd-4&from=paste&height=427&id=u52d5ee7c&margin=%5Bobject%20Object%5D&name=image.png&originHeight=954&originWidth=732&originalType=binary&ratio=1&size=92332&status=done&style=none&taskId=u6838fe68-fef3-4aa5-a063-2b50b173f7a&width=328)
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
