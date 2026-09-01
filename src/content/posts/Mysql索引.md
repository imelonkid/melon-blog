---
title: Mysql索引
date: 2021-09-06 19:42:17
tags: [mysql, innodb, 数据结构]
---

## 数据结构
给定一个集合，要从这个集合查询某个或者某些元素。常见的做法有：
### 直接遍历
从集合头到集合为挨个遍历，直到找到需要查找的元素或者已经全部遍历完成。很明显这个方法的时间复杂度是O(n)。随着集合的增大，查询耗时将会线性增加。
### 二分查找
基于有序数组的情况下，先拿目标元素与集合中间位置元素比较，如果找到返回，否则如果比中间元素小就在左区间继续递归找，否则就在右区间递归找。这种查找的评价时间复杂度是O(logN)。耗时比直接遍历小很多，但是这种算法依赖于有序数组这种数据结构。
优点：时间复杂度可以达到O(logN)   
缺点：需要维护一个有序数组。在进行大规模的数据更新时，数组的维护成本比较高。   
### 二叉查找树
与二分查找类似，但是这种查询依赖二叉树结构。时间复杂度也是O(n)
### B树，B+树
B树是一种自平衡的多路查找树，多路查找树可以在一个节点中存储多个[key, data]数据，这样就能通过节点中的KEY的多少来控制树的高度。在高度比较小的多路平衡树中，可以减小查询对磁盘的IO次数，从而提升查询效率。多路查找树主要有下面特点：

1. n阶B树每个节点中最多有n-1个KEY
1. 每个节点最多有n个子节点
1. 每个节点中即包含了搜索KEY，还包含了要查找的数据
1. 所有的叶子节点在同一层

![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1630922077660-97c22f02-2a97-4c11-900b-2f679c77c6bc.png#clientId=ua3bc44eb-3974-4&from=paste&height=384&id=u7fab85a7&margin=%5Bobject%20Object%5D&name=image.png&originHeight=768&originWidth=2140&originalType=binary&ratio=1&size=296630&status=done&style=none&taskId=uf6b23d50-3248-49b2-a5b2-e88b0cfe69e&width=1070)


### B+树
与B树的主要区别是：

1. 非叶子节点不存储数据，这样非叶子节点就能存储更多的KEY，使得整棵树的高度比更低。
1. 叶子节点之间首位相连，形成一个双向链表

结构如图：
![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1630923971359-4ad50d72-711f-4125-b61e-65eab1eec9c2.png#clientId=ua3bc44eb-3974-4&from=paste&height=395&id=uba8aea25&margin=%5Bobject%20Object%5D&name=image.png&originHeight=790&originWidth=2272&originalType=binary&ratio=1&size=250026&status=done&style=none&taskId=u15b38502-b692-4aaa-9b24-cc9886934cb&width=1136)


## 聚集索引
在MYSQL的innodb中，主键索引(聚集索引)使用的是B+树数据结构，所有数据包括索引按照主键存储在一颗大的B+树中。为了提升磁盘IO效率，树中的每个节点大小被设计为一个数据页(16k)。这样，一次查找可以直接加载n个连续的磁盘扇区，较少寻道和磁盘旋转的耗时。
同时，由于B+树叶子节点的有序双向列表结构，当以主键进行范围查找时，直接就能通过叶子节点链表加载出来，无需遍历整棵树。
​

### 注意的点：
在设计聚合索引时，最好是使用与业务无关的自增id。因为这样B+树叶子节点的分配是按序进行的。如果使用UUID或者其他非自增ID作为主键，会导致生成的叶子节点页比较随机，这样会进行磁盘的随机访问。增加了寻道和磁盘选择时间。


## 辅助索引
Innodb中，辅助索引与聚集索引的存储结构类似，也是使用B+树。不同的点是，辅助索引的KEY是非主键字段。而叶子节点存储的也不是数据行本身，而是本索引所在记录的主键KEY。这样，在使用辅助索引进行查询时，查询引擎会先搜索辅助索引树，找到主键KEY。然后拿着主键KEY再搜索聚合索引树。
如果辅助索引和聚合索引高度都是3。那么进行一次辅助索引查询，最多会有6次磁盘IO。


## 联合索引
innodb也支持联合索引，就是将几个字段联合起来定义索引。联合索引也是B+树，不同的点是，联合索引是以联合索引中的联合字段顺序构建的辅助索引树。在单节点内，关键字段排序顺序按照联合索引的顺序进行。
比如联合索引(a,b)  两个节点的小大比较为 
```java
//节点A(a1, b1) 节点B(a2, b2)
if(a1 > a2) {
    return A节点大
}else if(b1 > b2) {
	return A节点大
}
return B节点大
```
### 注意的点：
由上面联合索引的特征可知，对于联合索引(a, b, c)。那么要想在SQL中使用到索引，必须满足最左前缀原则，就是只有a,用到了，才能用到b，只有b用到了，才能使用c。
做如下测试：
```sql
create table unit_key_test_1(
	`id` int(10) AUTO_INCREMENT,
	`a` int(2),
	`b` int(2),
	`c` int(2),
	`d` int(2),
	`e` int(2),
	primary key(`id`),
	key `uidx` (`b`, `c`, `d`)
);

insert into unit_key_test_1 (a, b, c, d, e) values(1, 2, 1,3,1);
insert into unit_key_test_1 (a, b, c, d, e) values(2, 1, 1,2,4);
insert into unit_key_test_1 (a, b, c, d, e) values(4, 1, 2,2,8);
insert into unit_key_test_1 (a, b, c, d, e) values(7, 5, 1,2,6);
```
下面SQL可以使用到联合索引
```sql
explain select * from t where b = 'xx';	--用到了联合索引
explain select * from t where b = 'xx' and c = 'xx'; --用到了联合索引
```
![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1630928162260-b92c47cf-8e62-4e7f-8476-b90edc10fad3.png#clientId=ua3bc44eb-3974-4&from=paste&height=63&id=u1483b3b8&margin=%5Bobject%20Object%5D&name=image.png&originHeight=126&originWidth=1462&originalType=binary&ratio=1&size=22348&status=done&style=none&taskId=ud45ea8b9-0d41-413c-82a2-489835cfd33&width=731)
其中ref为两个常量，说明上面SQL两个条件都命中了索引。
```sql
explain select * from unit_key_test_1 where b = 2 and c = 2 and d = 1;
```
![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1630928248873-d417e4dd-79af-474c-80e5-82255ec160c5.png#clientId=ua3bc44eb-3974-4&from=paste&height=63&id=u8a558756&margin=%5Bobject%20Object%5D&name=image.png&originHeight=126&originWidth=1598&originalType=binary&ratio=1&size=23312&status=done&style=none&taskId=u7d743456-16dc-4661-ad67-8d6d92c9c06&width=799)
可能用到的索引是uidx，使用到的索引是uidx
并且ref是三个常量，说明三个列都使用了索引。
```sql
explain select * from unit_key_test_1 where b = 2 and d = 1;
```
![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1630928348984-b83097da-cdc5-4236-9fd7-7ea3f115e368.png#clientId=ua3bc44eb-3974-4&from=paste&height=78&id=u1a910bf3&margin=%5Bobject%20Object%5D&name=image.png&originHeight=156&originWidth=1576&originalType=binary&ratio=1&size=34697&status=done&style=none&taskId=u4bbe65a8-66e0-4733-a7ea-d486146a1d6&width=788)
使用到了索引，但是ref只有一个常量，说明只有b这个列用到了索引。
#### 总结：SQL查询在联合索引上，要满足最左前缀树的规则


## 


