- [3 种JS隔离机制](#3-种js隔离机制)
  - [支持单个微应用的方案一：SnapshotSandBox](#支持单个微应用的方案一snapshotsandbox)
  - [支持单个微应用的方案二：LegacySandBox](#支持单个微应用的方案二legacysandbox)
  - [支持同时激活多个微应用的方案：ProxySandBox](#支持同时激活多个微应用的方案proxysandbox)

# 3 种JS隔离机制
## 支持单个微应用的方案一：SnapshotSandBox
```
// 快照沙箱
class SnapshotSandBox {
    windowSnapshot = {};
    modifyPropsMap = {};
    active(){
        // 1.保存 window对象上所有属性的状态
        for(const prop in window){
            this.windowSnapshot[prop] = window[prop];
        }
        // 2.恢复上一次在运行该微应用的时候所修改过的 window上的属性
        Object.keys(this.modifyPropsMap).forEach((key)=>{
            window[key] = this.modifyPropsMap[key];
        });
    }
    inactive(){
        for(const prop in window){
            if(window[prop] !== this.windowSnapshot[prop]){
                 // 1.记录修改了 window对象上哪些属性
                this.modifyPropsMap[prop] = window[prop];
                // 2.将 window 对象上的属性状态还原至微应用未激活前的状态
                window[prop] = this.windowSnapshot[prop];
            }
        }
    }
}

// test
window.testProp = 'origin';
let snapshotSandBox = new SnapshotSandBox();
console.log('激活前', window.testProp);
snapshotSandBox.active();
window.testProp = 'modify';
console.log('激活后', window.testProp);
snapshotSandBox.inactive();
console.log('卸载后', window.testProp);

/***
 * 存在的问题：
 * 1. 在 active 时遍历 window 所有属性，性能开销较大
 * 2. 全局操作 window对象，如有多个微应用同时激活，window对象会被互相影响,所以只能同时激活一个微应用
 * 此方案优点：
 * 兼容性好，不支持 es6 proxy 的浏览器也能运行
 * **/
```
## 支持单个微应用的方案二：LegacySandBox
```
class LegacySandBox {
    currentUpdatePropsValueMap = new Map()
    modifyPropsOriginalValueMapInSandBox = new Map()
    addedPropsMapInSandBox = new Map()
    constructor(){
        const fakeWindow = Object.create(null)
        this.proxyWindow = new Proxy(fakeWindow,{
            set:(target,key,value,receiver)=>{
                const originalValue = window[key]
                if(!window.hasOwnProperty(key)){
                    this.addedPropsMapInSandBox.set(key,value)
                }else if(!this.modifyPropsOriginalValueMapInSandBox.has(key)){ // 防止多次修改
                    this.modifyPropsOriginalValueMapInSandBox.set(key,originalValue)
                }
                this.currentUpdatePropsValueMap.set(key,value)
                window[key] = value
            },
            get:(target,key,receiver)=>{
                return window[key]
            }
        })
    }
    setWindowProp(key,value,isToDelete){
        if(value === undefined && isToDelete){
            delete window[key]
        } else {
            window[key] = value
        }
    }
    active(){
        // 恢复上一次在运行该微应用的时候所修改过的 window上的属性
        this.currentUpdatePropsValueMap.forEach((value,key)=>{
            this.setWindowProp(key,value)
        })
    }
    inactive(){
        // 还原 window 对象上的属性状态
        this.modifyPropsOriginalValueMapInSandBox.forEach((value,key)=>{
            this.setWindowProp(key,value)
        })
        // 删除在微应用运行期间新增的属性
        this.addedPropsMapInSandBox.forEach((_,key)=>{
            this.setWindowProp(key,undefined,true)
        })
    }
}
// test
window.testProp = 'origin';
let legacySandBox = new LegacySandBox();
console.log('激活前', window.testProp);
legacySandBox.active();
legacySandBox.proxyWindow.testProp = 'modify';
console.log('激活后', window.testProp);
legacySandBox.inactive();
console.log('卸载后', window.testProp);

/***
 * 优点：
 * 不遍历 window 对象所有属性，性能开销小
 * 缺点：
 * 同时只能激活一个微应用
 * **/
```
## 支持同时激活多个微应用的方案：ProxySandBox
```
class ProxySandBox {
    proxyWindow;
    isRunning = false;
    constructor(){
        const fakeWindow = Object.create(null)
        this.proxyWindow = new Proxy(fakeWindow,{
            set:(target,key,value,receiver)=>{
                if(this.isRunning){
                    target[key] = value
                }
            },
            get:(target,key,receiver)=>{
                return key in target ? target[key] : window[key]
            }
        })

    }
    active(){
        this.isRunning = true
    }
    inactive(){
        this.isRunning = false
    }
}

// test
window.testProp = 'origin';
let proxySandBox1 = new ProxySandBox();
let proxySandBox2 = new ProxySandBox();
proxySandBox1.active();
proxySandBox2.active();
proxySandBox1.proxyWindow.testProp = 'modify in proxySandBox1';
console.log('proxySandBox1 激活后', window.testProp, proxySandBox1.proxyWindow.testProp);
proxySandBox2.proxyWindow.testProp = 'modify in proxySandBox2';
console.log('proxySandBox2 激活后', window.testProp, proxySandBox2.proxyWindow.testProp);

proxySandBox1.inactive();
proxySandBox2.inactive();
console.log('proxySandBox1 卸载后', window.testProp, proxySandBox1.proxyWindow.testProp);
console.log('proxySandBox2 卸载后', window.testProp, proxySandBox2.proxyWindow.testProp);

/***
 * 优点：
 * 不遍历 window 对象所有属性，性能开销小
 * 支持多个微应用同时激活，互不影响
 * 缺点：
 * 不支持 es6 proxy 的浏览器无法运行
 * **/
```