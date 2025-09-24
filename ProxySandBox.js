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