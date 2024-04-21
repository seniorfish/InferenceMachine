import { expect, test } from "vitest";
import { Solver, makeConversionList, formulaToElements } from "../src/infer.js";

test("makeConversionList", () => {
    expect([...new Set(makeConversionList())].sort()).toMatchSnapshot();
});
test("formulaToElements", () => {
    let o = {
        "Cu(OH)2": ["Cu", "O", "H"],
        H2O: ["H", "O"],
        "Ca(HCO3)2": ["Ca", "H", "C", "O"],
    };
    for (let [k, v] of Object.entries(o)) {
        expect([...formulaToElements(k)].sort().join()).toEqual(
            v.sort().join()
        );
    }
});

const unique = [
    `a+b=d+e
b+c=e+f
d>f<g<f
e:NaCl
f:[CO2,CO]
g:[CO2,CO]
d:CaCO3
`,
    `g-d>a<b>c<f-i<h-g
d-b-f>h<d
b>e>h
d>e>f
b:[Cu,Fe2O3]
[ghef](1)
[adbci](O)
`,
    `a-e>d-f>c<b=a
e-b
e>c
c=d
e:HCl
B:NaOH
f:Fe2O3
`,
    `d=h=g-a>b-c>d-e-f>a
[abcdefgh]{HCONaSCu}
[agh](O)
E:[H2SO4,HNO3,HCl]`,
];
const mult = [
    `b+d=e
a+e=f
a+b=c
c+d=f
[def](1)
c:[CuSO4,Ca(OH)2]
b:H2SO4
a:[Fe,C,CuO,MnO2,Fe3O4]
`,
    `c<a>b
b=c>e=d>b
c-d-f-e
[abcdef](2-3)
b:H2O
f:HCl
d:Na2CO3
`,
    `f-e-a-d-c=b<a>g=f
g:H2
a:HCl
[bcdef](O)
`,
    `a+b+c=d
[abc]{CaHCO}
`,
    `c>a
c-a`,
`c+e=f
e+d=g
f>h-e
g>i-e
c>a>b>d
e:H2SO4
c:Fe2O3
b:Cu
[g][Cu]
[cd](O)
[ab](1)
[f][Fe]
[h][HICu]
`
];

test("Solve", () => {
    for (let c of unique) {
        let a = new Solver();
        c.split("\n").map((v) => a.input(v));
        let ans = a.solve();
        expect(ans.length).toBe(1);
    }
    for (let c of mult) {
        let a = new Solver();
        c.split("\n").map((v) => a.input(v));
        let ans = a.solve();
        expect(
            ans.map((v) =>
                    [...v.entries()]
                        .map((x) => x.join(":"))
                        .sort()
                        .join(",")
                )
                .sort()
                .join(";")
        ).toMatchSnapshot();
    }
    // expect((new Solver()).solve().length).toBe(1)
});
