/*
Copyright 2024 Shaokun Chen

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
* 推断机
* 适用于初中化学推断题
* 为了练习JS而写的，如果遇到了莫名其妙的写法，请不要尝试理解
* 这个项目尝试保持一个良好的设计模式和零依赖
* 单文件便于嵌入，模块化不好做成离线网页的形式分发
* 当然，如果真要拆成模块，几分钟就能拆完
* ES2017+
*/

/**
 * 内部用法
 * 1. init()
 * 2. board开头函数，传入两个大写字母建立联系
 * 3. boardLimit()
 * 4. limit开头函数，增加物质条件
 * 5. let ans = solve()
 * 6. ans为列表。ans[i]为字母到化学式的映射，表示一种解。
 */

/** 设计思路
 * 第一步，预处理所有化学转换式，得到化学式对应的元素信息和转换关系，
 *  邻接表存于book，键为化学式。
 * 第二步，根据题目条件建图，得到待求节点之间的关系，
 *  邻接表存于board，键为未知字母。
 * 第三步，优化，减少board[X].possible的值，依据为题目给出的节点X的物质条件(例如"X为单质")
 *  、该节点与周围节点之间的连接数量，和周边节点的possible值。排除不可能的化学式。
 * 第四步，深搜回溯求解，状态为对各个字母假设的答案，结束条件为所有字母均有假设，
 *  继续递归的条件为当前假设合理，字母X的假设答案从board[X].possible中枚举
 */


/**
 * 更新日志
 * 2024.1.21 初版完成
 * 2024.3.2 
 * 增加大部分九年级下期的转换式，改进部分提示语和注释
 * 增加单独输出确定解，避免重复列举
 * 增加自动制表对齐
 * 以及很多细节改进
 * 2024.3.9
 * 改进UI, 增加图片
 * 增加完整的转化式条件的支持
 * 2024.3.10
 * 增加了一个非常烧脑的优化算法，在没有值落定的情况下，提前处理周边节点关系，
 * 筛除不可能的假设，提升效率。位于boardLimit函数。
 * 第一次写出有意义的六重循环
 * 2024.3.11
 * 修转换式条件限制的bug, 完善页面
 * 2024.3.16
 * 修复转换式条件限制的bug。
 * 原因是else配错if，导致右侧转换式检查时有遗漏。
 * 2024.3.23
 * 上版本管理
 * 添加自动打表的代码，减少文件体积
 * 优化输入，简便
 * 2024.3.30
 * 修bug。添加简单的页脚。
 */

/** 第零部分：建立转换式资料
 * 包括手动输入的和自动生成的(复分解反应)
 */


/**
 * 感谢化学老师整理的转化式！
 */
