// trackbuilder.js

// tracks object: tracknaam => 2D array van tiles
//Regel A — % is ALLEEN voor initial spawn
//Regel B — P1 / P2 zijn ALLEEN teleport landings
//Regel C — M = altijd volgende map in array
//
//if (!t) return false; // buiten de track
//if (["|","G","="].includes(t)) return false;

// start, finish en checkpoints altijd toegankelijk
//if (["S","C","%"].includes(t)) return true;

// minigame triggers
// if (["B","J","L"].includes(t)) return true;

// lane-restricties
//if ((t === "1" && p.lane !== "1") ||
//    (t === "2" && p.lane !== "2") ||
//    (t === "H" && p.lane !== "1") ||
//    (t === "Y" && p.lane !== "2")) return false;
//
//
//
export const tracks = {

    LVL1: { map: [
                    ["**||*||**||**||**||**||**||**||**||**||**||**||**||**"],
                    ["*111111C11111111NNNNNY222>BBBBBOBBBBB<22222C22222222*"],
                    ["|111111C11111111NNNNNY222>BBBBBOBBBBB<22222C22222222|"],
                    ["|11=============NNNN==============================22|"],
                    ["*11=222C22222222NNNNNH111>BBBBBOBBBBB<11111C11111=22*"],
                    ["*11=222C22222222NNNNNH111>BBBBBOBBBBB<11111C11111=22*"],
                    ["|11=22||**||**||**||**||**||**||**||**||**||***11=22|"],
                    ["|11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22|"],
                    ["*11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22*"],
                    ["*11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22*"],
                    ["|11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22|"],
                    ["|11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22|"],
                    ["*11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22*"],
                    ["*11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22*"],
                    ["|11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22|"],
                    ["|11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22|"],
                    ["*11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22*"],
                    ["*11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22*"],
                    ["|11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22|"],
                    ["|11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22|"],
                    ["*11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22*"],
                    ["*11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22*"],
                    ["|11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|%1=%2|"],
                    ["|11=22***||**||**||**||**||**||**||**||**||**||SS=SS|"],
                    ["*11=222222C222222222222222222YNNNNN111111C1111111=22*"],
                    ["*11=222222C222222222222222222YNNNNN111111C1111111=22*"],
                    ["|11============================NNNN===============22|"],
                    ["|111111111C111111111111111111HNNNNN222222C2222222222|"],
                    ["*111111111C111111111111111111HNNNNN222222C2222222222*"],
                    ["**||**||**||**||**||**||**||**||**||**||**||**||*||**"]
            ],
            name: "Balance"
    },
    LVL2: {
                map: [
                    ["**||*||**||**||**||**||**||**||**||**||**||**||**||**"],
                    ["*11111C111111111NNNNNY222>LIIIIIIIIIL<22222C22222222*"],
                    ["|11111C111111111NNNNNY222>LIIIIIIIIIL<22222C22222222|"],
                    ["|11=============NNNN==============================22|"],
                    ["*11=22C222222222NNNNNH111>LIIIIIIIIIL<11111C11111=22*"],
                    ["*11=22C222222222NNNNNH111>LIIIIIIIIIL<11111C11111=22*"],
                    ["|11=22||**||**||**||**||**||**||**||**||**||***11=22|"],
                    ["|11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22|"],
                    ["*11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22*"],
                    ["*11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22*"],
                    ["|11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22|"],
                    ["|11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22|"],
                    ["*11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22*"],
                    ["*11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22*"],
                    ["|11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22|"],
                    ["|11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22|"],
                    ["*11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22*"],
                    ["*11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22*"],
                    ["|11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22|"],
                    ["|11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22|"],
                    ["*11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22*"],
                    ["*11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22*"],
                    ["|11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|%1=%2|"],
                    ["|11=22***||**||**||**||**||**||**||**||**||**||SS=SS|"],
                    ["*11=222222C222222222222222222YNNNNN111111C1111111=22*"],
                    ["*11=222222C222222222222222222YNNNNN111111C1111111=22*"],
                    ["|11============================NNNN===============22|"],
                    ["|111111111C111111111111111111HNNNNN222222C2222222222|"],
                    ["*111111111C111111111111111111HNNNNN222222C2222222222*"],
                    ["**||**||**||**||**||**||**||**||**||**||**||**||*||**"]
        ],
        name: "Loop"
        },



    LVL3: {
        map:[
                ["**||*||**||**||**||**||**||**||**||**||**||**||**||**"],
                ["*11111C111111111NNNNNY222>JO|O|O|O|O|<22222C22222222*"],
                ["|11111C111111111NNNNNY222>JO|O|O|O|O|<22222C22222222|"],
                ["|11=============NNNN==============================22|"],
                ["*11=22C222222222NNNNNH111>JO|O|O|O|O|<11111C11111=22*"],
                ["*11=22C222222222NNNNNH111>JO|O|O|O|O|<11111C11111=22*"],
                ["|11=22||**||**||**||**||**||**||**||**||**||***11=22|"],
                ["|11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22|"],
                ["*11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22*"],
                ["*11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22*"],
                ["|11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22|"],
                ["|11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22|"],
                ["*11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22*"],
                ["*11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22*"],
                ["|11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22|"],
                ["|11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22|"],
                ["*11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22*"],
                ["*11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22*"],
                ["|11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22|"],
                ["|11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22|"],
                ["*11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22*"],
                ["*11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22*"],
                ["|11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|%1=%2|"],
                ["|11=22***||**||**||**||**||**||**||**||**||**||SS=SS|"],
                ["*11=222222C222222222222222222YNNNNN1111111C111111=22*"],
                ["*11=222222C222222222222222222YNNNNN1111111C111111=22*"],
                ["|11============================NNNN===============22|"],
                ["|111111111C111111111111111111HNNNNN2222222C222222222|"],
                ["*111111111C111111111111111111HNNNNN2222222C222222222*"],
                ["**||**||**||**||**||**||**||**||**||**||**||**||*||**"]
          ],
          name: "Jump"
},


LVL4_1: {
        map:[
                ["|||||||||||||||||||||||||||||||||||||||||||||||||||||||"],
                ["|11111C11111|11111111111111111111111111111111C11111111M"],
                ["|11111C11111|11111111111111111111111111111111C11111111M"],
                ["|11=======11|11========================================"],
                ["|11=22C22=11|11=22222222222222222222222222222C22222222M"],
                ["|11=22C22=11|11=22222222222222222222222222222C22222222M"],
                ["|11=22|22=11|11=22GGGGGGGG|||||||||||||||||||||||||||||"],
                ["|11=22|22=11|11=22GGGGGGGG22222222C22222222222|11111HP1"],
                ["|11=22|22=11|11=22GGGGGGGG22222222C22222222222|11111HP*"],
                ["|11=22|22=11|11=22GGGGGGGG22================22|11======"],
                ["|11=22|22=11|11=22GGGGGGGG22=11111C11111111=22|11=22YP2"],
                ["|HH=YY|22=11|11=22GGGGGGGG22=11111C11111111=22|11=22YP*"],
                ["|NNNNN|22=11|11=22GGGGGGGG22=11GGGGGGGGGG11=22|11=22|||"],
                ["|NNNNN|22=11|11=222222222222=11GGGGGGGGGG11=22|NNNNN|G|"],
                ["|NNNNN|22=11|11=222222222222=11GGGGGGGGGG11=22|NNNNN|G|"],
                ["|NNNNN|22=11|11==============11GGGGGGGGGG11=22|NNNNN|G|"],
                ["|22=11|22=11|111111111111111111GGGGGGGGGG11=22|NNNNN|G|"],
                ["|22=11|22=11|111111111111111111GGGGGGGGGG11=22|HH=YY|G|"],
                ["|22=11|22=11|||||||||||||||||||GGGGGGGGGG11=22|11=22|G|"],
                ["|22=11|22=111111111111111111111111111111111=22|11=22|G|"],
                ["|22=11|22=111111111111111111111111111111111=22|11=22|G|"],
                ["|22=11|22===================================22|11=22|G|"],
                ["|22=11|222222222222222222222222222222222222222|11=22|G|"],
                ["|22=11|222222222222222222222222222222222222222|%1=%2|G|"],
                ["|22=11|||||||||||||||||||||||||||||||||||||||||SS=SS|G|"],
                ["|22=111111C111111111111111111111111111111C1111111=22|G|"],
                ["|22=111111C111111111111111111111111111111C1111111=22|G|"],
                ["|22===============================================22|G|"],
                ["|222222222C222222222222222222222222222222C2222222222|G|"],
                ["|222222222C222222222222222222222222222222C2222222222|G|"],
                ["|||||||||||||||||||||||||||||||||||||||||||||||||||||||"]
          ],
                  name: "EasyEndurance"

},


LVL4_2: {
    map:[
                ["|||||||||||||||||||||||||||||||||||||||||||||||||||||"],
                ["P1H111C11111|11111111111111111111111111111111C111111|"],
                ["P*H111C11111|11111111111111111111111111111111C111111|"],
                ["==========11|11===================================11|"],
                ["P2Y222C22=11|11=22222222222222222222222222222C222=11|"],
                ["P*Y222C22=11|11=22222222222222222222222222222C222=11|"],
                ["|||||||22=11|11=22GGGGGGGG|||||||||||||||||||||22=11|"],
                ["M11111|22=11|11=22GGGGGGGG22222222C22222222222|22=11|"],
                ["M11111|22=11|11=22GGGGGGGG22222222C22222222222|22=11|"],
                ["====11|22=11|11=22GGGGGGGG22================22|22=11|"],
                ["M22=11|22=11|11=22GGGGGGGG22=11111C11111111=22|22=11|"],
                ["M22=11|22=11|11=22GGGGGGGG22=11111C11111111=22|22=11|"],
                ["|22=11|22=11|11=22GGGGGGGG22=11GGGGGGGGGG11=22|22=11|"],
                ["|22=11|22=11|11=222222222222=11GGGGGGGGGG11=22|NNNNN|"],
                ["|22=11|22=11|11=222222222222=11GGGGGGGGGG11=22|NNNNN|"],
                ["|22=11|22=11|11==============11GGGGGGGGGG11=22|NNNNN|"],
                ["|22=11|22=11|111111111111111111GGGGGGGGGG11=22|NNNNN|"],
                ["|22=11|22=11|111111111111111111GGGGGGGGGG11=22|HH=YY|"],
                ["|22=11|22=11|||||||||||||||||||GGGGGGGGGG11=22|11=22|"],
                ["|22=11|22=111111111111111111111111111111111=22|11=22|"],
                ["|22=11|22=111111111111111111111111111111111=22|11=22|"],
                ["|22=11|22===================================22|11=22|"],
                ["|22=11|222222222222222222222222222222222222222|11=22|"],
                ["|22=11|222222222222222222222222222222222222222|11=22|"],
                ["|22=11|||||||||||||||||||||||||||||||||||||||||11=22|"],
                ["|22=111111C11111111111111111111111111111111111111=22|"],
                ["|22=111111C11111111111111111111111111111111111111=22|"],
                ["|22===============================================22|"],
                ["|222222222C22222222222222222222222222222222222222222|"],
                ["|222222222C22222222222222222222222222222222222222222|"],
                ["|||||||||||||||||||||||||||||||||||||||||||||||||||||"]
            ],
    name: "EasyEndurance2"

},


LVL5: {
    map:[
            ["**||*||**||**||**||**||**||**||**||**||**||**||**||**"],
            ["*11111C111111111NNNNNY222>JIIIIIIIIIJ<22222C22222222*"],
            ["|11111C111111111NNNNNY222>JIIIIIIIIIJ<22222C22222222|"],
            ["|11=============NNNN==============================22|"],
            ["*11=22C222222222NNNNNH111>JIIIIIIIIIJ<11111C11111=22*"],
            ["*11=22C222222222NNNNNH111>JIIIIIIIIIJ<11111C11111=22*"],
            ["|11=22||**||**||**||**||**||**||**||**||**||***11=22|"],
            ["|11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22|"],
            ["*11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22*"],
            ["*11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22*"],
            ["|11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22|"],
            ["|11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22|"],
            ["*11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22*"],
            ["*11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22*"],
            ["|11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22|"],
            ["|11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22|"],
            ["*11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22*"],
            ["*11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22*"],
            ["|11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22|"],
            ["|11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22|"],
            ["*11=22|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG*11=22*"],
            ["*11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|11=22*"],
            ["|11=22*GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG|%1=M2|"],
            ["|11=22***||**||**||**||**||**||**||**||**||**||SS=SS|"],
            ["*11=222222C222222222222222222YNNNNN1111111C111111=22*"],
            ["*11=222222C222222222222222222YNNNNN1111111C111111=22*"],
            ["|11============================NNNN===============22|"],
            ["|111111111C111111111111111111HNNNNN2222222C222222222|"],
            ["*111111111C111111111111111111HNNNNN2222222C222222222*"],
            ["**||**||**||**||**||**||**||**||**||**||**||**||*||**"]
    ],
    name: "Acrodrive"

}

};
