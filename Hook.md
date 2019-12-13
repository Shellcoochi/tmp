Hook 只能用在函数组件中，不能在class组件中使用；它通过“钩入”的方式使得函数组件具备了React state及生命周期等特性。

相比class组件，Hook将组件中相互关联的部分拆分成更小的函数，更便于维护和代码的复用；而且它是100%向后兼容的，不包含任何破坏性的改动

以下是几个比较常用的Hook函数示例

State Hook:状态钩子

使用 useState()函数等价于class组件中的state

```
import React, {useState} from 'react';

export default function StateHook() {
    //声明state变量count
    const [count,setCount] = useState(0);

    return (
        <div>
            <p> {count}</p>
            <button onClick={() => setCount(count+1)}>
                Click +1
            </button>
        </div>

    )
}
```

Effect Hook：副作用钩子

使用函数useEffect，看一看做是componentDidMount、componentDidUpdate、componentWillUnmount三个函数的组合

```
import React, {useState,useEffect} from 'react';

export default function EffectHook() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        document.title = `You clicked ${count} times`;
    },[count]);// 第二个参数是一个数组，用于给出 Effect 的依赖项，只要这个数组发生变化，useEffect()就会执行。
                     // 第二个参数可以省略，这时每次组件渲染时，就会执行useEffect()
    return(
        <div>
            <p>You clicked {count} times</p>
            <button onClick={() => setCount(count + 1)}>
                Click me
            </button>
        </div>
    )
}
```

Co'n'text Hook:共享状态钩子

MyContext：

```
import React from 'react';

export const MyContext = React.createContext();
```

hookApp:

```

 <MyContext.Provider value={{
                username:'shellcoochi'
            }}>
                <ContextHook1/>
                <ContextHook2/>
 </MyContext.Provider>
```

ContextHook1：

```

import React, {useContext} from 'react';
import {MyContext} from './myContext';

export default function ContextHook1() {

    const {username} = useContext(MyContext);

    return <p>{username}</p>
}
```

Reducer Hook:action 钩子

 使用函数useReducer ， 它接受 Reducer 函数和状态的初始值作为参数，返回一个数组。数组的第一个成员是状态的当前值，第二个成员是发送 action 的dispatch函数 

编写Reducer 函数 ：todos

```
export function todos(state, action) {
    switch (action.type) {
        case 'changeName':
            return  {
                ...state,
                username: action.username,
            };
        case 'changeAge':
            return  {
                ...state,
                userAge: action.userAge,
            };
        default:
            return state;
    }
}
```

使用

```
export default function Hook() {
    const [user,dispatch] = useReducer(todos,{username:'Shellcoochi',userAge:'7'});
    return (
        <>
            <h1>姓名：{user.username},年龄：{user.userAge};</h1>
            <button onClick={() => dispatch({type:'changeName',username:'新名字'})}>
                new name
            </button>
            <button onClick={() => dispatch({type:'changeAge',userAge:'新年龄'})}>
                new age
            </button>
     
        </>
    )
}
```

自定义Hook函数

例如我们可以将useState封装加入其它逻辑

```
export function useMyHook(username) {
    const [myName,setMyName] = useState(username);

    function changeName(newName) {
    	.......................
    	........其他逻辑........
        setMyName(newName);
    }
    return [myName,changeName];
}
```

