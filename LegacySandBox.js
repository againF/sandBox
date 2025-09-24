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