// 3.2更新：默认情况下，包含ext的内容
// 3.23更新：自动打表
const ext = [
    // 九年级下期部分和不常考的部分
    'S+O2=SO2',
    'Hg+O2=HgO',
    'HgO=Hg+O2',
    'P+O2=P2O5',
    'KClO3=KCl+O2',
    'KMnO4=K2MnO4+MnO2+O2',
    'CuSO4+NaOH=Cu(OH)2+Na2SO4',
    'Cu(OH)2=CuO+H2O',
    // 酸 + 金属
    'Mg+HCl=MgCl2+H2',
    'Mg+H2SO4=MgSO4+H2',
    'Zn+HCl=ZnCl2+H2',
    'Zn+H2SO4=ZnSO4+H2',
    'Fe+HCl=FeCl2+H2',
    'Fe+H2SO4=FeSO4+H2',
    'Al+HCl=AlCl3+H2',
    'Al+H2SO4=Al2(SO4)3+H2',
    // 酸 + 金属氧化物
    'Fe2O3+HCl=FeCl3+H2O',
    'Fe2O3+H2SO4=Fe2(SO4)3+H2O',
    'CuO+HCl=CuCl2+H2O',
    'CuO+H2SO4=CuSO4+H2O',
    'CaO+HCl=CaCl2+H2O',
    'CaO+H2SO4=CaSO4+H2O',
    // 酸 + 碱
    'HCl+NaOH=NaCl+H2O',
    'HCl+Ca(OH)2=CaCl2+H2O',
    'H2SO4+NaOH=Na2SO4+H2O',
    'H2SO4+Ca(OH)2=CaSO4+H2O',
    'HCl+Al(OH)3=AlCl3=H2O',
    'HCl+Mg(OH)2=MgCl2+H2O',
    'Cu(OH)2+HCl=CuCl2+H2O',
    'Fe(OH)3+HCl=FeCl3+H2O',
    // 酸 + 盐
    'Na2CO3+HCl=NaCl+H2O+CO2',
    'NaHCO3+HCl=NaCl+H2O+CO2',
    'CaCO3+H2SO4=CaSO4+H2O+CO2',
    'H2SO4+BaCl2=BaSO4+HCl',
    'HCl+AgNO3=AgCl+HNO3',
    // 碱 + 盐
    'Ca(OH)2+CuSO4=Cu(OH)2+CaSO4',
    'NaOH+FeCl3=Fe(OH)3+NaCl',
    'NaOH+CuSO4=Cu(OH)2+Na2SO4',
    'NaOH+MgCl2=Mg(OH)2+NaCl',
    'Na2CO3+Ca(OH)2=NaOH+CaCO3',
    'CuSO4+Ba(OH)2=Cu(OH)2+BaSO4',
    'NH4Cl+NaOH=NaCl+NH3+H2O',
    'NH4NO3+Ca(OH)2=Ca(NO3)2+NH3+H2O',
    '(NH4)2SO4+NaOH=NaSO4+NH3+H2O',
    // 碱 + 非金属氧化物
    'NaOH+CO2=Na2CO3+H2O',
    'NaOH+SO2=Na2SO3+H2O',
    'NaOH+SO3=Na2SO4+H2O',
    // 盐 + 金属
    // 已存在
    // 盐 + 盐
    'Na2CO3+CaCl2=NaCl+CaCO3',
    'Na2CO3+BaCl2=NaCl+BaCO3',
    'CuSO4+BaCl2=CuCl2+BaSO4',
    // 部分盐能分解
    'Ca(HCO3)2=CaCO3+CO2+H2O',
    'NaHCO3=Na2CO3+CO2+H2O',
    'NH4HCO3=NH3+CO2+H2O',
    // 其它
    'CaCO3+CO2+H2O=Ca(HCO3)2',
    'Na2CO3+CO2+H2O=NaHCO3',
    // SO3 相关
    "KOH+SO3=K2SO4+H2O",
    "NaOH+SO3=Na2SO4+H2O",
    "Ba(OH)2+SO3=BaSO4+H2O",
    "Ca(OH)2+SO3=CaSO4+H2O",
]
// 自动生成溶液置换的程序片段
/*
const g = ['Mg', 'Al', 'Zn', 'Fe', 'Cu', 'Ag']
const all = ['MgSO4', 'MgCl2', 'Al2(SO4)3', 'Al(NO3)3', 'AlCl3', 
'ZnSO4', 'ZnCl2', 'Zn(NO3)2', 'FeSO4','FeCl2', 'Fe(NO3)2', 
'CuSO4', 'Cu(NO3)2', 'Ag(NO3)']
for(let i=0;i<6;i++){
    for(let j=i+1;j<6;j++){
        for(let r of ['SO4', 'NO3', 'Cl']){
            let ri=null, rj=null;
            for(let f of all){
                if(f.includes(g[i]) && f.includes(r))
                    ri = f
                if(f.includes(g[j]) && f.includes(r))
                    rj = f
            }
            if(!ri || !rj)
                continue
            let s = `${g[i]}+${rj}=${ri}+${g[j]}`
            console.log(s)
        }
    }
}
*/
// 结果如下
const extSolutions = [
    'Mg+Al2(SO4)3=MgSO4+Al',
    'Mg+AlCl3=MgCl2+Al',
    'Mg+ZnSO4=MgSO4+Zn',
    'Mg+ZnCl2=MgCl2+Zn',
    'Mg+FeSO4=MgSO4+Fe',
    'Mg+FeCl2=MgCl2+Fe',
    'Mg+CuSO4=MgSO4+Cu',
    'Al+ZnSO4=Al2(SO4)3+Zn',
    'Al+Zn(NO3)2=Al(NO3)3+Zn',
    'Al+ZnCl2=AlCl3+Zn',
    'Al+FeSO4=Al2(SO4)3+Fe',
    'Al+Fe(NO3)2=Al(NO3)3+Fe',
    'Al+FeCl2=AlCl3+Fe',
    'Al+CuSO4=Al2(SO4)3+Cu',
    'Al+Cu(NO3)2=Al(NO3)3+Cu',
    'Al+AgNO3=Al(NO3)3+Ag',
    'Zn+FeSO4=ZnSO4+Fe',
    'Zn+Fe(NO3)2=Zn(NO3)2+Fe',
    'Zn+FeCl2=ZnCl2+Fe',
    'Zn+CuSO4=ZnSO4+Cu',
    'Zn+Cu(NO3)2=Zn(NO3)2+Cu',
    'Zn+AgNO3=Zn(NO3)2+Ag',
    'Fe+CuSO4=FeSO4+Cu',
    'Fe+Cu(NO3)2=Fe(NO3)2+Cu',
    'Fe+AgNO3=Fe(NO3)2+Ag',
    'Cu+AgNO3=Cu(NO3)2+Ag',
]
const INVENTORY = [
    // 部分的+O2, 所有的+Cl2
    'Mg+O2=MgO',
    'C+O2=CO2',
    'C+O2=CO',
    'Fe+O2=Fe3O4',
    'Fe+O2+H2O=Fe2O3', // xH2O
    'Cu+O2=CuO',
    'Al+O2=Al2O3',
    'H2+O2=H2O',
    'H2+Cl2=HCl',
    'Na+Cl2=NaCl',
    // 金属还原
    'C+CuO=Cu+CO2',
    'C+Fe2O3=Fe+CO2',
    'C+Fe3O4=Fe+CO2',
    'CO+CuO=Cu+CO2',
    'CO+Fe2O3=Fe+CO2',
    'CO+Fe3O4=Fe+CO2',
    'H2+CuO=Cu+H2O',
    'H2+Fe2O3=Fe+H2O',
    'H2+Fe3O4=Fe+H2O',
    // 盐溶液
    'Zn+HCl=ZnCl2+H2',
    'Mg+HCl=MgCl2+H2',
    'Fe+HCl=FeCl2+H2',
    'Al+HCl=AlCl3+H2',
    'Zn+H2SO4=ZnSO4+H2',
    'Mg+H2SO4=MgSO4+H2',
    'Fe+H2SO4=FeSO4+H2',
    'Al+H2SO4=Al2(SO4)3+H2',
    // 置换
    'Fe+CuSO4=FeSO4+Cu',
    // 杂项
    'H2O2=H2O+O2',
    'H2O=H2+O2',
    'CO2+C=CO',
    'CO+O2=CO2',
    'CO2+H2O=C6H12O6+O2',
    'H2O+CO2=H2CO3',
    'H2CO3=H2O+CO2',
    'CaO+H2O=Ca(OH)2',
    'Ca(OH)2+CO2=CaCO3+H2O',
    'CaCO3=CaO+CO2',
    'CaCO3+HCl=CaCl2+H2O+CO2',
    'CH4+O2=CO2+H2O',
    'C2H5OH+O2=CO2+H2O',
    'C6H12O6+O2=CO2+H2O',
    // (省略溶液细节，活泼性强的置换出弱的)
    // 'Al=Fe', 'Al=Cu', 'Al=Ag', 'Fe=Cu', 'Fe=Ag', 'Cu=Ag',
    ...extSolutions,
    ...ext
]
// 生成复分解反应式
;(function(){
// 省略了锌和二价铁
const cations = {
    H:  1,  NH4: 1, K:  1, Na: 1, Ag: 1,
    Ba: 2,  Ca:  2, Mg: 2, Cu: 2,
    Al: 3,  Fe:  3,
}
const anions = {
    OH: 1,
    NO3: 1,
    Cl: 1,
    SO4: 2,
    CO3: 2,
    O: 2
}
const blacklist = {
    OH: new Set(['Mg', 'Al', 'Fe', 'Cu']),
    Cl: new Set(['Ag']),
    SO4: new Set(['Ba']),
    CO3: new Set(['Ba', 'Ca', 'Fe', 'Cu', 'Ag'])
}
const invalid = {
    OH: new Set(['Ag']),
    CO3: new Set(['Al']),     // 碳酸铁是个什么东西 碳酸铜又是啥 ？？？
    O: new Set(['NH4', 'K', 'Na', 'Ag', 'Ba', 'Mg'])      // 氧化镁初中不涉及（应该吧）
}
const gas = ['CO2', 'NH3']

function gcd(a, b){
    if(a%b == 0) return b;
    return gcd(b, a%b)
}

function isInvalid(cat, ani){
    return Boolean(invalid[ani] && invalid[ani].has(cat))
}
function unstable(form){
    if(form === 'H2CO3')
        return ['H2O', 'CO2']
    if(form === 'NH4OH')
        return ['NH3', 'H2O']
    if(form === 'H2O' || form === 'HOH')
        return ['H2O']
    return null
}
function isSalt(c1, a1){
    return  (a1 !== 'OH' && c1 !== 'H')
}

function solubility(cat, ani){
    // Fail-fast
    if(isInvalid(cat, ani))
        throw new Error(`${cat}, ${ani}`)
    if(ani === 'O')
        return false
    return !(blacklist[ani] && blacklist[ani].has(cat))
}

function putUp(ion, num){
    if(num === 1)
        return ion
    let upper = 0
    ;[...ion].forEach(c => upper += 'A' <= c && c <= 'Z')
    if(upper === 1)
        return ion + num
    return '(' + ion + ')' + num
}

function link(cat, ani){
    if(invalid[ani] && invalid[ani].has(cat))
        return null
    let coe = gcd(cations[cat], anions[ani])
    return putUp(cat, anions[ani]/coe) + putUp(ani, cations[cat]/coe)
}

function react(c1, a1, c2, a2){
    /*
    复分解反应
    */
    if(a1 === a2 || c1 === c2)
        return null
    if(isInvalid(c1, a1) || isInvalid(c2, a2))
        return null
    if(isInvalid(c1, a2) || isInvalid(c2, a1))
        return null
    if(unstable(link(c1, a1)) || unstable(link(c2, a2)))
        return null
    if(!solubility(c1, a1) && !solubility(c2, a2))
        return null
    if((isSalt(c1, a1) && a2==='O') || isSalt(c2, a2) && a1==='O'){
        return null
    }
    // 生成物中有沉淀或有气体或有水
    let result = [
        [link(c1, a1), link(c2, a2)], 
        [...(unstable(link(c1, a2)) || [link(c1, a2)]), ...(unstable(link(c2, a1)) || [link(c2, a1)])]
    ]
    let okay = false
    for(let form of result[1]){
        if(form === 'H2O' || gas.includes(form))
            okay = true
    }
    if(!solubility(c1, a2) || !solubility(c2, a1))
        okay = true
    // if(!okay)
    //     console.log('???:', result)
    // 反应物若无酸，需溶
    if((c1 !== 'H' && c2 !== 'H')){
        if(!solubility(c1, a1))
            okay = false
        if(!solubility(c2, a2))
            okay = false
    }
    if(okay)
        return result
    return null
}

function feeder(){
    let used = new Set()
    let a = Object.keys(anions), c = Object.keys(cations)
    for(let a1 of a){
        for(let c1 of c){
            for(let a2 of a){
                for(let c2 of c){
                    if(used.has(c2 + a2))
                        continue
                    used.add(c1 + a1)
                    let result = react(c1, a1, c2, a2)
                    if(result){
                        INVENTORY.push(result[0].join('+') + '=' + result[1].join('+'))
                    }
                }
            }
        }
    }
    // 自动生成SO3反应
    // for(let c of Object.keys(cations)){
    //     let a = link(c, 'OH')
    //     if(invalid.OH.has(c) || unstable(a) || !solubility(c, 'OH'))
    //         continue
    //     console.log(`${a}+SO3=${link(c, 'SO4')}+H2O`)
    // }
}
feeder()

})()

