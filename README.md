## How to run
```
# install dependency
npm i

# start with gulp
gulp 

# bulid project
gulp prod
```

## 产生式
E->E+T|E-T|T|E(E)|(E)E
T->T*F|T/E|F
F->(E)|i

## 算符优先分析表
|        |    +    |    -    |    *    |    /    |    (    |    )    |    i    |
|  :-:   |   :-:   |   :-:   |   :-:   |   :-:   |   :-:   |   :-:   |   :-:   |
|   +    |    >    |    >    |    <    |    <    |    <    |    >    |    <    |
|   -    |    >    |    >    |    <    |    <    |    <    |    >    |    <    |
|   *    |    >    |    >    |    >    |    >    |    <    |    >    |    <    |
|   /    |    >    |    >    |    >    |    >    |    <    |    >    |    <    |
|   (    |    <    |    <    |    <    |    <    |    <    |    =    |    <    |
|   )    |    >    |    >    |    >    |    >    |         |    >    |         |
|   i    |    >    |    >    |    >    |    >    |         |    >    |         |


## Ref
[入门编译原理——词法分析器](http://www.a-site.cn/article/99529.html)