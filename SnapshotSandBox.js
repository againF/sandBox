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