// utils
const isupper = c => c.toUpperCase() === c
const isletter = c => c.toUpperCase() !== c.toLowerCase()
function keep(a, b){
    for(let i of a)
        if(!b.has(i))
            a.delete(i)
}
function add(a, b){
    for(let i of b)
        a.add(i)
}
function isSameSet(a,b){
    // a须是Set, b是可迭代对象
    let tmp = new Set(b)
    if(a.size !== tmp.size)
        return false
    keep(tmp, a)
    return tmp.size === a.size
}
let cnt1=0, cnt2=0, cnt3 = 0

/* 第一部分：知识图谱搭建
核心维护映射book
init函数进行建立与覆盖重建

book = {
    "O2": {
        chu: {'<化学式>'...}        // O2能到的
        ru: {'<化学式>'...}         // 能到O2的
        huhuan: {'化学式'...}       // 与O2互换的
        fanying: {'化学式'...}      // O2能与之反应的
        elements: {'元素'...}       // 组成O2的元素
    },
    "化学式": {...},
    ...
} */
/*
3.9更新：trans
只要判断某个转化式是否存在即可
故直接储存每一项都排序后的转化式
*/

const book = new Map
const trans = new Map
function init(inventory=INVENTORY){
    // 优雅
    book.clear()
    for(let reaction of inventory){
        let [left, right] = reaction.split('=').map(v => v.split('+'))
        for(let formula of [...left, ...right]){
            if(!book.has(formula))
                book.set(formula,{
                    chu: new Set,
                    ru: new Set,
                    huhuan: new Set,
                    fanying: new Set,
                    elements: formulaToElements(formula)
                })
        }
        for(let i of left)
            for(let j of left)
                if(i !== j){
                    book.get(i).fanying.add(j)
                    book.get(j).fanying.add(i)
                }
        for(let l of left){
            for(let r of right){
                book.get(l).chu.add(r)
                book.get(r).ru.add(l)
                if(book.get(r).chu.has(l)){
                    book.get(l).huhuan.add(r)
                    book.get(r).huhuan.add(l)
                }
            }
        }
        // update 3.24 针对不同条件有不同反应
        // solve 里要多一层循环
        let key = left.sort().join('+')
        if(!trans.has(key))
            trans.set(key, [])
        trans.get(key).push([...right])
        // for(let r of right)
        //     trans.add(`${left.sort().join('+')}=${r}`)
    }
}
function formulaToElements(formula){
    let result = new Set
    for(let i=0;i<formula.length;i++){
        if(!isletter(formula[i]))
            continue
        if(isupper(formula[i])){
            if(i+1!==formula.length &&
            isletter(formula[i+1]) && !isupper(formula[i+1]))
                result.add(formula[i]+formula[i+1])
            else
                result.add(formula[i])
        }
    }
    return result
}

