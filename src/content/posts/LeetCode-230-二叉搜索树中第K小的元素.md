---
title: LeetCode_230_二叉搜索树中第K小的元素
date: 2021-10-18 15:11:20
tags: [leetCode, 算法, 二叉树, 搜索树]
---

## 题目
![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1634479610925-c498ecd1-e138-4f68-a543-eacf9b28e3a8.png#clientId=u77b8b130-1f03-4&from=paste&height=486&id=uf48101d0&margin=%5Bobject%20Object%5D&name=image.png&originHeight=972&originWidth=1128&originalType=binary&ratio=1&size=141000&status=done&style=none&taskId=u43cad449-ca6c-4b2e-bd0d-af56a4c4af0&width=564)
![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1634479633266-1cf80fde-6f57-4250-aa65-a3632f2d88d0.png#clientId=u77b8b130-1f03-4&from=paste&height=408&id=ud5a41404&margin=%5Bobject%20Object%5D&name=image.png&originHeight=816&originWidth=1146&originalType=binary&ratio=1&size=140157&status=done&style=none&taskId=ud4d9f2cb-66a9-439b-b788-214a17dbfee&width=573)


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
