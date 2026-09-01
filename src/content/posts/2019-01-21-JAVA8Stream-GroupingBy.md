---
layout: post
title:  "JAVA8-GroupingBy"
date:   2019-01-21 11:18:00 +0800
categories: [基础]
---

> if we want to group a list with key. we can use new JAVA8 API->groupyingBy。this api provides opretor which can group a list like SQL(select ... form... where... group by)  

> this new API has three overload metheds

1. one param
```java
    class Person {
         private String name;
         private int age;
         // getter setter...
    }

    List<Person> persons = ...
    // classify person by name
    persons.stream.collect(Collectors.groupingBy(Person::getName))
```

2. two params
```java
    class Person {
         private String name;
         private int age;
         private int sex; 
         // getter setter...
    }

    List<Person> persons = ...
    // classify by sex(male & female) and caculate the count
    // of sex
    persons.stream.collect(Collectors.groupingBy(Person::getSex), counting())
```

3. three params
```java
    class Person {
         private String name;
         private int age;
         private int sex; 
         // getter setter...
    }

    List<Person> persons = ...
    // classify by sex(male & female) and caculate the count
    // of sex
    persons.stream.collect(Collectors.groupingBy(Person::getSex), counting(), toList)
```