/* 第二部分：输入反应条件，建立未知物质的关系
核心维护映射board.get(x).(chu/ru/huhuan/fanying)
board开头的函数用于修改 */

let board = new Map

function createNode(l){
    if(board.has(l))
        return
    board.set(l, {
        chu: new Set,
        ru: new Set,
        huhuan: new Set,
        fanying: new Set,
        possible: new Set(book.keys()),
        ext: new Array,
        trans: new Set
    })
}

function boardChu(a, b){
    /**
     * 建立A到B的联系
     */
    createNode(a)
    createNode(b)
    board.get(a).chu.add(b)
    board.get(b).ru.add(a)
    if(board.get(a).ru.has(b)){     // 同时维护huhuan
        board.get(a).huhuan.add(b)
        board.get(b).huhuan.add(a)
    }
}
function boardFanying(a, b){
    /**
     * 建立A与B反应的联系
     */
    createNode(a)
    createNode(b)
    board.get(a).fanying.add(b)
    board.get(b).fanying.add(a)
}
function boardHuhuan(a, b){
    // 语义化
    boardChu(a, b)
    boardChu(b, a)
}

/* 第三部分：输入物质条件，限制可能性
核心维护board.get(x).possible */

function limit_containElements(letter, elements){
    /*
    限制：未知节点名letter必定含有elements中的至少一种元素
    */
    let possible = board.get(letter).possible
    for(let guess of possible){
        let hasSameElem = false
        for(let elem of book.get(guess).elements){
            if(elements.has(elem)){
                hasSameElem = true
                break
            }
        }
        if(!hasSameElem)
            possible.delete(guess)
    }
}
function limit_madeOf(letter, elements){
    /*
    限制：未知节点名letter必定由elements中的一种或多种元素组成
    */
    let possible = board.get(letter).possible
    for(let guess of possible){
        for(let elem of book.get(guess).elements){
            if(!elements.has(elem)){
                possible.delete(guess)
                break
            }
        }
}
}
function limit_elements(letter, elements){
    /**
     * 限制：确切的元素组成
     */
    let possible = board.get(letter).possible
    for(let guess of possible)
        if(!isSameSet(book.get(guess).elements, elements))
            possible.delete(guess)
}
function limit_elementNumber(letter, num){
    /**
     * 限制：不同元素数量
     */
    let possible = board.get(letter).possible
    for(let guess of possible){
        if(book.get(guess).elements.size !== num)
            possible.delete(guess)
    }
}
function limit_elementNumRange(letter, min, max){
    /**
     * 限制：元素数量范围
     * 包含边界
     * 可以替换上面的函数
     */
    let possible = board.get(letter).possible
    for(let guess of possible){
        if(!(book.get(guess).elements.size >= min && book.get(guess).elements.size <= max))
            possible.delete(guess)
    }
}
function limit_oxide(letter){
    /**
     * 限制：letter为氧化物
     */
    limit_elementNumber(letter, 2)
    limit_containElements(letter, new Set('O'))
}
function limit_possible(letter, possible){
    /**
     * 限制：直接限制可能答案
     */
    keep(board.get(letter).possible, possible)
}
function limit_transform(left, right){
    left.forEach(v1 => left.forEach(v2 => v1!==v2?boardFanying(v1, v2):null))
    left.forEach(l => right.forEach(r => boardChu(l, r)))
    for(let letter of [...left, ...right]){     // 排序除重，非必要
        board.get(letter).trans.add({
            left: `${[...left].sort().join('')}`,
            right: `${[...right].sort().join('')}`
        })
    }
}

