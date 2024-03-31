const VERSION = '2024.3.26'
console.log('推断机 <VERSION> ', VERSION)

const inp = document.querySelector('.inputarea')
const output = document.querySelector('.outputarea')
const submit = document.getElementById('submit')
const outputs = [
    `\
推断机
适用初中化学推断题

界面有点简陋，见谅
本来是练习JS的随笔，没想到写了这么多
代码开源(许可证见源码开头)
左侧为输入框。

版本: ${VERSION}
作者: CSK

点击“下一步”以继续
`,
    `\
左侧所示为物质转换表，程序会依据该表解题
你可以按需修改它

注意：
无需配平，英文字符，格式应与给出的条目相同，
避免空格，一行一个，可以重复，没有顺序
不会保存，下次打开后将恢复默认
修改后，你可以复制修改后的表，并保存到记事本里

点击“下一步”以继续
`,
    `\
请在左侧输入题目条件，一行一条

该工具无法理解自然语言，输入的格式要求如下：

一、建立转换关系(先写)
1. 转换链
将未知字母，用"><-="四种符号连接，就是转换链。长度不限。
"a>b"代表A可以转换为B; "a<b"反之
"a-b"代表A与B可以发生反应
"a=b"代表A与B可以互相转换
转换链支持不定长度、混合符号，例："c>d-f-a<g=i"
2. 转换式
a+b=c+d+e(类似格式) A与B反应生成C,D和E(可以省略部分生成物!)

二、添加物质条件
0. [abc...](1)        ABC...每个都由1种元素组成(数量可自定义)
1. [abc...](2-10)     ABC...每个物质的元素数量范围是2~10(包含)
2. [abc...](O)        ABC...为氧化物(固定搭配)
3. [abc...]{FeO...}   组成ABC...的所有元素在Fe,O...这个范围内
4. [abc...][FeCuAg...]   含有Fe,Cu,Ag...中至少一种元素
5. a:H2O              A为H2O
6. a:[CO2,H2O,...]    A为其中之一

三、注意事项！
1. 转换关系写在物质条件前面！
2. 表示未知物的字母，不区分大小写
3. 条件可以重复
4. 错误的格式可能导致异常，请避免
5. 英文字符

四、常用物质组合（直接复制并按格式使用）
红色固体：[Cu,Fe2O3]
蓝色固体：[Cu(OH)2,CuSO4]
黑色固体：[Fe,C,CuO,MnO2,Fe3O4]
白色固体：[NaCl,Na2CO3,NaOH,Ca(OH)2,CaCO3,CaO,CuSO4,MgO,P2O5]
无色液体：[H2O,H2O2]
金属元素：[K,Ca,Na,Mg,Al,Zn,Fe,Zn,Cu,Hg,Ag,Ba,Mn]
气体物质：[O2,H2,N2,CO2,CO,CH4,SO2,HCl,NH3,Cl2]
反应沉淀：[Ba(SO4),AgCl,CaCO3,BaCO3,Mg(OH)2,Al(OH)3,Cu(OH)2,Fe(OH)3]
温室气体：[CO2,CH4]
大气污染：[SO2,CO]
用于灭火：[H2O,CO2,Na2CO3]
建筑材料：[CaO,CaCO3,Ca(OH)2]
胃酸过多：[Al(OH)3,Na2CO3,NaHCO3,Mg(OH)2]
干燥剂：[H2SO4,CaO,NaOH,CaCl2,P2O5,Fe]

五、示例
"A与B生成C"
a+b=c
"A与B能反应，C与D能反应，A能转换为C"
b-a>c-d
"已知A是单质，F是红色固体，BDE是氧化物，气体E能使澄清石灰水浑浊"
[a](1)
f:[Fe2O3,Cu]
[bde](O)
e:CO2

输入条件，点击“求解”
`
]
function next() {
    return new Promise(resolve => submit.addEventListener('click', resolve, {once: true}))
}
async function main() {
    try {
        inp.value = ''
        output.value = outputs[0]
        submit.innerHTML = '下一步'
        await next()
        inp.value = INVENTORY.join('\n')
        output.value = outputs[1]
        await next()
        INVENTORY.length = 0
        for(let i of inp.value.split('\n')) {
            if(i !== '')
                INVENTORY.push(delSpace(i))     // 其实不用避免空格(偷笑)
        }
        init()
        inp.value = ''
        let missed = 0
        while(1) {
            missed = 0
            output.value = outputs[2]
            submit.innerHTML = "求解！"
            inp.focus()
            await next()
            for(let i of inp.value.split('\n')) {
                if(i !== '')
                    missed += input(delSpace(i)) ? 1 : 0
            }
            let time1 = performance.now()
            boardLimit()
            let ans = solve()
            // 输出缓冲区
            let o = [
                `广度优化次数${cnt3}，搜索次数${cnt2}，试解次数${cnt1}，用时${Math.round(performance.now()-time1)/1000}s`,
                `共找到${ans.length}个解${(ans.length>500?", 仅显示前500条":"")}`,
                missed ? `解析失败${missed}个条件` : ''
            ]
            // 防啰嗦系统
            if(ans.length > 1) {
                let settled = new Map(ans[0].entries())
                for(let an of ans) {     // 笑
                    for(let [letter, form] of settled) {
                        if(an.get(letter) !== form)
                            settled.delete(letter)
                    }
                }
                o.push('\n确定解:')
                for(let [letter, form] of [...settled.entries()].sort()) {
                    o.push(`${letter}: ${form}`)
                }
                o.push('\n')
                // 避免重复输出
                for(let an of ans) {
                    ;[...settled.keys()].forEach(k => an.delete(k))
                }
                o.push('可能的组合：')
            }
            // 制表系统
            let maxl = new Map()
            for(let res of ans.slice(0, 500)) {
                for(let letter of res.keys()) {
                    maxl.set(letter, Math.max(res.get(letter).length, maxl.get(letter) || 0))
                }
            }
            // 绝
            for(let res of ans.slice(0, 500)) {
                let s = []
                for(let letter of [...res.keys()].sort()) {
                    s.push(`${letter}:${res.get(letter)}${' '.repeat(
                        res.get(letter).length <= maxl.get(letter) ? maxl.get(letter) - res.get(letter).length : 0)} `)
                }
                o.push(s.join('') + '\n')
            }
            output.value = o.join('\n')
            submit.innerHTML = "上一步"
            await next()
            board.clear()
        }
    } catch(e) {
        output.value = `啊这，出了点问题：\n${e}\n请重新加载`
    }
}
main()