---
title: leetcode11_ 盛最多水的容器
date: 2021-09-28 16:33:26
tags: [leetcode, 算法]
---

### 题目
给你 n 个非负整数 a1，a2，...，an，每个数代表坐标中的一个点 (i, ai) 。在坐标内画 n 条垂直线，垂直线 i 的两个端点分别为 (i, ai) 和 (i, 0) 。找出其中的两条线，使得它们与 x 轴共同构成的容器可以容纳最多的水。<br />说明：你不能倾斜容器。<br />

#### 示例
![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1632818087511-3b8abbfe-7564-4297-ad78-371135e021c6.png#clientId=u25850f18-dd97-4&from=paste&height=236&id=uebff17fb&margin=%5Bobject%20Object%5D&name=image.png&originHeight=383&originWidth=801&originalType=binary&ratio=1&size=40967&status=done&style=none&taskId=uab4c973d-9438-4006-bd73-c390c97751d&width=493.5)<br />​

![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1632818145699-6223d62f-03fb-4653-8a4a-f897e970d205.png#clientId=u25850f18-dd97-4&from=paste&height=438&id=u3e9d85dc&margin=%5Bobject%20Object%5D&name=image.png&originHeight=876&originWidth=1238&originalType=binary&ratio=1&size=83822&status=done&style=none&taskId=uad2d59d5-8268-491f-9db9-e51c2c95370&width=619)
### 思路
#### 暴力破解：
列出数组中所有可能的容积，找出最大的容积即可。
```java
public int maxArea(int[] height) {

    int maxArea = 0;
    int len = height.length;
	
    // 列出所有可能出现的容器，并计算最大的容积
    for(int i = 0; i < len - 1; i++) {
        for(int j = i + 1; j < len; j++) {
        	int tmpArea = Math.min(height[i], height[j]) * (j - i);
            maxArea = Math.max(maxArea, tmpArea);
        }
    }

    return maxArea;
} 
```
##### 复杂度
时间复杂度:O(n*n) 空间复杂度:O(1)<br />​<br />
#### 双指针法：
两个指针同时指向数组的首尾(i, j)，计算好面积后调整窗口后继续计算容积。调整方式为：<br />![](https://cdn.nlark.com/yuque/__latex/466e2d102dce85d581702316561144f3.svg#card=math&code=adjust%28i%2C%20j%29%20%3D%0A%5Cbegin%7Bcases%7D%0Ai%20-%3E%20i1%2C%20%20%28i%3Cj%29%20%26%20%5Ctext%7B%E5%B7%A6%E8%BE%B9%E7%95%8C%E5%8F%B3%E6%BB%91%7D%5C%5C%0Aj%20-%3E%20j1%2C%20%28i%20%3E%20j%29%20%26%20%5Ctext%7B%E5%8F%B3%E8%BE%B9%E7%95%8C%E5%B7%A6%E6%BB%91%7D%20%5C%5C%0Ai%20-%3E%20i1%2C%20%28i%20%3D%20j%29%20%26%20%5Ctext%7B%E7%A7%BB%E5%8A%A8%E5%B7%A6%E5%8F%B3%E7%AA%97%E5%8F%A3%E9%83%BD%E5%8F%AF%E4%BB%A5%EF%BC%8C%E8%BF%99%E9%87%8C%E7%A7%BB%E5%8A%A8%E5%B7%A6%E8%BE%B9%E7%95%8C%7D%0A%5Cend%7Bcases%7D&id=d5X3n)<br />​

双指针法计算证明：<br />设数组第i，j个元素分别为：f(i), f(j); 那么由左右边界构成的矩形面积为: <br />![](https://cdn.nlark.com/yuque/__latex/f1a22b35b239f198c1eaa20853707580.svg#card=math&code=area%3DMath.min%28f%28i%29%2C%20f%28j%29%29%20%2A%20%28j%20-%20i%29&id=TNcGZ)
```shell
假设f(i) <= f(j)，min(f(i), f(j)) = f(i)
此时如果将右边界左移，j -> j1   
有：(j1 - i) < (j -i)  
且：min(f(i), f(j1)) <= Math.min(f(i), f(j))
	因为：如果f(j1) <= f(j) 
  				如果f(j1) < f(i) -> min(f(i), f(j1)) = f(j1)
      		如果f(i) < f(j1) <= f(j) -> min(f(i), f(j1)) = f(i)
    	如果：f(j1) > f(j)
      		min(f(i), f(j1)) = f(i)
所以：如果f(i) <= f(j)时，无论怎么调整j，都会满足下面条件
min(f(i), f(j1))*(j1 - i) < min(f(i), f(j)) *(j - i)
所以，当f(i) <= f(j)时不能调整右边界，只能调整左边界。
```
通过上面的调整，我们可以不断调整丢弃不合适的边界，然后缩小窗口范围。直到窗口缩小为0,即i == j。<br />实现代码：
```java
public int maxArea(int[] height) {

    int maxArea = 0;
	
    // 定义左右边界
    int i = 0;
    int j = height.length - 1;
	
    // adjust窗口
    while(i < j) {
        // 计算当前矩形面积
        int tmpArea = Math.min(height[i], height[j]) * (j - i);
        maxArea = Math.max(maxArea, tmpArea);
        
        // 调整窗口
        if(height[i] <= height[j]) { 
            // 左边界右滑
        	i++;
            continue;
        }
        
        // 右边界左滑
        j--;
    }

    return maxArea;
} 
```
​

​<br />