// 第四部分：广搜预处理优化
/*
2024.3.10 完成该部分
有意义的六重循环
*/
function boardLimit(){
    /**
     * 在联系建立完成后调用此函数
     */
    // 根据路径数量优化可能性
    for(let letter of board.keys()){
        let node = board.get(letter)
        for(let guess of node.possible){
            if(book.get(guess).chu.size < node.chu.size ||
            book.get(guess).ru.size < node.ru.size ||
            book.get(guess).fanying.size < node.fanying.size ||
            book.get(guess).huhuan.size < node.huhuan.size)
                node.possible.delete(guess)
        }
    }
    /*
    这个部分的最外层循环遍历对象实际上可以改为队列
    但是有些繁杂了
    即使不用队列，最坏情况也只有(book.size*M*N*N)
    其中M是边数，N是节点数，受限于输入，一般不会超过两位数
    book.size目前是84
    所以最坏情况差不多要算八十万个循坏
    */
    // 彻底疯狂
    // 优化前：16866
    // 一轮优化：651
    // 完全优化：571
    const maxN = book.size
    const relative = {
        chu: 'ru',
        ru: 'chu',
        fanying: 'fanying',
        huhuan: 'huhuan'
    }
    cnt3 = 0
    let dirty = true
    for(let i of board){
        dirty = false
        for(let letter of board.keys()){
            let node = board.get(letter)
            for(let relation of ['chu', 'ru', 'fanying', 'huhuan']){
                for(let nextNode of [...node[relation]].map(v => board.get(v))){
                    // 根据 nextNode.possible 限制
                    let possible = new Set
                    for(let guess of nextNode.possible){
                        // 只要有一个guess能达到某个化学式，该化学式就是可能的
                        // 服了，JS没有并集
                        for(let form of book.get(guess)[relative[relation]]){
                            possible.add(form)
                            cnt3++
                        }
                        if(possible.size === maxN)
                            break
                    }
                    if(possible.size < maxN){
                        let before = node.possible.size
                        keep(node.possible, possible)
                        if(node.possible.size < before)
                            dirty = true
                    }
                }
            }
        }
        if(cnt3 > 800000 || !dirty)     // 提前推出优化(优化了优化)
            break
    }
    console.log(cnt3)
}


