---
title: LeetCode_230_二叉搜索树中第K小的元素
date: 2021-10-18 15:11:20
tags: [leetCode, 算法, 二叉树, 搜索树]
---

## 题目
![image.png](/images/yuque/d66ff3ebf798.png)
![image.png](/images/yuque/fbe0c5f08aa4.png)


## 思路
由于搜索树的中序遍历就是按节点元素从小到大的方式输出的，所以只需通过中序遍历得到遍历的结果集合。然后再从结果集中返回第K个元素即可。
​

### 递归方式
```java
public int solution(TreeNode root, int k) {
	List<Integer> vals = new ArrayList<>();
    return vals.get(k - 1);
}


private void traverTree(TreeNode node, List<Integer> vals) {
	if(node == null) {
    	return ;
    }
    
    traverTree(node.left, vals);
    vals.add(node.val);
    traverTree(node.right, vals);
}
```
### 堆栈方式
```java
public int solution(TreeNode root, int k) {
    Deque<Integer> stack = new ArrayDeque<>();
	TreeNode node = root;
    
    while(node != null ||!stack.isEmpty()) {
    	// 找到合适的节点，执行入栈
        while(node != null) {
        	stack.push(node);
            node = node.left;
        }
        
        node = stack.pop();
        --k;
        if(k == 0) {
        	break;
        }
        
        node = node.right;
    }
    
    return node.val;
}
```
