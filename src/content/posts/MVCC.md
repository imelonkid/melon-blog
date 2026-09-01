---
title: MVCC
date: 2021-09-06 21:12:12
tags: [数据库, mysql, innodb, 锁, 事务]
---

## MVCC(多版本并发控制)
MVCC，就是通过对数据维护多个版本，从而解决并发读写冲突问题，是一种乐观锁思想。

## undo log
undoLog用来做版本控制和版本回滚的日志，当数据库数据发生变更时，会在undoLog保留变更前的数据。
对于业务表数据，除了常规的业务自定义列外，还有几个重要的隐藏列。

| DB_TSX_ID | 事务ID |
| --- | --- |
| DB_ROLL_PTR | 回滚指针，记录上一个版本位置 |
| DB_ROW_ID | 隐藏自增主键，如果没有显示指定主键的话，Innodb使用DB_ROW_ID作为聚簇索引 |

## 记录版本链
```sql
CREATE TABLE user
(
  name varchar(10),
  sex char(1),
  age int
)
```
1. 插入数据(`zs`, 10)
```sql
insert into user(name, age) values('zs', '男', 10);
```
![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1630669843886-d3de76bd-c2fb-4321-9739-77c1f0a32b3b.png#clientId=u01c4d551-faec-4&from=paste&height=74&id=u205ed89c&margin=%5Bobject%20Object%5D&name=image.png&originHeight=148&originWidth=780&originalType=binary&ratio=1&size=11331&status=done&style=none&taskId=u9b0ce89f-cc09-44eb-90b6-04dda96dbb9&width=390)

此时，在业务表中，三个隐藏字段的值分别为

| 隐藏字段 | 值 | 说明 |
| --- | --- | --- |
| DB_TSX_ID | 0 | 假如事务ID从0开始 |
| DB_ROLL_PTR | null | undolog现在没有本条记录的其他版本 |
| DB_ROW_ID | 0 | 假如自增ID从0开始 |

这个事务中，在事务提交之前会在undolog中插入一个记录，事务commit之后，记录在undolog中删除。所以，事务提交后，undolog中不存在本条记录的更早版本。
​
2. 更新年龄为20
```sql
update user set age=20 where name='zs';
```
1). 先从缓存页查找记录，找到了直接返回，没找到从磁盘加载并继续查找
2). 对找到的记录加排他锁
3). 拷贝数据到undoLog
4). 更新记录数据缓存页，将新记录的DB_ROLL_PTR指向undoLog的上一版本记录
5). 更新redoLog缓存页
6). commit
![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1630670771884-8f12483d-2a57-491b-b63e-9e77464045c1.png#clientId=u01c4d551-faec-4&from=paste&height=242&id=u5ed36dbe&margin=%5Bobject%20Object%5D&name=image.png&originHeight=484&originWidth=1018&originalType=binary&ratio=1&size=43898&status=done&style=none&taskId=u396488ef-4a5f-4dcf-bcba-c025b9135a7&width=509)

3. 更新本条记录年龄为30
```sql
update user set age=30 where name='zs';
```
1). 先从缓存页查找记录，找到了直接返回，没找到从磁盘加载并继续查找
2). 对找到的记录加排他锁
3). 拷贝数据到undoLog
4). 更新记录数据缓存页，将新记录的DB_ROLL_PTR指向undoLog的上一版本记录
5). 更新redoLog缓存页
6). commit
![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1630671053407-4a351770-0b2d-4269-a754-c7f58fc50098.png#clientId=u01c4d551-faec-4&from=paste&height=340&id=u6de2361f&margin=%5Bobject%20Object%5D&name=image.png&originHeight=680&originWidth=1034&originalType=binary&ratio=1&size=61483&status=done&style=none&taskId=u22a5c978-a37b-461d-8c98-461ad823733&width=517)
如上所述，当对某一条记录执行变更时，本条数据的历史版本都会在undoLog中保留。并且通过当前最新版本的数据都能追溯到所有历史版本。
​
## Read View
当事务执行一次普通查询时，MYSQL引擎就会产生一个快照视图。这个快照视图主要有三个重要部分

| min_trx_id | 当前视图中最小的事务ID |
| --- | --- |
| max_trx_id | 当前视图最大事务ID+1；其实这个ID表达的是本视图尚未分配的下一个ID |
| m_ids | 本视图内活跃事务ID列表 |
| creator_trx_id | 生成该视图的事务ID |

read view其实是一种事务可见性算法，通过当前事务记录的DB_TSX_ID与上面三个值进行比较，最终确定哪些变更当前事务可见。
具体的计算流程为：
```java
if(db_tsx_id == creator_trx_id) {
    // 表示被访问的版本就是当前事务版本，自己看自己，可见
    return true;
}

if(db_tsx_id < min_trx_id) {
	// 说明被访问事务版本在本视图产生之前提交，所以当前事务能看到db_tsx_id所在的记录
    return true;
}
if(db_tsx_id >= max_trx_id) {
    // 说明被访问事务版本在本视图产生之后发生的，那么当前事务所在的记录在本视图中不可见。
    return false;
}

if(m_ids.contain(db_tsx_id)) {
    // 说明本访问事务在活跃事务列表中
    // 那么这时的数据尚未提交，当前事务ID对应的记录不可见
    return false;
}

// 被访问事务在快照视图中，并且事务已提交，可见
return true;
```
总结下来，就是当前事务，只能访问小于视窗最大版本号的已提交事务版本。
拿上面数据操作举例，事务可见性流程为：
![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1630674626424-d900ef35-d134-4a15-851d-27627ada6c0a.png#clientId=u01c4d551-faec-4&from=paste&height=226&id=u86a85ae6&margin=%5Bobject%20Object%5D&name=image.png&originHeight=452&originWidth=1336&originalType=binary&ratio=1&size=66283&status=done&style=none&taskId=ue341d581-f803-48f5-a11e-b133c054c1f&width=668)
如上图所示：如果事务B，C并发执行。对于事务B来说：min_trx_id=1, max_txr_id=3，m_ids=[1,2]，creator_trx_id=1。
对于事务C来说：min_trx_id=1, max_txr_id=3，m_ids=[1,2]，creator_trx_id=2。
#### case1:事务B快照查，事务C未提交
事务B执行：
```sql
select age from user where name = 'zs'
```
首先事务B获取到最新的记录，txr_id=2；发现当前事务在视图内，但是事务在活动事务列表中，所以本版本记录不可见。即：
```java
if(min_txr_id < txr_id && txr_id < max_txr_id 
			&& m_ids.contain(txr_id)) {
    // 说明本访问事务在活跃事务列表中
    // 那么这时的数据尚未提交，当前事务ID对应的记录不可见
    return false;
}
```
随后，事务B顺着版本链向前走，找到txr_id=0的记录，这条记录在快照查视图之前，所以对本事务可见。
```java
if(txr_id < min_txr_id) {
    return true;
}
```
所以返回数据为：10
#### case2:事务B,C同时活跃，事务B查询
在case1的基础上，事务B执行数据变更。
```sql
update user set age=20 where name='zs'
```
![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1630675976800-6777fa02-203f-48af-9a84-8e8d64556185.png#clientId=u01c4d551-faec-4&from=paste&height=326&id=u05dc4bca&margin=%5Bobject%20Object%5D&name=image.png&originHeight=652&originWidth=1344&originalType=binary&ratio=1&size=91685&status=done&style=none&taskId=u1e3be89c-245b-4f5c-88b4-5df81b3dc81&width=672)
此时版本链中最新的版本是txr_id=1;
事务B：min_trx_id=1, max_txr_id=3，m_ids=[1,2]，creator_trx_id=1。
事务C：min_trx_id=1, max_txr_id=3，m_ids=[1,2]，creator_trx_id=2。
由于最新版本的事务ID就是视图创建者的事务ID，那么当前版本数据对本事务可见
```sql
if(create_txr_id = txr_id) {
	return true;
}
```
#### case3:事务C提交，事务B不活跃，事务B查询
在case1的基础上提交事务C
![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1630674626424-d900ef35-d134-4a15-851d-27627ada6c0a.png#clientId=u01c4d551-faec-4&from=paste&height=226&id=Kg7it&margin=%5Bobject%20Object%5D&name=image.png&originHeight=452&originWidth=1336&originalType=binary&ratio=1&size=66283&status=done&style=none&taskId=ue341d581-f803-48f5-a11e-b133c054c1f&width=668)
由于快照视图在事务B查询的瞬间就已经产生，产生时，事务C尚未提交(属于活跃状态)。那么后面的事务提交不会影响到当前视窗。在当前视窗中，事务B的查询情况与case1一样。结果让然是10；
​

#### case4:在case2的情况下，事务D更新数据，事务B查询
![image.png](https://cdn.nlark.com/yuque/0/2021/png/127227/1630676517721-d516f27b-898a-4c32-b2ac-bcf87eb07ee0.png#clientId=u01c4d551-faec-4&from=paste&height=416&id=ub5364553&margin=%5Bobject%20Object%5D&name=image.png&originHeight=832&originWidth=1356&originalType=binary&ratio=1&size=118914&status=done&style=none&taskId=uc4724a3d-9730-4b50-9552-43596949b55&width=678)
由于事务D的更新，版本链中最新的记录txr_id=3。
但是快照视窗中的几个参数任然是：
事务B：min_trx_id=1, max_txr_id=3，m_ids=[1,2]，creator_trx_id=1。
事务C：min_trx_id=1, max_txr_id=3，m_ids=[1,2]，creator_trx_id=2。
相对于事件B，事务D发生在视窗产生之后，对事务B来说记录不可见。
```java
if(txr_id >= max_txr_id) {
    return false;
}
```
接下来走到上一个版本，txr_id=1 与当前视窗事务ID一样，当前记录可见，返回年龄20。
#### 总结： MVCC通过undolog和ReadView来控制事务更新的可见性，解决读写并发的问题。
​
## 在RC级别和RR级别下，快照读的不同
RR级别时，同一事务的多次快照查都会使用第一次快照查生成的视窗。这样不管后续数据如何变更，同一事务的多次查询结果是一致的。
RC级别时，同一事务的多次查询会分别生成一个视窗，因为后续变更直接影响当前查询的视窗，所以查询到的结果可能不同。也就是不可重复读。