/*
第五部分：深搜回溯求解
*/
function solve(){
    boardLimit()
    const ans = []
    cnt1 = 0, cnt2 = 0
    function dfs(known, unknown, used){
        // 每下一层会假设一个物质为已知
        // 无一可知即为求得一解
        // known为对象
        // used为set，化学式
        // 全场最佳: break 与 continue (赐我一个goto吧)
        if(cnt2>60000000)
            throw new Error("运行超时")
        cnt1++
        if(!unknown.length){
            ans.push(new Map(Object.entries(known)))
            return
        }
        let cur_letter = unknown.pop()
        let node = board.get(cur_letter)    // 当前节点
        for(let guess of node.possible){
            // 检查该假设是否合理
            // TODO: 其他动态条件，例如"A和B的组成元素中有两种是相同的"
            // 需要满足的条件：
            // 1. 未被使用
            // 2. 与相邻节点的关系合理
            // 3. 如果有转换式，需匹配
            if(used.has(guess))
                continue
            let okay = true
            for(let relation of ['chu', 'ru', 'fanying']){
                for(let letter of node[relation]){
                    cnt2++
                    if(!known[letter])
                        continue
                    // 假设当前节点的化学式是guess，需验证的邻居的化学式为known[letter]
                    // 是否满足guess和known[letter]的relation关系
                    if(!book.get(guess)[relation].has(known[letter])){      // 动态的胜利！
                        okay = false
                        break
                    }
                }
                if(!okay)
                    break
            }
            if(!okay)
                continue        // 非必要，但性能敏感，所以直接退
            known[cur_letter] = guess
            for(let tran of node.trans){    // 笑
                // 究极性能的写法
                let s = ''
                let tmp = []
                let flag = true     // trans是否可检验？
                for(let i=tran.left.length-1;i>=0;i--)
                    if(known[tran.left[i]]){
                        tmp.push(known[tran.left[i]])
                    }else{
                        flag = false
                        break
                    }
                if(!flag) continue
                s += tmp.sort().join('+')
                if(!trans.has(s)){
                    okay = false
                    break
                }
                let any = false
                for(let expect of trans.get(s)){
                    // console.log(tmp, known, tran.right)
                    // 因为trans[i]项数很少(<3)所以使用array，不使用set
                    any = true
                    for(let i=tran.right.length-1;i>=0;i--){
                        if(known[tran.right[i]]){
                            if(!expect.includes(known[tran.right[i]])){         // 妙
                                any = false
                                break
                            }
                        }else{
                            break
                        }
                    }
                    if(any)
                        break
                }
                okay = any
                if(!okay)
                    break
            }
            if(okay){
                // known[cur_letter] = guess        迁移到前面了
                used.add(guess)
                dfs(known, unknown, used)
                used.delete(guess)
                // known[cur_letter] = null     // 可选
            }
        }
        known[cur_letter] = null
        unknown.push(cur_letter)
    }
    // 改变第二项参数的顺序是否会影响性能？
    dfs({}, Array.from(board.keys()), new Set)
    console.log(cnt1, cnt2)
    return {ans, cnt1, cnt2, cnt3}
}

/**
 * 第六部分
 * 处理输入
 */
function delSpace(s){
    return s.replace(/\s/g, '')
}
function input(s){
    /**
     * 3.23 更新
     */
    let result;
    // 链式转换
    if(s.match(/^[A-Z]([<>\=\-][A-Z])+$/i)){
        for(let i=1;i<s.length;i+=2){
            let a=s[i-1].toUpperCase(), b=s[i+1].toUpperCase()
            if(s[i] == '=')
                boardHuhuan(a, b)
            else if(s[i] == '>')
                boardChu(a, b)
            else if(s[i] == '<')
                boardChu(b, a)
            else if(s[i] == '-')
                boardFanying(a, b)
            else
                throw new Error()
        }
        return 0
    }
    if(s.match(/^[A-Z](\+[A-Z])*=[A-Z](\+[A-Z])*/i)){
        // 转换式限制
        let [left, right] = s.split('=').map(v => v.split('+').map(c => c.toUpperCase()))
        limit_transform(left, right)
        return 0
    }
    // 指定物质
    if(result = s.match(/^[a-zA-Z]:(?:([A-Z][\w()]*)|\[([A-Z][\w()]*(?:,[A-Z][\w()]*)*)\])$/)){
        if(result[1])
            limit_possible(s[0].toUpperCase(), new Set([result[1]]))
        else
            limit_possible(s[0].toUpperCase(), new Set(result[2].split(',')))
        return 0
    }
    if(result = s.match(/^\[([a-zA-Z]+)\]/)){
        let letters = [...result[1]]
        let part = s.slice(s.indexOf(']')+1)
        let lim;
        if(lim = part.match(/^\[((?:[A-Z]\w*)+)\]$/)){
            letters.forEach(v => limit_containElements(v.toUpperCase(), formulaToElements(lim[1])))
        }else if(lim = part.match(/^\{((?:[A-Z]\w*)+)\}$/)){
            letters.forEach(v => limit_madeOf(v.toUpperCase(), formulaToElements(lim[1])))
        }else if(lim = part.match(/^\(O\)$/)){
            letters.forEach(v => limit_oxide(v.toUpperCase()))
        }else if(lim = part.match(/^\(([0-9]+-[0-9]+)\)$/)){
            let [a, b] = lim[1].split('-')
            // [a, b] = [parseInt(a), parseInt(b)].sort()
            letters.forEach(v => limit_elementNumRange(v.toUpperCase(), parseInt(a), parseInt(b)))  // 排序细节防呆
        }else if(lim = part.match(/^\(([0-9])\)$/)){
            letters.forEach(v => limit_elementNumber(v.toUpperCase(), parseInt(lim[1])))
        }else{
            return 1
        }
        return 0
    }
    if(s.length === 1){
        createNode(s.toUpperCase())
        return 0
    }
    return 1;
}

export {INVENTORY, init, solve, input, board}
